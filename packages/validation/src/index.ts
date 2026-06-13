import { z } from 'zod';

export const mobileNumberSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const requestOtpSchema = z.object({
  mobileNumber: mobileNumberSchema,
});

export const verifyOtpSchema = z.object({
  mobileNumber: mobileNumberSchema,
  otp: z.string().regex(/^\d{4,6}$/, 'Enter a valid OTP'),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(255).optional().nullable(),
});

export const addressTypeSchema = z.enum(['HOME', 'OFFICE', 'EVENT_VENUE', 'OTHER']);

export const createAddressSchema = z.object({
  addressType: addressTypeSchema.default('HOME'),
  label: z.string().trim().max(50).optional().nullable(),
  addressLine1: z.string().trim().min(1).max(255),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  landmark: z.string().trim().max(255).optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

const moneyStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid monetary amount');

export const createMenuCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateMenuCategorySchema = createMenuCategorySchema.partial();

export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  basePrice: moneyStringSchema,
  isVeg: z.boolean().default(true),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createPackageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updatePackageSchema = createPackageSchema.partial();

export const createPackageVersionSchema = z
  .object({
    versionNo: z.number().int().min(1),
    basePricePerPlate: moneyStringSchema,
    minGuestCount: z.number().int().min(1).default(10),
    maxGuestCount: z.number().int().min(1).optional().nullable(),
    isActive: z.boolean().default(true),
    publishedAt: z.string().datetime().optional().nullable(),
  })
  .refine((value) => !value.maxGuestCount || value.maxGuestCount >= value.minGuestCount, {
    message: 'Maximum guest count must be greater than or equal to minimum guest count',
    path: ['maxGuestCount'],
  });

export const updatePackageVersionSchema = createPackageVersionSchema.partial();

export const upsertPackageCategoryRuleSchema = z
  .object({
    categoryId: z.string().uuid(),
    minSelections: z.number().int().min(0).default(1),
    maxSelections: z.number().int().min(1),
    isMandatory: z.boolean().default(true),
  })
  .refine((value) => value.maxSelections >= value.minSelections, {
    message: 'Maximum selections must be greater than or equal to minimum selections',
    path: ['maxSelections'],
  });

export const upsertPackageMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  isAvailable: z.boolean().default(true),
});

export const upsertPackageItemPricingSchema = z.object({
  menuItemId: z.string().uuid(),
  itemPrice: moneyStringSchema,
  includedValue: moneyStringSchema,
});

export const eventDraftSchema = z.object({
  packageVersionId: z.string().uuid(),
  addressId: z.string().uuid(),
  eventName: z.string().max(200).optional(),
  eventDate: z.string(),
  eventTimeStart: z.string().optional(),
  guestCount: z.number().int().min(1),
  specialNotes: z.string().max(1000).optional(),
});

export const selectedMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  menuItemId: z.string().uuid(),
});

export const packageSelectionSchema = z.object({
  selectedItems: z.array(selectedMenuItemSchema).min(1),
});

export const orderQuoteSchema = z.object({
  eventId: z.string().uuid(),
  selectedItems: z.array(selectedMenuItemSchema).min(1),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>;
export type UpdateMenuCategoryInput = z.infer<typeof updateMenuCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type CreatePackageVersionInput = z.infer<typeof createPackageVersionSchema>;
export type UpdatePackageVersionInput = z.infer<typeof updatePackageVersionSchema>;
export type UpsertPackageCategoryRuleInput = z.infer<typeof upsertPackageCategoryRuleSchema>;
export type UpsertPackageMenuItemInput = z.infer<typeof upsertPackageMenuItemSchema>;
export type UpsertPackageItemPricingInput = z.infer<typeof upsertPackageItemPricingSchema>;
export type PackageSelectionInput = z.infer<typeof packageSelectionSchema>;
export type EventDraftInput = z.infer<typeof eventDraftSchema>;
export type OrderQuoteInput = z.infer<typeof orderQuoteSchema>;
