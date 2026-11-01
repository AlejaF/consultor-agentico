// Archivos ficticios generados en memoria (no se versiona ningún ejecutable).
const pdf = Buffer.from('%PDF-1.4\n% Documento de ejemplo ficticio\n%%EOF\n');

export const PDF_VALIDO = { name: 'informe-ejemplo.pdf', mimeType: 'application/pdf', buffer: pdf };
export const TXT_VALIDO = { name: 'entrevista-ejemplo.txt', mimeType: 'text/plain', buffer: Buffer.from('Transcripción ficticia de ejemplo.') };
export const EXE_NO_PERMITIDO = { name: 'programa.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ ficticio') };
export const VACIO = { name: 'vacio.txt', mimeType: 'text/plain', buffer: Buffer.alloc(0) };
