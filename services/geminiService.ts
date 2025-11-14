import { GoogleGenAI, Type } from "@google/genai";
import { AndreaniDocument } from '../types';


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const processDocumentWithGemini = async <T,>(
    file: File,
    prompt: string,
    schema: any
): Promise<T | null> => {
    try {
        const filePart = await fileToGenerativePart(file);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    filePart,
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        return parsedJson as T;

    } catch (error) {
        console.error("Error processing document with Gemini:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        alert(`Error al procesar el documento: ${errorMessage}. Verifique su clave de API y la consola para más detalles.`);
        return null;
    }
};

export const getAndreaniTrackingInfo = async (
    trackingNumber: string
): Promise<AndreaniDocument | null> => {
    const prompt = `Simula la información de seguimiento para una carta documento de Andreani con el número de seguimiento '${trackingNumber}'. El remitente es siempre "Sapac.SA / Fiorasi". Genera datos realistas para los siguientes campos: destinatario (nombre y apellido), fecha de envío (en formato DD/MM/AAAA), fecha de entrega (DD/MM/AAAA o 'N/A' si no fue entregada), y situación ('entregada', 'en sucursal', 'en distribución', 'devuelta al remitente'). Asegúrate de que el número de seguimiento en la respuesta sea exactamente '${trackingNumber}'. Responde únicamente con un objeto JSON.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            destinatario: { type: Type.STRING, description: 'Apellido y Nombre del destinatario.' },
            remitente: { type: Type.STRING, description: 'Nombre del remitente, siempre "Sapac.SA / Fiorasi".' },
            fechaEnvio: { type: Type.STRING, description: 'Fecha de envío en formato DD/MM/AAAA.' },
            fechaEntrega: { type: Type.STRING, description: 'Fecha de entrega en formato DD/MM/AAAA. Si no está, poner N/A.' },
            numeroSeguimiento: { type: Type.STRING, description: 'El número de seguimiento o tracking.' },
            situacion: { type: Type.STRING, description: 'Estado del envío.' },
        },
        required: ['destinatario', 'remitente', 'fechaEnvio', 'fechaEntrega', 'numeroSeguimiento', 'situacion']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        if (parsedJson) {
            parsedJson.remitente = "Sapac.SA / Fiorasi";
        }

        return parsedJson as AndreaniDocument;

    } catch (error) {
        console.error("Error fetching tracking info from Gemini:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        alert(`Error al obtener la información de seguimiento: ${errorMessage}. Verifique la consola para más detalles.`);
        return null;
    }
};

export const extractTextFromFile = async (file: File): Promise<string | null> => {
    try {
        const filePart = await fileToGenerativePart(file);
        const prompt = "Extrae el texto completo y sin formato del siguiente documento. Responde únicamente con el texto extraído.";
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [filePart, { text: prompt }] }
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Error extracting text from file:", error);
        alert(`Error al extraer texto del archivo.`);
        return null;
    }
};

export const generateLegalTemplate = async (templateType: string, customPrompt: string): Promise<string | null> => {
    const prompt = `Genera una plantilla de documento legal en español para el siguiente propósito: "${templateType}". ${customPrompt ? `Considera esta petición adicional: "${customPrompt}".` : ''} La plantilla debe ser profesional, clara y contener placeholders comunes entre llaves dobles (ej: {{nombre_completo}}, {{dni}}, {{fecha_actual}}, {{domicilio}}). Responde únicamente con el texto completo de la plantilla en formato de texto plano.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating template:", error);
        alert('Error al generar la plantilla.');
        return null;
    }
};


export const extractPlaceholders = async (templateText: string): Promise<string[] | null> => {
    const prompt = `Analiza el siguiente texto y extrae todos los placeholders o campos a rellenar. Los placeholders están entre llaves dobles (ej: {{nombre}}, {{dni}}). Devuelve únicamente un array de strings JSON con los nombres de los placeholders encontrados, sin las llaves. Por ejemplo, si encuentras "{{nombre_completo}}" y "{{fecha}}", la respuesta debe ser ["nombre_completo", "fecha"]. Si no encuentras ninguno, devuelve un array vacío. Texto: "${templateText}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error extracting placeholders:", error);
        alert('Error al analizar la plantilla en busca de placeholders.');
        return null;
    }
};

export const getLegalConsultation = async (
    userQuery: string
): Promise<{ expertResponse: string; generalResponse: string } | null> => {
    const basePrompt = `Soy abogado consultor y redactor de la parte empleadora (en este caso Ford Fiorasi) teniendo en cuenta la legislación vigente y lo que dice el manual de derecho laboral de Julio Armando Grisolia 2022 en principal u otro para fundamentar en los doctrinarios y la misma legislación vigente LCT y el convenio vigente entre SMATA y ACARA si correspondiere para el caso concreto que te pregunte. Todo esto sin inventar, si no supieras me lo decís. Contestame o ayudame a redactar mejor lo siguiente: `;

    const expertFullPrompt = `${basePrompt} "${userQuery}"`;
    const generalFullPrompt = userQuery;

    try {
        const [expertResponse, generalResponse] = await Promise.all([
            ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: expertFullPrompt,
            }),
            ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: generalFullPrompt,
            })
        ]);

        return {
            expertResponse: expertResponse.text.trim(),
            generalResponse: generalResponse.text.trim(),
        };
    } catch (error) {
        console.error("Error during legal consultation:", error);
        alert('Ocurrió un error al realizar la consulta. Revise la consola para más detalles.');
        return null;
    }
};