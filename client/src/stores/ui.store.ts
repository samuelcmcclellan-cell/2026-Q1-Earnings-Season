import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedSector: string | null;
  setSelectedSector: (sector: string | null) => void;
  selectedRegion: string | null;
  setSelectedRegion: (region: string | null) => void;
  calendarWeekOffset: number;
  setCalendarWeekOffset: (offset: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  selectedSector: null,
  setSelectedSector: (sector) => set({ selectedSector: sector }),
  selectedRegion: null,
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  calendarWeekOffset: 0,
  setCalendarWeekOffset: (offset) => set({ calendarWeekOffset: offset }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
