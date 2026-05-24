import localforage from "localforage";
import type { SavedDocument } from "./types";

const historyStore = localforage.createInstance({
  name: "paperless-invoice",
  storeName: "history",
});

const HISTORY_KEY = "documents";

export async function getDocumentHistory(): Promise<SavedDocument[]> {
  return (await historyStore.getItem<SavedDocument[]>(HISTORY_KEY)) ?? [];
}

export async function saveToHistory(doc: SavedDocument): Promise<void> {
  const history = await getDocumentHistory();
  const filtered = history.filter((h) => h.id !== doc.id);
  await historyStore.setItem(HISTORY_KEY, [doc, ...filtered].slice(0, 50));
}

export async function deleteFromHistory(id: string): Promise<void> {
  const history = await getDocumentHistory();
  await historyStore.setItem(
    HISTORY_KEY,
    history.filter((h) => h.id !== id),
  );
}

export async function clearHistory(): Promise<void> {
  await historyStore.setItem(HISTORY_KEY, []);
}
