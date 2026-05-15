import { writable } from 'svelte/store';
import type { Item } from '../engine/entities/Item';

function createInventoryStore() {
  const { subscribe, update, set } = writable<Item[]>([]);

  return {
    subscribe,
    reset() { set([]); },
    add(item: Item) { update(items => [...items, item]); },
    addMany(newItems: Item[]) { update(items => [...items, ...newItems]); },
    remove(index: number) { update(items => items.filter((_, i) => i !== index)); },
  };
}

export const inventoryStore = createInventoryStore();
