import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartPackage = {
  packageId: string;
  packageVersionId: string;
  packageName: string;
  isCustom: boolean;
  basePricePerPlate: string;
  minGuestCount: number;
  maxGuestCount?: number | null;
};

export type CartEvent = {
  eventId: string;
  eventName?: string;
  eventDate: string;
  eventTimeStart?: string;
  addressLabel: string;
};

export type SelectedItem = {
  categoryId: string;
  categoryName: string;
  menuItemId: string;
  menuItemName: string;
  itemPrice: string;
  adjustmentAmount: string;
  isVeg: boolean;
};

type OrderBuilderState = {
  package?: CartPackage;
  event?: CartEvent;
  guestCount: number;
  selectedItems: SelectedItem[];
  setPackage: (pkg: CartPackage) => void;
  setEvent: (event: CartEvent) => void;
  setGuestCount: (guestCount: number) => void;
  toggleItem: (item: SelectedItem, maxSelections: number) => boolean;
  removeItem: (menuItemId: string) => void;
  clearSelections: () => void;
  reset: () => void;
};

export const useOrderBuilderStore = create<OrderBuilderState>()(
  persist(
    (set, get) => ({
      guestCount: 10,
      selectedItems: [],
      setPackage: (pkg) =>
        set((state) => {
          if (state.package?.packageVersionId === pkg.packageVersionId)
            return { package: pkg };
          return {
            package: pkg,
            event: undefined,
            guestCount: pkg.minGuestCount,
            selectedItems: [],
          };
        }),
      setEvent: (event) => set({ event }),
      setGuestCount: (guestCount) => set({ guestCount }),
      toggleItem: (item, maxSelections) => {
        const state = get();
        const exists = state.selectedItems.some(
          (selected) => selected.menuItemId === item.menuItemId,
        );
        if (exists) {
          set({
            selectedItems: state.selectedItems.filter(
              (selected) => selected.menuItemId !== item.menuItemId,
            ),
          });
          return true;
        }

        const categoryCount = state.selectedItems.filter(
          (selected) => selected.categoryId === item.categoryId,
        ).length;
        if (!state.package?.isCustom && categoryCount >= maxSelections)
          return false;
        set({ selectedItems: [...state.selectedItems, item] });
        return true;
      },
      removeItem: (menuItemId) =>
        set((state) => ({
          selectedItems: state.selectedItems.filter(
            (selected) => selected.menuItemId !== menuItemId,
          ),
        })),
      clearSelections: () => set({ selectedItems: [] }),
      reset: () =>
        set({
          package: undefined,
          event: undefined,
          guestCount: 10,
          selectedItems: [],
        }),
    }),
    {
      name: 'aranyam-order-cart',
      partialize: ({ package: pkg, event, guestCount, selectedItems }) => ({
        package: pkg,
        event,
        guestCount,
        selectedItems,
      }),
    },
  ),
);
