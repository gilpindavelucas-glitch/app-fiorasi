import * as XLSX from 'xlsx';
import { LegalDocument, AndreaniDocument } from '../types';

type DocumentType = 'antecedentes' | 'andreani';

const getHeaders = (type: DocumentType): string[] => {
    if (type === 'antecedentes') {
        return ['Apellido y Nombre', 'Fecha', 'Tipo de Antecedente', 'Resumen', 'Archivo Original'];
    }
    return ['Apellido y Nombre', 'Remitente', 'Fecha de Envío', 'Fecha de Entrega', 'N° Seguimiento', 'Situación'];
};

const mapDataToSheet = (data: (LegalDocument | AndreaniDocument)[], type: DocumentType) => {
    const headers = getHeaders(type);
    const body = data.map(item => {
        if (type === 'antecedentes' && 'tipoAntecedente' in item) {
            return [item.nombreCompleto, item.fecha, item.tipoAntecedente, item.resumen, item.originalFileName];
        }
        if (type === 'andreani' && 'numeroSeguimiento' in item) {
            return [item.destinatario, item.remitente, item.fechaEnvio, item.fechaEntrega, item.numeroSeguimiento, item.situacion];
        }
        return [];
    });
    return [headers, ...body];
};


// FIX: Renamed from createSummarySheet to createSummaryData. It now returns the data array instead of the worksheet.
const createSummaryData = (data: LegalDocument[]) => {
    const summary: Record<string, { count: number; types: Set<string>; lastDate: Date | null; files: string[] }> = {};

    data.forEach(doc => {
        const name = doc.nombreCompleto || 'SIN NOMBRE';
        if (!summary[name]) {
            summary[name] = { count: 0, types: new Set(), lastDate: null, files: [] };
        }
        summary[name].count++;
        summary[name].types.add(doc.tipoAntecedente);
        summary[name].files.push(doc.originalFileName);
        
        try {
            const [day, month, year] = doc.fecha.split('/');
            const date = new Date(`${year}-${month}-${day}`);
            if (summary[name].lastDate === null || date > (summary[name].lastDate as Date)) {
                summary[name].lastDate = date;
            }
        } catch (e) {
            // ignore invalid dates
        }
    });

    const sheetData = [
        ['Apellido y Nombre', 'Cantidad de Antecedentes', 'Tipos de Antecedentes', 'Última Fecha', 'Archivos'],
        ...Object.entries(summary).map(([name, details]) => [
            name,
            details.count,
            Array.from(details.types).join(', '),
            details.lastDate ? details.lastDate.toLocaleDateString('es-ES') : 'N/A',
            details.files.join(', ')
        ])
    ];

    return sheetData;
};


export const exportToExcel = (data: (LegalDocument | AndreaniDocument)[], type: DocumentType) => {
    if (data.length === 0) return;

    const wb = XLSX.utils.book_new();
    
    // Main data sheet
    const mainSheetData = mapDataToSheet(data, type);
    const ws = XLSX.utils.aoa_to_sheet(mainSheetData);

    // Auto-fit columns
    const cols = mainSheetData[0].map((_, i) => ({
        wch: mainSheetData.reduce((w, r) => Math.max(w, String(r[i] ?? '').length), 10)
    }));
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, type === 'antecedentes' ? 'Antecedentes' : 'Cartas Andreani');

    // Summary sheet only for legal documents
    if (type === 'antecedentes') {
        // FIX: Call createSummaryData to get the data array.
        const summarySheetData = createSummaryData(data as LegalDocument[]);
        const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
        // FIX: Use summarySheetData to calculate column widths, fixing the 'sheetData' not found error on lines 86 and 87.
        const summaryCols = summarySheetData[0].map((_, i) => ({
            wch: summarySheetData.reduce((w, r) => Math.max(w, String(r[i] ?? '').length), 10)
        }));
        summarySheet['!cols'] = summaryCols;
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen por Persona');
    }
    
    const fileName = `Reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
};
