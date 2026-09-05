function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("future-pro-media", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("videos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveVideo(id: string, blob: Blob) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
export async function readVideo(id: string): Promise<Blob | undefined> {
  const db = await database();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const r = db.transaction("videos").objectStore("videos").get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return blob;
}
