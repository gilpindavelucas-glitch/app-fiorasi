import React, { useState, useMemo } from 'react';
import { AntecedentesManager } from './components/AntecedentesManager';
import { AndreaniTracker } from './components/AndreaniTracker';
import { Calendar } from './components/Calendar';
import { SettingsModal } from './components/SettingsModal';
import { DocumentGenerator } from './components/DocumentGenerator';
import { FordFiorasiLogo, SettingsIcon, ExcelIcon, DocumentIcon, MailIcon, TemplateIcon } from './components/Icons';
import { useTheme } from './contexts/ThemeContext';
import { LegalDocument, AndreaniDocument, View } from './types';
import { exportToExcel } from './utils/excelExporter';

const App: React.FC = () => {
    const [view, setView] = useState<View>('antecedentes');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
    const [andreaniDocuments, setAndreaniDocuments] = useState<AndreaniDocument[]>([]);
    
    const { themeStyles } = useTheme();

    const handleExport = () => {
        if (view === 'antecedentes' && legalDocuments.length > 0) {
            exportToExcel(legalDocuments, 'antecedentes');
        } else if (view === 'andreani' && andreaniDocuments.length > 0) {
            exportToExcel(andreaniDocuments, 'andreani');
        } else {
            alert('No hay datos para exportar en la vista actual.');
        }
    };

    const renderView = useMemo(() => {
        switch (view) {
            case 'antecedentes':
                return (
                    <AntecedentesManager
                        documents={legalDocuments}
                        setDocuments={setLegalDocuments}
                    />
                );
            case 'andreani':
                return (
                    <AndreaniTracker
                        title="Visor de Cartas Documento Andreani"
                        onProcessComplete={setAndreaniDocuments}
                        data={andreaniDocuments}
                        columns={[
                            { header: 'Apellido y Nombre', accessor: 'destinatario' },
                            { header: 'Remitente', accessor: 'remitente' },
                            { header: 'Fecha de Envío', accessor: 'fechaEnvio' },
                            { header: 'Fecha de Entrega', accessor: 'fechaEntrega' },
                            { header: 'N° Seguimiento', accessor: 'numeroSeguimiento' },
                            { header: 'Situación', accessor: 'situacion' },
                        ]}
                    />
                );
            case 'documentos':
                 return <DocumentGenerator />;
            default:
                return null;
        }
    }, [view, legalDocuments, andreaniDocuments]);

    return (
        <>
            <style>{themeStyles}</style>
            <div className="flex h-screen bg-[var(--background-color)] text-[var(--text-color)] overflow-hidden">
                {/* Left Panel: Calendar & Navigation */}
                <aside className="w-1/4 max-w-sm p-4 bg-[var(--secondary-color)] overflow-y-auto border-r border-[var(--border-color)] flex flex-col space-y-6">
                    <div className="flex items-center text-[var(--primary-color)] pl-2">
                        <FordFiorasiLogo className="h-16 w-auto" />
                    </div>

                    <nav className="flex flex-col gap-2">
                        <button onClick={() => setView('antecedentes')} className={`px-4 py-3 rounded-md flex items-center gap-3 text-sm font-medium transition-colors w-full justify-start ${view === 'antecedentes' ? 'bg-[var(--primary-color)] text-white' : 'bg-white hover:bg-[var(--primary-color-light)]'}`}>
                            <DocumentIcon className="w-5 h-5" />
                            <span>Antecedentes</span>
                        </button>
                        <button onClick={() => setView('andreani')} className={`px-4 py-3 rounded-md flex items-center gap-3 text-sm font-medium transition-colors w-full justify-start ${view === 'andreani' ? 'bg-[var(--primary-color)] text-white' : 'bg-white hover:bg-[var(--primary-color-light)]'}`}>
                            <MailIcon className="w-5 h-5" />
                            <span>Cartas Andreani</span>
                        </button>
                        <button onClick={() => setView('documentos')} className={`px-4 py-3 rounded-md flex items-center gap-3 text-sm font-medium transition-colors w-full justify-start ${view === 'documentos' ? 'bg-[var(--primary-color)] text-white' : 'bg-white hover:bg-[var(--primary-color-light)]'}`}>
                            <TemplateIcon className="w-5 h-5" />
                            <span>Generador de Documentos</span>
                        </button>
                    </nav>
                    
                    <div className="flex-1 flex flex-col min-h-0">
                        <Calendar />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col">
                    {/* Top Bar */}
                    <header className="flex items-center justify-end p-3 border-b border-[var(--border-color)] bg-[var(--background-color)] shadow-sm">
                        <div className="flex items-center gap-3">
                             <button onClick={handleExport} className="px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-gray-400" disabled={(view === 'antecedentes' && legalDocuments.length === 0) || (view === 'andreani' && andreaniDocuments.length === 0)}>
                                <ExcelIcon className="w-5 h-5" />
                                Exportar a Excel
                            </button>
                            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-[var(--secondary-color)] hover:bg-[var(--primary-color-light)] transition-colors">
                                <SettingsIcon className="w-6 h-6 text-[var(--primary-color)]" />
                            </button>
                        </div>
                    </header>
                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {renderView}
                    </div>
                </main>
            </div>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
};

export default App;