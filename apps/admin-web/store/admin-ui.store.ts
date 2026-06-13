import { create } from 'zustand';

type AdminUiState = {
  orderStatusFilter: string;
  setOrderStatusFilter: (status: string) => void;
};

export const useAdminUiStore = create<AdminUiState>((set) => ({
  orderStatusFilter: 'ALL',
  setOrderStatusFilter: (orderStatusFilter) => set({ orderStatusFilter }),
}));
