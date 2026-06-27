# Meal Boxes Tab — Architecture & Reference

The Meal Boxes page lets customers pick a Veg or Non-Veg meal box (3 / 5 / 8 items), set a quantity, and proceed to checkout.

---

## Key file

```
apps/customer-web/app/packages/meal-boxes/page.tsx   ← entire page (client component)
```

No sub-components are split out — everything is in this one file.

---

## Page layout

```
Header (Meal Boxes + subtitle)
Trust cards row  (Perfect for | Min Order | Hygienic | On-time)
────────────────────────────────────────────────
[Veg ●]  [Non Veg ●]          ← toggle
[3 Item Box] [5 Item Box*] [8 Item Box]   ← 3-column card grid
                                            * Most Popular banner
[X Item Veg/Non-Veg Box Includes ▲ Collapse]  ← appears when a box is selected
[Fresh Ingredients | Hygienic Packaging | Balanced Nutrition | Timely Delivery]
                                         ← 4-column bottom features
────────────────────────────────────────────────
                      Sticky sidebar (desktop)  → Your Order panel
Mobile: fixed CTA bar at bottom
```

---

## State

| Variable | Type | Purpose |
|---|---|---|
| `vegPackages` | `PackageSummary[]` | 3 veg MEAL_BOX packages (cheapest first) |
| `nonVegPackages` | `PackageSummary[]` | 3 non-veg MEAL_BOX packages |
| `vegMode` | `'veg' \| 'non-veg'` | Which set of packages is shown |
| `selectedIdx` | `number \| null` | Index 0/1/2 of the chosen box; null = none |
| `qty` | `number` | Box count (default 100, min from API) |
| `loading` | `boolean` | True until API call resolves |

Derived:
```ts
const packages = vegMode === 'veg' ? vegPackages : nonVegPackages;
const selectedPkg = selectedIdx !== null ? packages[selectedIdx] : null;
```

---

## Veg / Non-Veg split (API)

All MEAL_BOX packages are fetched from `GET /packages`, filtered by `type === 'MEAL_BOX'`, then sorted ascending by `basePricePerPlate`.

Split logic:
```ts
vegPackages    = packages where !name.toLowerCase().includes('non')
nonVegPackages = packages where  name.toLowerCase().includes('non')
```

DB seed names: `"3 Item Veg"`, `"5 Item Veg"`, `"8 Item Veg"`, `"3 Item Non-Veg"`, etc.

Switching `vegMode` resets `selectedIdx` to null.

---

## Static display data (all in page.tsx)

### `BOX_META` — card structure (same for veg & non-veg)
Chips (icon + label) shown on each card. Index 0 = 3-item, 1 = 5-item, 2 = 8-item.

| Box | Chips |
|---|---|
| 3 Item | Main Course, Rice/Bread, Dessert |
| 5 Item | Starter, Main Course, Rice/Bread, Beverage, Dessert |
| 8 Item | 2 Starters, Main Course, Rice/Bread, Dal, Sabzi, Beverage, Dessert |

### `BOX_VEG_DISHES` / `BOX_NONVEG_DISHES`
Array of 3 arrays (one per box). Each dish has `{ category, name, image, description }`.

Used in two places:
1. **Expandable items section** (with descriptions, on the main content area)
2. **Sidebar** "What's included" list (image + category + name only)

### `INFO_CARDS` — trust bar (4 items)
Perfect for | Minimum Order (20 boxes) | Hygienic & Fresh | On-time Delivery

### `BOTTOM_FEATURES` — footer highlight grid (4 items)
Fresh Ingredients | Hygienic Packaging | Balanced Nutrition | Timely Delivery

---

## Components in this file

| Component | What it renders |
|---|---|
| `VegDot` | Green/red dot inside a square border (Indian food symbol) |
| `BoxCard` | One meal box card with image, chips, price, "View Details" button |
| `OrderSidebar` | Right sticky panel — selected box, qty stepper, price, CTA |
| `PageSkeleton` | Loading placeholder for the toggle + cards |
| `MealBoxesPage` | Root page component (default export) |

---

## "View Details" button behavior

- Clicking selects the box (sets `selectedIdx`), which:
  - Fills the button (primary color)
  - Updates the sidebar with box name, dishes, and pricing
  - Shows the expandable `X Item Veg/Non-Veg Box Includes` section below the cards
- Clicking the same box again **deselects** (toggles off)
- "Collapse" button in the expanded section also deselects

---

## Sidebar display name

```ts
`${BOX_NUMS[index]} Item ${vegMode === 'veg' ? 'Veg' : 'Non-Veg'} Box`
// → "5 Item Veg Box" or "5 Item Non-Veg Box"
```

---

## Checkout flow

`handleContinue()` writes to `useOrderBuilderStore` and pushes to:
```
/events/new?packageVersionId=<activeVersion.id>
```

Store fields set: `packageId`, `packageVersionId`, `packageName`, `isCustom`, `basePricePerPlate`, `minGuestCount`, `maxGuestCount`, `guestCount`.

---

## Common edits

**Add / change dishes for a box**
→ Edit `BOX_VEG_DISHES[index]` or `BOX_NONVEG_DISHES[index]` in page.tsx.
Each entry: `{ category: string, name: string, image: string, description: string }`.
Image paths are in `apps/customer-web/public/` (e.g. `/inc-starter.png`).

**Change box card chips (item counts/types)**
→ Edit `BOX_META[index].chips`. Each chip: `{ Icon: LucideIcon, label: string }`.

**Change trust bar or bottom features**
→ Edit `INFO_CARDS` or `BOTTOM_FEATURES` arrays.

**Change minimum quantity**
→ Comes from `pkg.activeVersion.minGuestCount` (set in DB via seed / admin).

**Add a 4th box type**
→ Push to `BOX_META`, `BOX_DISPLAY_NAMES`, `BOX_NUMS`, `BOX_VEG_DISHES`, `BOX_NONVEG_DISHES`. The grid auto-expands (`sm:grid-cols-3` would need updating to `sm:grid-cols-4`).

---

## Related files

| File | Role |
|---|---|
| `apps/api/src/modules/packages/packages.service.ts` | Backend — `mealBoxCategoryRules()`, swap validation, pricing |
| `apps/api/prisma/seed.ts` | Seeds 6 meal box packages (3 veg + 3 non-veg) with items |
| `packages/shared-types/src/index.ts` | `PackageSummary`, `PackageConfiguration`, `MenuItem` types |
| `apps/customer-web/store/order-builder.store.ts` | Zustand store — holds selected package for checkout |
| `apps/customer-web/app/events/new/page.tsx` | Next step after "Continue to Checkout" |
