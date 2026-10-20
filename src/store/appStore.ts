import { create } from 'zustand'

export interface AppState {
  sidebarOpen: boolean
  currentPage: string
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCurrentPage: (page: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  currentPage: 'dashboard',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setCurrentPage: (page: string) => set({ currentPage: page }),
}))
