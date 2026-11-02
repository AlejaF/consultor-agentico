/** Pantallas opcionales: un elemento de navegación solo aparece si su pantalla existe (FR-049). */
export const FEATURES = {
  /** Resumen del Contacto de la empresa: false mientras su vista no exista. */
  contactSummary: false,
  /** Encuesta del Contacto: se pone en true cuando exista esa pantalla. */
  survey: false,
} as const;
