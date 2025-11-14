import React, { useState } from 'react';
import { getAndreaniTrackingInfo } from '../services/geminiService';
import { SpinnerIcon, SearchIcon } from './Icons';
import type { AndreaniDocument, Column } from '../types';

interface AndreaniTrackerProps {
    title: string;
    onProcessComplete: (data: AndreaniDocument[]) => void;
    data: AndreaniDocument[];
    columns: Column<AndreaniDocument>[];
}

export function AndreaniTracker({ title, onProcessComplete, data, columns }: AndreaniTrackerProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [currentResult, setCurrentResult] = useState<AndreaniDocument | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTrack = async () => {
        if (!trackingNumber.trim()) {
            alert('Por favor, ingresa un número de seguimiento.');
            return;
        }
        setIsProcessing(true);
        setCurrentResult(null);
        setError(null);

        const result = await getAndreaniTrackingInfo(trackingNumber.trim());
        if (result) {
            onProcessComplete([result, ...data]);
            setCurrentResult(result);
        } else {
            setError('No se pudo obtener la información para este número de seguimiento. Inténtalo de nuevo.');
        }
        setIsProcessing(false);
        setTrackingNumber('');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--primary-color)]">{title}</h2>

            <div className="p-4 bg-white rounded-lg shadow border border-[var(--border-color)]">
                <label htmlFor="tracking-input" className="block font-semibold mb-2 text-gray-700">Buscar por Número de Seguimiento</label>
                <div className="flex items-center gap-2">
                    <input
                        id="tracking-input"
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleTrack()}
                        placeholder="Ingrese el código de seguimiento de Andreani..."
                        className="flex-grow border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] disabled:bg-gray-100"
                        disabled={isProcessing}
                    />
                    <button
                        onClick={handleTrack}
                        className="px-4 py-2 rounded-md flex items-center justify-center gap-2 font-medium bg-[var(--primary-color)] text-white hover:opacity-90 transition-opacity disabled:bg-gray-400 w-32"
                        disabled={isProcessing}
                    >
                        {isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
                        <span>{isProcessing ? 'Buscando...' : 'Buscar'}</span>
                    </button>
                </div>
            </div>

            {isProcessing && !currentResult && (
                <div className="p-6 text-center text-gray-500">
                    <SpinnerIcon className="w-8 h-8 mx-auto text-[var(--primary-color)] animate-spin" />
                    <p className="mt-2">Buscando información...</p>
                </div>
            )}

            {error && (
                <div className="p-4 text-center text-red-700 bg-red-100 border border-red-300 rounded-lg">
                    {error}
                </div>
            )}

            {currentResult && (
                 <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Previsualización del Envío</h3>
                    <div className="p-6 bg-white rounded-lg shadow border border-[var(--border-color)] grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                        <div><strong className="block text-sm text-gray-500 font-medium">Destinatario</strong><span className="text-base">{currentResult.destinatario}</span></div>
                        <div><strong className="block text-sm text-gray-500 font-medium">Remitente</strong><span className="text-base">{currentResult.remitente}</span></div>
                        <div><strong className="block text-sm text-gray-500 font-medium">N° Seguimiento</strong><span className="text-base font-mono">{currentResult.numeroSeguimiento}</span></div>
                        <div><strong className="block text-sm text-gray-500 font-medium">Fecha Envío</strong><span className="text-base">{currentResult.fechaEnvio}</span></div>
                        <div><strong className="block text-sm text-gray-500 font-medium">Fecha Entrega</strong><span className="text-base">{currentResult.fechaEntrega}</span></div>
                        <div><strong className="block text-sm text-gray-500 font-medium">Situación</strong><span className="text-base font-bold text-[var(--primary-color)]">{currentResult.situacion}</span></div>
                    </div>
                </div>
            )}
            
            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Historial de Búsquedas</h3>
                <div className="overflow-x-auto bg-white rounded-lg shadow border border-[var(--border-color)]">
                     {data.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--secondary-color)]">
                                <tr>
                                    {columns.map(col => (
                                        <th key={col.header} className="px-6 py-3 font-medium text-[var(--primary-color)] uppercase tracking-wider">{col.header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {data.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        {columns.map(col => (
                                            <td key={col.header} className="px-6 py-4 whitespace-nowrap">{String(item[col.accessor])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="p-6 text-center text-gray-500">No se han realizado búsquedas todavía.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
