export interface LegalDocument {
    id: string;
    nombreCompleto: string;
    fecha: string;
    tipoAntecedente: string;
    resumen: string;
    textoCompleto: string;
    originalFileName: string;
}

export interface AndreaniDocument {
    destinatario: string;
    remitente: string;
    fechaEnvio: string;
    fechaEntrega: string;
    numeroSeguimiento: string;
    situacion: string;
}

export type ProcessedDocument = LegalDocument | AndreaniDocument;

export interface CalendarEvent {
    id: string;
    title: string;
    color: string;
}

export type View = 'antecedentes' | 'andreani' | 'documentos';

export interface Column<T> {
    header: string;
    accessor: keyof T;
}

export interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    primaryLight: string;
    border: string;
}

export interface Theme {
    colors: ThemeColors;
    fontSize: number;
}