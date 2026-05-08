import {
  collectHealthDocRefs,
  healthDocRefPrefix,
  isStoredHealthDocRef,
  type PawfolioState,
} from "./pawfolio";

export type HealthDocRecord = {
  id: string;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
};

const docDbName = "pawfolio-health-docs-v1";
const docStoreName = "health-docs";

function openDocDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(docDbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(docStoreName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHealthDocRecordToStore(record: HealthDocRecord) {
  const db = await openDocDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(docStoreName, "readwrite");
      transaction.objectStore(docStoreName).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function saveHealthDocToStore(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const id = `doc-${crypto.randomUUID()}`;
  await saveHealthDocRecordToStore({
    id,
    dataUrl,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    createdAt: new Date().toISOString(),
  });
  return `${healthDocRefPrefix}${id}`;
}

export async function loadHealthDocRecordFromStore(ref: string) {
  if (!isStoredHealthDocRef(ref)) return undefined;
  const id = ref.slice(healthDocRefPrefix.length);
  const db = await openDocDb();
  try {
    return await new Promise<HealthDocRecord | undefined>((resolve, reject) => {
      const transaction = db.transaction(docStoreName, "readonly");
      const request = transaction.objectStore(docStoreName).get(id);
      request.onsuccess = () => resolve(request.result as HealthDocRecord | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function deleteHealthDocFromStore(ref: string) {
  if (!isStoredHealthDocRef(ref)) return;
  const id = ref.slice(healthDocRefPrefix.length);
  const db = await openDocDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(docStoreName, "readwrite");
      transaction.objectStore(docStoreName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function collectSnapshotHealthDocRecords(state: PawfolioState) {
  const refs = collectHealthDocRefs(state);
  const records = await Promise.all(refs.map((ref) => loadHealthDocRecordFromStore(ref)));
  return records.filter(Boolean) as HealthDocRecord[];
}

export async function restoreSnapshotHealthDocs(records: HealthDocRecord[] = []) {
  await Promise.all(records.map((record) => saveHealthDocRecordToStore({
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
  })));
}
