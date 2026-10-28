/** Longest side of uploaded photos; enough for full-width display on phones. */
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

/**
 * Downscales and re-encodes a photo as JPEG before upload (phone photos are often 4–12 MB).
 * Returns the original file when the browser cannot decode it (e.g. HEIC) or when it is already small.
 */
export async function compressImage(file: File): Promise<File> {
  if (!import.meta.client || !file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1_000_000) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}
