/** Aviso previo del modo «IA real» (AG-004, AG-005, AG-028): nombra al proveedor y dice dónde vive el texto. Distinto del aviso del modo Simulado. */
export const PRIVACY_NOTICE_REAL =
  'Modo IA real: el texto de tus archivos se envía a un servicio que corre en tu equipo y desde allí a OpenAI para analizarlo. El servicio lo mantiene en su memoria mientras esté en ejecución y no lo guarda en disco. En este navegador solo se guardan los hallazgos, los extractos citados y un resumen de la corrida. Usa únicamente documentos que puedas compartir con OpenAI.';

export function PrivacyNoticeReal() {
  return (
    <p className="privacy privacy-real" data-testid="privacy-notice-real">
      {PRIVACY_NOTICE_REAL}
    </p>
  );
}
