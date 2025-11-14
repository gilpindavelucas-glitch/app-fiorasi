import React, { useState, useCallback } from 'react';
import { processDocumentWithGemini } from '../services/geminiService';
import { UploadIcon, SpinnerIcon, FileIcon, FolderIcon, SearchEditIcon, ExcelIcon } from './Icons';
import { LegalDocument } from '../types';
import { Type } from '@google/genai';
import { EmployeeEditModal } from './EmployeeEditModal';
import { FolderViewModal } from './FolderViewModal';
import { exportToExcel } from '../utils/excelExporter';


interface AntecedentesManagerProps {
    documents: LegalDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<LegalDocument[]>>;
}

type ModalType = 'edit' | 'folder' | null;

export const AntecedentesManager: React.FC<AntecedentesManagerProps> = ({ documents, setDocuments }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingFile, setProcessingFile] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const prompt = `Analiza el documento adjunto de un empleado. Extrae y devuelve el texto completo del documento. Adicionalmente, extrae la siguiente información estructurada: nombre y apellido, fecha del documento (en formato DD/MM/AAAA), tipo de antecedente (ej: 'llamado de atención', 'suspensión', 'descargo'), y un resumen breve. Responde únicamente con un objeto JSON que contenga tanto el texto completo como los datos estructurados.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            nombreCompleto: { type: Type.STRING, description: 'Nombre y apellido completos del empleado.' },
            fecha: { type: Type.STRING, description: 'Fecha del documento en formato DD/MM/AAAA.' },
            tipoAntecedente: { type: Type.STRING, description: 'Clasificación del antecedente.' },
            resumen: { type: Type.STRING, description: 'Un resumen breve del contenido del documento.' },
            textoCompleto: { type: Type.STRING, description: 'El texto completo y sin formato extraído del documento.' },
        },
        required: ['nombreCompleto', 'fecha', 'tipoAntecedente', 'resumen', 'textoCompleto'],
    };

    const processFiles = useCallback(async (files: File[]) => {
        setIsProcessing(true);
        const newResults: LegalDocument[] = [];
        for (const file of files) {
            setProcessingFile(file.name);
            const result = await processDocumentWithGemini<Omit<LegalDocument, 'id' | 'originalFileName'>>(file, prompt, schema);
            if (result) {
                newResults.push({ 
                    ...result, 
                    id: crypto.randomUUID(),
                    originalFileName: file.name 
                });
            }
        }
        setDocuments(prev => [...prev, ...newResults]);
        setIsProcessing(false);
        setProcessingFile(null);
    }, [prompt, schema, setDocuments]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) processFiles(Array.from(files));
    }, [processFiles]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer.files;
        if (files) processFiles(Array.from(files));
    }, [processFiles]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleExport = () => {
        exportToExcel(documents, 'antecedentes');
    };
    
    return (
        <>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[var(--primary-color)]">Gestor de Antecedentes Legales</h2>

                {/* File Upload Area */}
                <div 
                    className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-8 text-center bg-[var(--secondary-color)] transition-colors hover:border-[var(--primary-color)]"
                    onDrop={handleDrop} onDragOver={handleDragOver}
                >
                    <input type="file" id="file-upload" multiple onChange={handleFileChange} className="hidden" disabled={isProcessing} accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.odt" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center">
                            {isProcessing ? (
                                <>
                                    <SpinnerIcon className="w-12 h-12 text-[var(--primary-color)] animate-spin" />
                                    <p className="mt-4 text-lg font-semibold">Procesando...</p>
                                    <p className="text-sm text-gray-500">{processingFile}</p>
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-12 h-12 text-[var(--primary-color)]" />
                                    <p className="mt-4 text-lg font-semibold">Arrastra y suelta archivos aquí</p>
                                    <p className="text-sm text-gray-500">o haz clic para seleccionar</p>
                                    <p className="text-xs text-gray-400 mt-2">Soporta DOC, DOCX, PDF, ODT, JPG, PNG, etc.</p>
                                </>
                            )}
                        </div>
                    </label>
                </div>
                
                {/* Actions Panel */}
                <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                    <h3 className="text-lg font-semibold mb-3">Acciones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => setActiveModal('folder')} 
                            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[var(--primary-color-light)]"
                            disabled={documents.length === 0}
                            title={documents.length === 0 ? "Procese documentos para activar esta opción" : "Organizar documentos en carpetas virtuales"}
                        >
                            <FolderIcon className="w-8 h-8 text-[var(--primary-color)] mb-2" />
                            <span className="font-semibold">Organizar Carpetas</span>
                        </button>
                        <button 
                            onClick={handleExport} 
                            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[var(--primary-color-light)]"
                            disabled={documents.length === 0}
                            title={documents.length === 0 ? "Procese documentos para activar esta opción" : "Generar y descargar reporte en Excel"}
                        >
                            <ExcelIcon className="w-8 h-8 text-green-600 mb-2" />
                            <span className="font-semibold">Generar Reporte Excel</span>
                        </button>
                        <button 
                            onClick={() => setActiveModal('edit')} 
                            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[var(--primary-color-light)]"
                            disabled={documents.length === 0}
                            title={documents.length === 0 ? "Procese documentos para activar esta opción" : "Buscar, editar y agregar antecedentes por empleado"}
                        >
                            <SearchEditIcon className="w-8 h-8 text-orange-500 mb-2" />
                            <span className="font-semibold">Buscar y Editar Empleado</span>
                        </button>
                    </div>
                </div>


                {/* Results Table */}
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Resultados de Procesamiento</h3>
                    <div className="overflow-x-auto bg-white rounded-lg shadow border border-[var(--border-color)]">
                        {documents.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--secondary-color)]">
                                    <tr>
                                        {['Apellido y Nombre', 'Fecha', 'Tipo de Antecedente', 'Resumen', 'Archivo Original'].map(header => (
                                            <th key={header} className="px-6 py-3 font-medium text-[var(--primary-color)] uppercase tracking-wider">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {documents.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{item.nombreCompleto}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{item.fecha}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{item.tipoAntecedente}</td>
                                            <td className="px-6 py-4 whitespace-normal max-w-sm truncate">{item.resumen}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <FileIcon className="w-4 h-4 text-gray-400" />
                                                    {item.originalFileName}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="p-6 text-center text-gray-500">No se han procesado archivos todavía.</p>
                        )}
                    </div>
                </div>
            </div>

            {activeModal === 'edit' && (
                <EmployeeEditModal
                    isOpen={activeModal === 'edit'}
                    onClose={() => setActiveModal(null)}
                    documents={documents}
                    setDocuments={setDocuments}
                />
            )}
            {activeModal === 'folder' && (
                <FolderViewModal
                    isOpen={activeModal === 'folder'}
                    onClose={() => setActiveModal(null)}
                    documents={documents}
                />
            )}
        </>
    );
}