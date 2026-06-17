export type ApiHealth = {
  status: 'ok';
  service: string;
  timestamp: string;
};

export * from './options';

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
    regionId?: string | null;
    region?: OperatingRegion | null;
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

export type OperatingRegion = {
  id: string;
  code: string;
  name: string;
  centerLatitude: string;
  centerLongitude: string;
  serviceRadiusKm: string;
  deliveryFeePerKm: string;
  isActive: boolean;
};

export type PackageSummary = {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isCustom: boolean;
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
  isCustom: boolean;
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
  region?: OperatingRegion | null;
  distanceKm?: string | null;
  billableDistanceKm?: number | null;
  deliveryFeePerKm?: string | null;
  deliveryFee: string;
  subtotalAmount: string;
  totalAmount: string;
  items: Array<{
    categoryId: string;
    menuItemId: string;
    menuItemName: string;
    itemPrice: string;
    includedValue: string;
    adjustmentAmount: string;
  }>;
};

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type RefundStatus = 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type RefundSummary = {
  id: string;
  amount: string;
  refundStatus: RefundStatus;
  reason?: string | null;
  razorpayRefundId?: string | null;
  initiatedAt: string;
  processedAt?: string | null;
};

export type PaymentSummary = {
  id: string;
  orderId: string;
  amount: string;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paymentMethod?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt: string;
  refunds?: RefundSummary[];
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  packageName: string;
  guestCount: number;
  regionId?: string | null;
  region?: OperatingRegion | null;
  distanceKm?: string | null;
  deliveryFee?: string;
  totalAmount: string;
  createdAt: string;
  event?: {
    eventName?: string | null;
    eventDate: string;
    eventTimeStart?: string | null;
    address?: UserAddress;
  };
  payments?: PaymentSummary[];
};

export type CustomerNotification = {
  id: string;
  orderId?: string | null;
  type:
    | 'ORDER_CONFIRMED'
    | 'ORDER_IN_PROGRESS'
    | 'ORDER_READY'
    | 'ORDER_DELIVERED'
    | 'ORDER_CANCELLED'
    | 'PAYMENT_FAILED'
    | 'REFUND_UPDATED';
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

export type OrderNote = {
  id: string;
  orderId: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: 'ADMIN' | 'OPERATIONS' };
};

export type OrderDocument = {
  id: string;
  documentType: 'PAYMENT_RECEIPT' | 'GST_INVOICE' | 'REFUND_CREDIT_NOTE';
  documentNumber: string;
  generatedAt: string;
};

export type IntegrationReadiness = {
  razorpay: boolean;
  msg91: boolean;
  googleCloudStorage: boolean;
  googleMaps: 'configured-client-side';
  resend: 'deferred';
  sentry: 'deferred';
};
