import { normalizePhoneDigits } from "./phone";
import type { StoredUserRecord } from "../types";

const DB_NAME = "ai-outfit-selector-db";
const DB_VERSION = 1;
const USERS_STORE = "users";
const SESSION_STORE = "session";
const SESSION_KEY = "current";

interface SessionRecord {
  id: string;
  phoneKey: string;
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(USERS_STORE)) {
        database.createObjectStore(USERS_STORE, { keyPath: "phoneKey" });
      }

      if (!database.objectStoreNames.contains(SESSION_STORE)) {
        database.createObjectStore(SESSION_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T = unknown>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
}

export function getPhoneKey(phone: string) {
  return normalizePhoneDigits(phone);
}

export async function getStoredUser(phone: string) {
  const database = await openDb();
  const transaction = database.transaction(USERS_STORE, "readonly");
  const store = transaction.objectStore(USERS_STORE);
  const result = await requestToPromise<StoredUserRecord | undefined>(
    store.get(getPhoneKey(phone)),
  );
  database.close();
  return result;
}

export async function saveStoredUser(record: StoredUserRecord) {
  const database = await openDb();
  const transaction = database.transaction(USERS_STORE, "readwrite");
  const store = transaction.objectStore(USERS_STORE);
  await requestToPromise(store.put(record));
  database.close();
}

export async function getCurrentSession() {
  const database = await openDb();
  const transaction = database.transaction(SESSION_STORE, "readonly");
  const store = transaction.objectStore(SESSION_STORE);
  const result = await requestToPromise<SessionRecord | undefined>(store.get(SESSION_KEY));
  database.close();
  return result?.phoneKey ?? null;
}

export async function saveCurrentSession(phone: string) {
  const database = await openDb();
  const transaction = database.transaction(SESSION_STORE, "readwrite");
  const store = transaction.objectStore(SESSION_STORE);
  await requestToPromise(
    store.put({
      id: SESSION_KEY,
      phoneKey: getPhoneKey(phone),
    }),
  );
  database.close();
}

export async function clearCurrentSession() {
  const database = await openDb();
  const transaction = database.transaction(SESSION_STORE, "readwrite");
  const store = transaction.objectStore(SESSION_STORE);
  await requestToPromise(store.delete(SESSION_KEY));
  database.close();
}
