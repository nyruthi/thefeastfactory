import { create } from 'zustand';

type SelectedItem = {
  categoryId: string;
  menuItemId: string;
};

type OrderBuilderState = {
  eventId?: string;
  packageVersionId?: string;
  guestCount: number;
  selectedItems: SelectedItem[];
  setPackageVersion: (packageVersionId: string) => void;
  setEventId: (eventId: string) => void;
  setGuestCount: (guestCount: number) => void;
  toggleItem: (item: SelectedItem) => void;
  reset: () => void;
};

export const useOrderBuilderStore = create<OrderBuilderState>((set) => ({
  guestCount: 10,
  selectedItems: [],
  setEventId: (eventId) => set({ eventId }),
  setPackageVersion: (packageVersionId) => set({ packageVersionId }),
  setGuestCount: (guestCount) => set({ guestCount }),
  toggleItem: (item) =>
    set((state) => {
      const exists = state.selectedItems.some(
        (selected) => selected.categoryId === item.categoryId && selected.menuItemId === item.menuItemId,
      );

      return {
        selectedItems: exists
          ? state.selectedItems.filter(
              (selected) => selected.categoryId !== item.categoryId || selected.menuItemId !== item.menuItemId,
            )
          : [...state.selectedItems, item],
      };
    }),
  reset: () => set({ eventId: undefined, packageVersionId: undefined, guestCount: 10, selectedItems: [] }),
}));
