// Medidas de composición (lote H3, AG-035): posición y tamaño reales en el navegador. Solo lee; no cambia nada.
import type { Page } from '@playwright/test';

export interface Medidas {
  ancho: number;
  alturaTotal: number;
  alturaMadurez: number | null;
  tarjetasPorFila: number;
  anchoContenido: number;
  anchoDisponible: number;
  desbordaH: boolean;
  columnasRuta: number;
}

/** Mide la pantalla abierta. `ancho` es el ancho de ventana ya fijado por quien llama. */
export async function medir(page: Page): Promise<Medidas> {
  return page.evaluate(() => {
    const rect = (e: Element) => e.getBoundingClientRect();
    const cards = [...document.querySelectorAll('[data-testid^="finding-"]')].filter((e) => /^finding-R\d+$/.test(e.getAttribute('data-testid') ?? ''));
    const tops = new Map<number, number>();
    for (const c of cards) {
      const t = Math.round(rect(c).top + window.scrollY);
      tops.set(t, (tops.get(t) ?? 0) + 1);
    }
    const mad = document.querySelector('[data-testid="maturity-panel"]');
    const main = document.querySelector('main') ?? document.body;
    const mr = rect(main);
    const cs = getComputedStyle(main);
    const contenido = mr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const fases = [...document.querySelectorAll('[data-testid^="phase-"]')];
    const fx = new Set(fases.map((e) => Math.round(rect(e).left)));
    return {
      ancho: window.innerWidth,
      alturaTotal: document.documentElement.scrollHeight,
      alturaMadurez: mad ? Math.round(rect(mad).height) : null,
      tarjetasPorFila: tops.size === 0 ? 0 : Math.max(...tops.values()),
      anchoContenido: Math.round(contenido),
      anchoDisponible: Math.round(mr.width),
      desbordaH: document.documentElement.scrollWidth > window.innerWidth + 1,
      columnasRuta: fases.length === 0 ? 0 : fx.size,
    };
  });
}
