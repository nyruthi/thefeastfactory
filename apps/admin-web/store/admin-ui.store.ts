import { create } from 'zustand';

type AdminUiState = {
  orderStatusFilter: string;
  navigationOpen: boolean;
  setOrderStatusFilter: (status: string) => void;
  setNavigationOpen: (open: boolean) => void;
};

export const useAdminUiStore = create<AdminUiState>((set) => ({
  orderStatusFilter: 'ALL',
  navigationOpen: false,
  setOrderStatusFilter: (orderStatusFilter) => set({ orderStatusFilter }),
  setNavigationOpen: (navigationOpen) => set({ navigationOpen }),
}));
