
import React, { useState, useCallback } from 'react';
import { processDocumentWithGemini } from '../services/geminiService';
import { UploadIcon, SpinnerIcon, FileIcon } from './Icons';
import type { Column } from '../types';

interface FileProcessorProps<T> {
    title: string;
    prompt: string;
    schema: any;
    onProcessComplete: (data: T[]) => void;
    data: T[];
    columns: Column<T>[];
}

export function FileProcessor<T extends { originalFileName: string }>({
    title,
    prompt,
    schema,
    onProcessComplete,
    data,
    columns,
}: FileProcessorProps<T>) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingFile, setProcessingFile] = useState<string | null>(null);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        processFiles(Array.from(files));
    }, [prompt, schema]);
    
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
    }, [prompt, schema]);


    const processFiles = async (files: File[]) => {
        setIsProcessing(true);
        const newResults: T[] = [];
        for (const file of files) {
            setProcessingFile(file.name);
            const result = await processDocumentWithGemini<Omit<T, 'originalFileName'>>(file, prompt, schema);
            if (result) {
                newResults.push({ ...result, originalFileName: file.name } as T);
            }
        }
        onProcessComplete([...data, ...newResults]);
        setIsProcessing(false);
        setProcessingFile(null);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--primary-color)]">{title}</h2>

            <div 
                className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-8 text-center bg-[var(--secondary-color)] transition-colors hover:border-[var(--primary-color)]"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isProcessing}
                />
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
                                <p className="text-xs text-gray-400 mt-2">Soporta DOC, DOCX, PDF, JPG, PNG, etc.</p>
                            </>
                        )}
                    </div>
                </label>
            </div>

            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Resultados</h3>
                <div className="overflow-x-auto bg-white rounded-lg shadow border border-[var(--border-color)]">
                    {data.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--secondary-color)]">
                                <tr>
                                    {columns.map(col => (
                                        <th key={col.header} className="px-6 py-3 font-medium text-[var(--primary-color)] uppercase tracking-wider">{col.header}</th>
                                    ))}
                                    <th className="px-6 py-3 font-medium text-[var(--primary-color)] uppercase tracking-wider">Archivo Original</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {data.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        {columns.map(col => (
                                            <td key={col.header} className="px-6 py-4 whitespace-nowrap">{String(item[col.accessor])}</td>
                                        ))}
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
                        <p className="p-6 text-center text-gray-500">No se han procesado archivos todavía. Sube documentos para ver los resultados aquí.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
