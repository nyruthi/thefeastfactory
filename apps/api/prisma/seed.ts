import {
  AdminRole,
  PackageMenuItemRole,
  PackageType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();
const menuCsvPath = process.cwd().endsWith(join('apps', 'api'))
  ? join(process.cwd(), '..', '..', 'docs', 'TFF - Menu - Menu - Meal Box.csv')
  : join(process.cwd(), 'docs', 'TFF - Menu - Menu - Meal Box.csv');

type SeedMenuItem = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  isVeg: boolean;
  boxPrice: Prisma.Decimal;
  generalPrice: Prisma.Decimal;
};

async function main() {
  await seedSettings();
  await seedRegions();
  await seedAdmin();

  const menuRows = readMenuRows();
  const categoryByName = await seedCategories(menuRows);
  const menuItems = await seedMenuItems(menuRows, categoryByName);

  await seedFixedPackages(menuItems);
  await seedMealBoxes(menuItems);
  await seedCustomPackage();
}

async function seedSettings() {
  const settings = [
    [
      'min_booking_lead_hours',
      '48',
      'Minimum hours required between booking and event time.',
    ],
    ['otp_expiry_seconds', '300', 'Customer OTP expiry duration.'],
    ['otp_max_attempts', '5', 'Maximum OTP verification attempts.'],
    ['razorpay_currency', 'INR', 'Default Razorpay currency.'],
  ] as const;

  for (const [key, value, description] of settings) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }
}

async function seedRegions() {
  const regions = [
    ['HYDERABAD', 'Hyderabad', '17.38500000', '78.48670000'],
    ['KARIMNAGAR', 'Karimnagar', '18.43860000', '79.12880000'],
    ['WARANGAL', 'Warangal', '17.96890000', '79.59410000'],
  ] as const;

  for (const [code, name, latitude, longitude] of regions) {
    await prisma.operatingRegion.upsert({
      where: { code },
      update: {
        name,
        centerLatitude: new Prisma.Decimal(latitude),
        centerLongitude: new Prisma.Decimal(longitude),
        serviceRadiusKm: new Prisma.Decimal('50.00'),
        deliveryFeePerKm: new Prisma.Decimal('10.00'),
        isActive: true,
      },
      create: {
        code,
        name,
        centerLatitude: new Prisma.Decimal(latitude),
        centerLongitude: new Prisma.Decimal(longitude),
        serviceRadiusKm: new Prisma.Decimal('50.00'),
        deliveryFeePerKm: new Prisma.Decimal('10.00'),
      },
    });
  }
}

async function seedAdmin() {
  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@thefeastfactory.local' },
    update: { name: 'The Feast Factory Admin', role: AdminRole.ADMIN },
    create: {
      email: 'admin@thefeastfactory.local',
      name: 'The Feast Factory Admin',
      role: AdminRole.ADMIN,
      passwordHash,
    },
  });
}

function readMenuRows() {
  const csv = readFileSync(menuCsvPath, 'utf8');
  const [headerLine, ...lines] = parseCsv(csv);
  if (!headerLine?.length) return [];

  return lines
    .map((cells) => ({
      categoryName: cells[0]?.trim(),
      itemName: cells[1]?.trim(),
      baseOutletPrice: money(cells[2]),
      boxPrice: money(cells[5]) ?? money(cells[4]) ?? money(cells[6]),
      generalPrice: money(cells[6]) ?? money(cells[5]) ?? money(cells[4]),
    }))
    .filter((row) => row.categoryName && row.itemName)
    .filter((row) => row.boxPrice && row.generalPrice);
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function money(value?: string) {
  const normalized = value?.replace(/[^\d.]/g, '');
  if (!normalized) return null;
  return new Prisma.Decimal(Number(normalized).toFixed(2));
}

async function seedCategories(
  rows: ReturnType<typeof readMenuRows>,
): Promise<Map<string, { id: string; name: string }>> {
  const names = [...new Set(rows.map((row) => row.categoryName))];
  const categoryByName = new Map<string, { id: string; name: string }>();

  for (const [index, name] of names.entries()) {
    const category = await prisma.menuCategory.upsert({
      where: { name },
      update: {
        displayOrder: index + 1,
        isActive: true,
      },
      create: {
        name,
        displayOrder: index + 1,
      },
    });
    categoryByName.set(name, category);
  }

  return categoryByName;
}

async function seedMenuItems(
  rows: ReturnType<typeof readMenuRows>,
  categoryByName: Map<string, { id: string; name: string }>,
) {
  const menuItems: SeedMenuItem[] = [];

  for (const row of rows) {
    const category = categoryByName.get(row.categoryName);
    if (!category || !row.boxPrice || !row.generalPrice) continue;

    const item = await prisma.menuItem.upsert({
      where: {
        categoryId_name: {
          categoryId: category.id,
          name: row.itemName,
        },
      },
      update: {
        boxPrice: row.boxPrice,
        generalPrice: row.generalPrice,
        isVeg: isVeg(row.categoryName, row.itemName),
        isActive: true,
        deletedAt: null,
      },
      create: {
        categoryId: category.id,
        name: row.itemName,
        boxPrice: row.boxPrice,
        generalPrice: row.generalPrice,
        isVeg: isVeg(row.categoryName, row.itemName),
      },
    });

    menuItems.push({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      categoryName: row.categoryName,
      isVeg: item.isVeg,
      boxPrice: item.boxPrice,
      generalPrice: item.generalPrice,
    });
  }

  return menuItems;
}

function isVeg(categoryName: string, itemName: string) {
  const text = `${categoryName} ${itemName}`.toLowerCase();
  return !/(non veg|chicken|mutton|fish|egg|prawn|kodi|mamsam|royyalu)/.test(
    text,
  );
}

async function seedFixedPackages(menuItems: SeedMenuItem[]) {
  const fixedPackages = [
    ['Silver Package', '499.00'],
    ['Gold Package', '699.00'],
    ['Premium Package', '899.00'],
  ] as const;

  for (const [index, [name, price]] of fixedPackages.entries()) {
    const version = await upsertPackageVersion({
      name,
      description: `${name} fixed catering selection. Items are not editable; customers can add extras for all guests.`,
      type: PackageType.FIXED_PACKAGE,
      displayOrder: index + 1,
      price,
    });

    await upsertPackageItems(version.id, menuItems, PackageMenuItemRole.EXTRA, {
      isSwappable: false,
    });
  }
}

async function seedMealBoxes(menuItems: SeedMenuItem[]) {
  const mealBoxes = [
    ['3 Item Veg Meal Box', '99.00', 3, true],
    ['3 Item Non-Veg Meal Box', '145.00', 3, false],
    ['5 Item Veg Meal Box', '150.00', 5, true],
    ['5 Item Non-Veg Meal Box', '220.00', 5, false],
    ['8 Item Veg Meal Box', '220.00', 8, true],
    ['8 Item Non-Veg Meal Box', '290.00', 8, false],
  ] as const;

  for (const [index, [name, price, count, vegOnly]] of mealBoxes.entries()) {
    const version = await upsertPackageVersion({
      name,
      description:
        'Meal box with fixed included dishes. Swaps are allowed only within the same category and veg/non-veg type.',
      type: PackageType.MEAL_BOX,
      displayOrder: 20 + index,
      price,
    });
    const included = selectMealBoxItems(menuItems, count, vegOnly);
    await upsertPackageItems(
      version.id,
      included,
      PackageMenuItemRole.INCLUDED,
      { isSwappable: true },
    );
  }
}

async function seedCustomPackage() {
  await prisma.package.updateMany({
    where: { name: 'Custom Package' },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await upsertPackageVersion({
    name: 'Custom Menu',
    description: 'Build your own package from any available dish.',
    type: PackageType.CUSTOM_PACKAGE,
    displayOrder: 100,
    price: '0.00',
  });
}

async function upsertPackageVersion(input: {
  name: string;
  description: string;
  type: PackageType;
  displayOrder: number;
  price: string;
}) {
  const pkg = await prisma.package.upsert({
    where: { name: input.name },
    update: {
      description: input.description,
      type: input.type,
      displayOrder: input.displayOrder,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: input.name,
      description: input.description,
      type: input.type,
      displayOrder: input.displayOrder,
    },
  });

  return prisma.packageVersion.upsert({
    where: { packageId_versionNo: { packageId: pkg.id, versionNo: 1 } },
    update: {
      basePricePerPlate: new Prisma.Decimal(input.price),
      minGuestCount: 10,
      maxGuestCount: 500,
      isActive: true,
      publishedAt: new Date(),
    },
    create: {
      packageId: pkg.id,
      versionNo: 1,
      basePricePerPlate: new Prisma.Decimal(input.price),
      minGuestCount: 10,
      maxGuestCount: 500,
      isActive: true,
      publishedAt: new Date(),
    },
  });
}

function selectMealBoxItems(
  menuItems: SeedMenuItem[],
  count: number,
  vegOnly: boolean,
) {
  const preferredCategories = vegOnly
    ? ['Veg Starters', 'Indian Breads', 'Veg Curry', 'Rice Items', 'Desserts']
    : [
        'Non Veg Starters',
        'Indian Breads',
        'Non Veg Curry',
        'Biryani',
        'Rice Items',
        'Desserts',
      ];
  const selected: SeedMenuItem[] = [];

  for (const categoryName of preferredCategories) {
    const item = menuItems.find(
      (candidate) =>
        candidate.categoryName === categoryName &&
        (!vegOnly || candidate.isVeg) &&
        !selected.some((selectedItem) => selectedItem.id === candidate.id),
    );
    if (item) selected.push(item);
    if (selected.length === count) break;
  }

  if (selected.length < count) {
    selected.push(
      ...menuItems
        .filter((item) => (!vegOnly || item.isVeg) && !selected.includes(item))
        .slice(0, count - selected.length),
    );
  }

  return selected;
}

async function upsertPackageItems(
  packageVersionId: string,
  menuItems: SeedMenuItem[],
  role: PackageMenuItemRole,
  options: { isSwappable: boolean },
) {
  for (const [index, item] of menuItems.entries()) {
    await prisma.packageMenuItem.upsert({
      where: {
        packageVersionId_menuItemId_role: {
          packageVersionId,
          menuItemId: item.id,
          role,
        },
      },
      update: {
        categoryId: item.categoryId,
        isAvailable: true,
        isSwappable: options.isSwappable,
        displayOrder: index + 1,
      },
      create: {
        packageVersionId,
        categoryId: item.categoryId,
        menuItemId: item.id,
        role,
        isAvailable: true,
        isSwappable: options.isSwappable,
        displayOrder: index + 1,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
