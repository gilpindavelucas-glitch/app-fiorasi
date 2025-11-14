import React, { useState, useMemo } from 'react';
import { extractTextFromFile, generateLegalTemplate, extractPlaceholders, getLegalConsultation } from '../services/geminiService';
import { SpinnerIcon, UploadIcon } from './Icons';

type Mode = 'generate' | 'upload' | 'consult';

export const DocumentGenerator: React.FC = () => {
    const [mode, setMode] = useState<Mode>('generate');
    const [isLoading, setIsLoading] = useState(false);
    
    // States for generate/upload modes
    const [templateText, setTemplateText] = useState('');
    const [placeholders, setPlaceholders] = useState<string[]>([]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [templateType, setTemplateType] = useState('Llamado de atención');
    const [customPrompt, setCustomPrompt] = useState('');
    const [fileName, setFileName] = useState('');

    // States for consult mode
    const [consultQuery, setConsultQuery] = useState('');
    const [isConsulting, setIsConsulting] = useState(false);
    const [consultResult, setConsultResult] = useState<{ expertResponse: string; generalResponse: string } | null>(null);

    const handleGenerateTemplate = async () => {
        setIsLoading(true);
        setTemplateText('');
        setPlaceholders([]);
        setFormData({});
        const result = await generateLegalTemplate(templateType, customPrompt);
        if (result) {
            setTemplateText(result);
        }
        setIsLoading(false);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setTemplateText('');
        setPlaceholders([]);
        setFormData({});
        setFileName(file.name);
        const result = await extractTextFromFile(file);
        if (result) {
            setTemplateText(result);
        }
        setIsLoading(false);
    };
    
    const handleAnalyze = async () => {
        if (!templateText) return;
        setIsLoading(true);
        const result = await extractPlaceholders(templateText);
        if (result) {
            setPlaceholders(result);
            const initialFormData: Record<string, string> = {};
            result.forEach(p => initialFormData[p] = '');
            setFormData(initialFormData);
        }
        setIsLoading(false);
    };

    const handleFormChange = (placeholder: string, value: string) => {
        setFormData(prev => ({...prev, [placeholder]: value}));
    };

    const handleConsult = async () => {
        if (!consultQuery.trim()) return;
        setIsConsulting(true);
        setConsultResult(null);
        const result = await getLegalConsultation(consultQuery);
        if (result) {
            setConsultResult(result);
        }
        setIsConsulting(false);
    };
    
    const finalDocument = useMemo(() => {
        return templateText.replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
            const key = placeholder.trim();
            return formData[key] || match;
        });
    }, [templateText, formData]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(finalDocument);
        alert('Documento copiado al portapapeles.');
    };

    const downloadTxtFile = () => {
        const element = document.createElement("a");
        const file = new Blob([finalDocument], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        const docName = templateType.replace(/\s+/g, '_') || 'documento';
        element.download = `${docName}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const renderTabs = () => (
        <div className="flex border-b border-[var(--border-color)]">
            <button onClick={() => setMode('generate')} className={`px-4 py-2 text-sm font-medium ${mode === 'generate' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' : 'text-gray-500'}`}>
                Crear desde Plantilla (IA)
            </button>
            <button onClick={() => setMode('upload')} className={`px-4 py-2 text-sm font-medium ${mode === 'upload' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' : 'text-gray-500'}`}>
                Cargar desde Archivo (.docx)
            </button>
            <button onClick={() => setMode('consult')} className={`px-4 py-2 text-sm font-medium ${mode === 'consult' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' : 'text-gray-500'}`}>
                Consultor IA
            </button>
        </div>
    );

    const renderGeneratorView = () => (
        <>
            {/* Step 1: Get Template */}
            <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                <h3 className="font-semibold mb-3 text-gray-800">Paso 1: Obtener Plantilla Base</h3>
                {mode === 'generate' ? (
                    <div className="space-y-3">
                        <select value={templateType} onChange={e => setTemplateType(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option>Llamado de atención</option>
                            <option>Sanción disciplinaria</option>
                            <option>Notificación de suspensión</option>
                            <option>Solicitud de descargo</option>
                            <option>Modelo Carta Documento Andreani</option>
                        </select>
                        <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Añadir detalles o peticiones específicas (opcional)..." rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        <button onClick={handleGenerateTemplate} disabled={isLoading} className="px-4 py-2 rounded-md font-medium bg-[var(--primary-color)] text-white hover:opacity-90 disabled:bg-gray-400">
                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Generar Plantilla'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <input type="file" id="doc-upload" onChange={handleFileChange} className="hidden" accept=".docx" disabled={isLoading}/>
                        <label htmlFor="doc-upload" className={`w-full border-2 border-dashed border-[var(--border-color)] rounded-lg p-6 text-center transition-colors ${isLoading ? 'cursor-wait' : 'cursor-pointer hover:border-[var(--primary-color)]'}`}>
                            {isLoading ? <SpinnerIcon className="w-8 h-8 mx-auto animate-spin text-[var(--primary-color)]" /> : <UploadIcon className="w-8 h-8 mx-auto text-[var(--primary-color)]" />}
                            <p className="mt-2 text-sm font-semibold">{fileName || 'Haz clic o arrastra un archivo .docx aquí'}</p>
                        </label>
                    </div>
                )}
            </div>

            {/* Step 2: Edit & Analyze */}
            {templateText && (
                <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                    <h3 className="font-semibold mb-3 text-gray-800">Paso 2: Edita la Plantilla y Analiza</h3>
                    <textarea value={templateText} onChange={e => setTemplateText(e.target.value)} rows={10} className="w-full border border-gray-300 rounded-md p-2 text-sm font-mono" />
                    <button onClick={handleAnalyze} disabled={isLoading || !templateText} className="mt-3 px-4 py-2 rounded-md font-medium bg-[var(--primary-color)] text-white hover:opacity-90 disabled:bg-gray-400">
                        {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Analizar para Rellenar Campos'}
                    </button>
                </div>
            )}

            {/* Step 3: Fill Data */}
            {placeholders.length > 0 && (
                <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                    <h3 className="font-semibold mb-3 text-gray-800">Paso 3: Completa los Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {placeholders.map(p => (
                            <div key={p}>
                                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">{p.replace(/_/g, ' ')}</label>
                                <input type="text" value={formData[p] || ''} onChange={e => handleFormChange(p, e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Step 4: Preview & Export */}
            {Object.values(formData).some(v => v) && (
                 <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                    <h3 className="font-semibold mb-3 text-gray-800">Paso 4: Previsualiza y Exporta</h3>
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                        {finalDocument}
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button onClick={copyToClipboard} className="px-4 py-2 rounded-md font-medium bg-gray-600 text-white hover:bg-gray-700">Copiar Texto</button>
                        <button onClick={downloadTxtFile} className="px-4 py-2 rounded-md font-medium bg-green-600 text-white hover:bg-green-700">Descargar .txt</button>
                    </div>
                 </div>
            )}
        </>
    );

    const renderConsultantView = () => (
        <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                <h3 className="font-semibold mb-2 text-gray-800">Consulta Legal</h3>
                <p className="text-sm text-gray-500 mb-3">Escribe tu consulta o el borrador que necesites mejorar. La IA te proporcionará dos perspectivas: una como consultor legal experto y otra como asistente general.</p>
                <textarea 
                    value={consultQuery}
                    onChange={e => setConsultQuery(e.target.value)}
                    placeholder="Ej: 'Redactar un párrafo para un llamado de atención por uso indebido de herramientas de trabajo...'"
                    rows={4}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                />
                <button onClick={handleConsult} disabled={isConsulting || !consultQuery.trim()} className="mt-3 px-4 py-2 rounded-md font-medium bg-[var(--primary-color)] text-white hover:opacity-90 disabled:bg-gray-400">
                    {isConsulting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Consultar'}
                </button>
            </div>

            {isConsulting && (
                 <div className="text-center p-8">
                    <SpinnerIcon className="w-10 h-10 mx-auto animate-spin text-[var(--primary-color)]" />
                    <p className="mt-3 text-gray-600">Consultando a los asistentes de IA...</p>
                 </div>
            )}

            {consultResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Expert Consultant */}
                    <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                        <h4 className="font-bold text-lg text-[var(--primary-color)] mb-3">Consultor Legal (Gemini Pro)</h4>
                        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap overflow-x-auto h-96">
                            {consultResult.expertResponse}
                        </div>
                    </div>
                    {/* General Assistant */}
                     <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                        <h4 className="font-bold text-lg text-gray-700 mb-3">Asistente General (Simulado)</h4>
                        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap overflow-x-auto h-96">
                            {consultResult.generalResponse}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--primary-color)]">Generador de Documentos</h2>
            {renderTabs()}
            <div className="mt-4">
                {mode === 'consult' ? renderConsultantView() : renderGeneratorView()}
            </div>
        </div>
    );
};