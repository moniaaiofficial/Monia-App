export async function uploadChatFile(
  file: File,
  chatId: string,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; fileName: string; size: number; mimeType: string } | null> {
  const formData = new FormData();
  formData.append('file',   file);
  formData.append('chatId', chatId);

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      console.error('[uploadChatFile]', err);
      return null;
    }
    const data = await res.json();
    onProgress?.(100);
    return data;
  } catch (err) {
    console.error('[uploadChatFile] network error', err);
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/'))  return '🖼️';
  if (mimeType.startsWith('video/'))  return '🎥';
  if (mimeType.startsWith('audio/'))  return '🎵';
  if (mimeType.includes('pdf'))        return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel'))   return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📑';
  if (mimeType.includes('zip') || mimeType.includes('archive'))   return '🗜️';
  return '📎';
}
