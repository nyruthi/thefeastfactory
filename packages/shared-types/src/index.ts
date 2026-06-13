export type ApiHealth = {
  status: 'ok';
  service: string;
  timestamp: string;
};

export type Money = {
  amount: string;
  currency: 'INR';
};

export type CustomerSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    mobileNumber: string;
    name?: string | null;
    email?: string | null;
  };
};

export type UserProfile = CustomerSession['user'];

export type AddressType = 'HOME' | 'OFFICE' | 'EVENT_VENUE' | 'OTHER';

export type UserAddress = {
  id: string;
  addressType: AddressType;
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSession = {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'OPERATIONS';
  };
};

export type AdminProfile = AdminSession['admin'];

export type MenuCategory = {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  basePrice: string;
  isVeg: boolean;
  isActive: boolean;
  imageUrl?: string | null;
  category?: MenuCategory;
};

export type PackageSummary = {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  activeVersion?: {
    id: string;
    versionNo: number;
    basePricePerPlate: string;
    minGuestCount: number;
    maxGuestCount?: number | null;
    publishedAt?: string | null;
  } | null;
};

export type PackageConfiguration = {
  id: string;
  packageId: string;
  packageName: string;
  versionNo: number;
  basePricePerPlate: string;
  minGuestCount: number;
  maxGuestCount?: number | null;
  categoryRules: Array<{
    id: string;
    category: MenuCategory;
    minSelections: number;
    maxSelections: number;
    isMandatory: boolean;
    items: Array<
      MenuItem & {
        itemPrice: string;
        includedValue: string;
        adjustmentAmount: string;
      }
    >;
  }>;
};

export type PackageSelection = {
  selectedItems: Array<{
    categoryId: string;
    menuItemId: string;
  }>;
};

export type PackageSelectionPrice = {
  valid: boolean;
  errors: string[];
  basePricePerPlate: string;
  totalCustomizationCharges: string;
  finalPerPlatePrice: string;
  items: Array<{
    categoryId: string;
    menuItemId: string;
    menuItemName: string;
    itemPrice: string;
    includedValue: string;
    adjustmentAmount: string;
  }>;
};
