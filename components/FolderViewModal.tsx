import React, { useMemo, useState } from 'react';
import { LegalDocument } from '../types';
import { FolderIcon, FileIcon } from './Icons';

interface FolderViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    documents: LegalDocument[];
}

export const FolderViewModal: React.FC<FolderViewModalProps> = ({ isOpen, onClose, documents }) => {
    const [openFolder, setOpenFolder] = useState<string | null>(null);

    const folderStructure = useMemo(() => {
        const folders = new Map<string, LegalDocument[]>();
        documents.forEach(doc => {
            const name = doc.nombreCompleto || 'Sin Asignar';
            if (!folders.has(name)) {
                folders.set(name, []);
            }
            folders.get(name)!.push(doc);
        });
        return folders;
    }, [documents]);
    
    if (!isOpen) return null;

    const handleDownload = (doc: LegalDocument) => {
        const element = document.createElement("a");
        const file = new Blob([doc.textoCompleto], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        
        const safeFileName = doc.originalFileName.replace(/\.[^/.]+$/, "") + ".txt";

        // Prompt for save location (this is handled by browser)
        const targetPath = window.prompt("Elija dónde guardar el archivo (opcional):", safeFileName);
        if (targetPath !== null) {
            element.download = targetPath || safeFileName;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col p-6 text-black" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h2 className="text-2xl font-bold text-[var(--primary-color)]">Carpetas de Empleados (Virtual)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        {Array.from(folderStructure.entries()).sort(([nameA], [nameB]) => nameA.localeCompare(nameB)).map(([employeeName, docs]) => (
                            <li key={employeeName}>
                                <div onClick={() => setOpenFolder(openFolder === employeeName ? null : employeeName)} className="flex items-center gap-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer">
                                    <FolderIcon className="w-6 h-6 text-yellow-500" />
                                    <span className="font-semibold">{employeeName}</span>
                                    <span className="text-sm text-gray-500 ml-auto">({docs.length} archivos)</span>
                                </div>
                                {openFolder === employeeName && (
                                    <ul className="pl-6 pt-2 space-y-1">
                                        {docs.map(doc => (
                                            <li key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileIcon className="w-4 h-4 text-gray-400" />
                                                    {doc.originalFileName} <span className="text-xs text-gray-400">({doc.fecha})</span>
                                                </div>
                                                <button onClick={() => handleDownload(doc)} className="text-sm text-blue-600 hover:underline">
                                                    Descargar .txt
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                 <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--primary-color)] text-white hover:opacity-90">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
