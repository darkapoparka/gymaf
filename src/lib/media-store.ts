export async function photoData(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type))
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose an image smaller than 20 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
