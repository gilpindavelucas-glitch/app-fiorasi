
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ColorInput: React.FC<{ label: string; color: string; onChange: (color: string) => void }> = ({ label, color, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm text-gray-600">{label}</label>
        <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{color}</span>
            <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
        </div>
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, setTheme, resetTheme } = useTheme();

    if (!isOpen) return null;

    const handleColorChange = (key: keyof ThemeColors, value: string) => {
        setTheme(prevTheme => ({
            ...prevTheme,
            colors: {
                ...prevTheme.colors,
                [key]: value,
            },
        }));
    };
    
    const handleFontSizeChange = (size: number) => {
        setTheme(prevTheme => ({
            ...prevTheme,
            fontSize: size,
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 text-black" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[var(--primary-color)]">Ajustes de Apariencia</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">&times;</button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">Paleta de Colores</h3>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                            <ColorInput label="Primario (Botones, Títulos)" color={theme.colors.primary} onChange={(c) => handleColorChange('primary', c)} />
                             <ColorInput label="Primario Claro (Hover)" color={theme.colors.primaryLight} onChange={(c) => handleColorChange('primaryLight', c)} />
                            <ColorInput label="Secundario (Paneles, Fondos)" color={theme.colors.secondary} onChange={(c) => handleColorChange('secondary', c)} />
                            <ColorInput label="Fondo General" color={theme.colors.background} onChange={(c) => handleColorChange('background', c)} />
                            <ColorInput label="Texto Principal" color={theme.colors.text} onChange={(c) => handleColorChange('text', c)} />
                            <ColorInput label="Bordes y Separadores" color={theme.colors.border} onChange={(c) => handleColorChange('border', c)} />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">Tamaño de Fuente</h3>
                         <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
                            <input
                                type="range"
                                min="12"
                                max="20"
                                step="1"
                                value={theme.fontSize}
                                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-bold text-lg w-12 text-center">{theme.fontSize}px</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={resetTheme} className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100">
                        Restaurar Predeterminado
                    </button>
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--primary-color)] text-white hover:opacity-90">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
