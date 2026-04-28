import { collectPhotoRefs, isStoredPhotoRef, photoRefPrefix, type PawfolioState } from "./pawfolio";

export type PhotoRecord = { id: string; dataUrl: string; createdAt: string };

const photoDbName = "pawfolio-photos-v1";
const photoStoreName = "photos";

function openPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(photoDbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(photoStoreName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePhotoRecordToStore(record: PhotoRecord) {
  const db = await openPhotoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readwrite");
      transaction.objectStore(photoStoreName).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function savePhotoToStore(dataUrl: string) {
  const id = `photo-${crypto.randomUUID()}`;
  await savePhotoRecordToStore({ id, dataUrl, createdAt: new Date().toISOString() });
  return `${photoRefPrefix}${id}`;
}

export async function loadPhotoFromStore(ref: string) {
  if (!isStoredPhotoRef(ref)) return ref;
  const id = ref.slice(photoRefPrefix.length);
  const db = await openPhotoDb();
  try {
    return await new Promise<string>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readonly");
      const request = transaction.objectStore(photoStoreName).get(id);
      request.onsuccess = () => resolve((request.result as PhotoRecord | undefined)?.dataUrl || "");
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function loadPhotoRecordFromStore(ref: string) {
  if (!isStoredPhotoRef(ref)) return undefined;
  const id = ref.slice(photoRefPrefix.length);
  const db = await openPhotoDb();
  try {
    return await new Promise<PhotoRecord | undefined>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readonly");
      const request = transaction.objectStore(photoStoreName).get(id);
      request.onsuccess = () => resolve(request.result as PhotoRecord | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function deletePhotoFromStore(ref: string) {
  if (!isStoredPhotoRef(ref)) return;
  const id = ref.slice(photoRefPrefix.length);
  const db = await openPhotoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readwrite");
      transaction.objectStore(photoStoreName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function collectSnapshotPhotoRecords(state: PawfolioState) {
  const refs = collectPhotoRefs(state);
  const records = await Promise.all(refs.map((ref) => loadPhotoRecordFromStore(ref)));
  return records.filter(Boolean) as PhotoRecord[];
}

export async function restoreSnapshotPhotos(records: PhotoRecord[] = []) {
  await Promise.all(records.map((record) => savePhotoRecordToStore({
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
  })));
}
