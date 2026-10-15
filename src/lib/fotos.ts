import type { ImageMetadata } from 'astro';

const archivos = import.meta.glob<{ default: ImageMetadata }>('../assets/fotos/*.webp', { eager: true });

export function foto(ruta: string): ImageMetadata {
  const base = ruta.split('/').pop() ?? '';
  const entrada = archivos[`../assets/fotos/${base}`];
  if (!entrada) throw new Error(`Foto no encontrada en src/assets/fotos: ${base}`);
  return entrada.default;
}
