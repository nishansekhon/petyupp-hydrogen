import {create} from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  getItemCount: () => get().items.reduce((n, it) => n + (it.quantity ?? 1), 0),
  addItem: (item) => set((s) => ({items: [...s.items, item]})),
  removeItem: (id) => set((s) => ({items: s.items.filter((it) => it.id !== id)})),
  clear: () => set({items: []}),
}));
