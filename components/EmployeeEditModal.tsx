import React, { useState, useMemo, useEffect } from 'react';
import { LegalDocument } from '../types';
import { SpinnerIcon, UploadIcon } from './Icons';
import { Type } from '@google/genai';
import { processDocumentWithGemini } from '../services/geminiService';

interface EmployeeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    documents: LegalDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<LegalDocument[]>>;
}

export const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({ isOpen, onClose, documents, setDocuments }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [editedDocs, setEditedDocs] = useState<LegalDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const employeeNames = useMemo(() => {
        const names = new Set(documents.map(d => d.nombreCompleto));
        return Array.from(names).sort();
    }, [documents]);

    const filteredNames = useMemo(() => {
        if (!searchTerm) return [];
        return employeeNames.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, employeeNames]);
    
    useEffect(() => {
        if (selectedEmployee) {
            setEditedDocs(documents.filter(d => d.nombreCompleto === selectedEmployee).map(d => ({...d})));
        } else {
            setEditedDocs([]);
        }
    }, [selectedEmployee, documents]);

    if (!isOpen) return null;

    const handleSelectEmployee = (name: string) => {
        setSelectedEmployee(name);
        setSearchTerm('');
    };
    
    const handleDocChange = (docId: string, field: keyof LegalDocument, value: string) => {
        setEditedDocs(prev => prev.map(doc => doc.id === docId ? { ...doc, [field]: value } : doc));
    };

    const handleSaveChanges = () => {
        setDocuments(prev => {
            const otherDocs = prev.filter(d => d.nombreCompleto !== selectedEmployee);
            return [...otherDocs, ...editedDocs];
        });
        alert('Cambios guardados exitosamente.');
        onClose();
    };

    const handleAddNewFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedEmployee) return;

        setIsUploading(true);

        const prompt = `Analiza el documento adjunto. Extrae y devuelve el texto completo. Adicionalmente, extrae la fecha (DD/MM/AAAA), tipo de antecedente y un resumen. El nombre del empleado es '${selectedEmployee}'. Responde únicamente con un objeto JSON.`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                nombreCompleto: { type: Type.STRING },
                fecha: { type: Type.STRING },
                tipoAntecedente: { type: Type.STRING },
                resumen: { type: Type.STRING },
                textoCompleto: { type: Type.STRING },
            },
            required: ['fecha', 'tipoAntecedente', 'resumen', 'textoCompleto'],
        };

        const result = await processDocumentWithGemini<Omit<LegalDocument, 'id' | 'originalFileName'>>(file, prompt, schema);
        
        if (result) {
            const newDoc: LegalDocument = {
                ...result,
                nombreCompleto: selectedEmployee, // Ensure correct name association
                id: crypto.randomUUID(),
                originalFileName: file.name,
            };
            setEditedDocs(prev => [...prev, newDoc]);
        }
        setIsUploading(false);
    };

    const employeeSummary = useMemo(() => {
        if (!selectedEmployee) return null;
        const employeeDocs = documents.filter(d => d.nombreCompleto === selectedEmployee);
        const types = new Set(employeeDocs.map(d => d.tipoAntecedente));
        const lastDate = employeeDocs.reduce((latest, doc) => {
            try {
                const [day, month, year] = doc.fecha.split('/');
                const date = new Date(`${year}-${month}-${day}`);
                return date > latest ? date : latest;
            } catch { return latest; }
        }, new Date(0));

        return {
            count: employeeDocs.length,
            types: Array.from(types).join(', '),
            lastDate: lastDate > new Date(0) ? lastDate.toLocaleDateString('es-ES') : 'N/A',
        };
    }, [selectedEmployee, documents]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-6 text-black" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h2 className="text-2xl font-bold text-[var(--primary-color)]">Buscar y Editar Legajo de Empleado</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl">&times;</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                    {/* Search and Summary Panel */}
                    <div className="md:col-span-1 flex flex-col space-y-4 overflow-y-auto pr-2">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Empleado</label>
                            <input
                                type="text"
                                placeholder="Escriba un nombre..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                            {filteredNames.length > 0 && (
                                <ul className="bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto">
                                    {filteredNames.map(name => (
                                        <li key={name} onClick={() => handleSelectEmployee(name)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">{name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {selectedEmployee && employeeSummary && (
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h3 className="text-lg font-bold text-gray-800 mb-3">{selectedEmployee}</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Cant. Antecedentes:</strong> {employeeSummary.count}</p>
                                    <p><strong>Tipos:</strong> {employeeSummary.types}</p>
                                    <p><strong>Última Fecha:</strong> {employeeSummary.lastDate}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Documents Panel */}
                    <div className="md:col-span-2 flex flex-col overflow-y-auto space-y-4 pr-2">
                        {selectedEmployee ? (
                            <>
                                {editedDocs.map((doc, index) => (
                                    <div key={doc.id} className="p-4 border rounded-lg bg-white shadow-sm">
                                        <p className="font-bold text-gray-600 mb-2">Archivo: {doc.originalFileName}</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <label className="block font-medium text-gray-500">Fecha</label>
                                                <input type="text" value={doc.fecha} onChange={e => handleDocChange(doc.id, 'fecha', e.target.value)} className="w-full border-b p-1" />
                                            </div>
                                             <div>
                                                <label className="block font-medium text-gray-500">Tipo Antecedente</label>
                                                <input type="text" value={doc.tipoAntecedente} onChange={e => handleDocChange(doc.id, 'tipoAntecedente', e.target.value)} className="w-full border-b p-1" />
                                            </div>
                                            <div className="col-span-2">
                                                 <label className="block font-medium text-gray-500">Resumen</label>
                                                <textarea value={doc.resumen} onChange={e => handleDocChange(doc.id, 'resumen', e.target.value)} rows={3} className="w-full border-b p-1 text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-4">
                                     <input type="file" id={`add-file-${selectedEmployee}`} onChange={handleAddNewFile} className="hidden" accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.odt" disabled={isUploading}/>
                                     <label htmlFor={`add-file-${selectedEmployee}`} className={`w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg text-sm ${isUploading ? 'cursor-wait bg-gray-100' : 'cursor-pointer hover:border-[var(--primary-color)]'}`}>
                                        {isUploading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <UploadIcon className="w-5 h-5"/>}
                                        {isUploading ? 'Procesando...' : 'Añadir Nuevo Antecedente'}
                                     </label>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-500 p-10">Seleccione un empleado para ver y editar sus antecedentes.</div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100">Cancelar</button>
                    <button onClick={handleSaveChanges} disabled={!selectedEmployee || editedDocs.length === 0} className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--primary-color)] text-white hover:opacity-90 disabled:bg-gray-400">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};
