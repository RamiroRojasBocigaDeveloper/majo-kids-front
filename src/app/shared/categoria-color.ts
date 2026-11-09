/** Paleta exacta de los gráficos de dona (reportes) — única fuente de verdad. */
export const DONUT_PALETTE = [
  '#4e79a7', // azul
  '#f28e2b', // naranja
  '#59a14f', // verde
  '#e15759', // rojo
  '#76b7b2', // teal
  '#edc948', // amarillo
  '#b07aa1', // violeta
  '#ff9da7', // rosa
  '#9c755f', // marrón
  '#7f7f7f', // gris
];

/** Mezcla un color hex con blanco (0 = original, 1 = blanco puro). */
export function aclarar(hex: string, factor = 0.5): string {
  const h = hex.replace('#', '');
  const mix = (i: number) => {
    const c = parseInt(h.substring(i, i + 2), 16);
    return Math.round(c + (255 - c) * factor);
  };
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(mix(0))}${to2(mix(1))}${to2(mix(2))}`;
}

/** Color de dona (aclarado) para el índice dado — el que usan los pills de categoría. */
export function colorDonutPorIndice(i: number): string {
  const n = DONUT_PALETTE.length;
  return aclarar(DONUT_PALETTE[((i % n) + n) % n], 0.68);
}

/** Texto legible (blanco o tinta) según el contraste del fondo. */
export function textoSobre(bg: string): string {
  const hex = bg.replace('#', '');
  const can = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const r = can(parseInt(hex.substring(0, 2), 16) / 255);
  const g = can(parseInt(hex.substring(2, 4), 16) / 255);
  const b = can(parseInt(hex.substring(4, 6), 16) / 255);
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const contrasteBlanco = 1.05 / (L + 0.05);
  const contrasteTinta = (L + 0.05) / 0.0574;
  return contrasteBlanco >= contrasteTinta ? '#ffffff' : '#1a1a1a';
}
