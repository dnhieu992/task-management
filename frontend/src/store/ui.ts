// frontend/src/store/ui.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  activeTaskId: string | null;
  toggleSidebar: () => void;
  setActiveTask: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeTaskId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTask: (id) => set({ activeTaskId: id }),
}));
