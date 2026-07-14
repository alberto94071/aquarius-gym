/**
 * Extrae el ID de video de cualquier formato de link de YouTube:
 * watch?v=, youtu.be/, shorts/, embed/, live/
 */
export function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}
