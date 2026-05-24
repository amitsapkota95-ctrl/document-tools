import localforage from "localforage";

const crmStore = localforage.createInstance({ name: "paperless-crm", storeName: "clients" });
const itemsStore = localforage.createInstance({ name: "paperless-crm", storeName: "items" });

export interface CrmClient {
  id: string;
  name: string;
  address: string;
  email: string;
}

export interface CrmItem {
  id: string;
  description: string;
  rate: number;
}

const CLIENTS_KEY = "all-clients";
const ITEMS_KEY = "all-items";

export async function getClients(): Promise<CrmClient[]> {
  return (await crmStore.getItem<CrmClient[]>(CLIENTS_KEY)) ?? [];
}

export async function saveClient(client: CrmClient): Promise<void> {
  const clients = await getClients();
  const idx = clients.findIndex((c) => c.id === client.id);
  if (idx >= 0) clients[idx] = client;
  else clients.push(client);
  await crmStore.setItem(CLIENTS_KEY, clients);
}

export async function getSavedItems(): Promise<CrmItem[]> {
  return (await itemsStore.getItem<CrmItem[]>(ITEMS_KEY)) ?? [];
}

export async function saveItem(item: CrmItem): Promise<void> {
  const items = await getSavedItems();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  await itemsStore.setItem(ITEMS_KEY, items);
}

export async function upsertClientFromInvoice(
  name: string,
  address: string,
  email = "",
): Promise<void> {
  if (!name.trim()) return;
  const clients = await getClients();
  const existing = clients.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.address = address || existing.address;
    existing.email = email || existing.email;
    await crmStore.setItem(CLIENTS_KEY, clients);
  } else {
    await saveClient({
      id: crypto.randomUUID(),
      name,
      address,
      email,
    });
  }
}

export async function deleteSavedItem(id: string): Promise<void> {
  const items = await getSavedItems();
  await itemsStore.setItem(ITEMS_KEY, items.filter((i) => i.id !== id));
}
