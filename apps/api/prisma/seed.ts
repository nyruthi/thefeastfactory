import { PrismaClient, AdminRole, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.platformSetting.upsert({
    where: { key: 'min_booking_lead_hours' },
    update: {},
    create: {
      key: 'min_booking_lead_hours',
      value: '48',
      description: 'Minimum hours required between booking and event time.',
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: 'otp_expiry_seconds' },
    update: {},
    create: {
      key: 'otp_expiry_seconds',
      value: '300',
      description: 'Customer OTP expiry duration.',
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: 'otp_max_attempts' },
    update: {},
    create: {
      key: 'otp_max_attempts',
      value: '5',
      description: 'Maximum OTP verification attempts.',
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: 'razorpay_currency' },
    update: {},
    create: {
      key: 'razorpay_currency',
      value: 'INR',
      description: 'Default Razorpay currency.',
    },
  });

  const passwordHash = await bcrypt.hash('Admin@12345', 12);

  const regionSeeds = [
    {
      code: 'HYDERABAD',
      name: 'Hyderabad',
      latitude: '17.38500000',
      longitude: '78.48670000',
    },
    {
      code: 'KARIMNAGAR',
      name: 'Karimnagar',
      latitude: '18.43860000',
      longitude: '79.12880000',
    },
    {
      code: 'WARANGAL',
      name: 'Warangal',
      latitude: '17.96890000',
      longitude: '79.59410000',
    },
  ] as const;

  for (const region of regionSeeds) {
    await prisma.operatingRegion.upsert({
      where: { code: region.code },
      update: {
        name: region.name,
        centerLatitude: new Prisma.Decimal(region.latitude),
        centerLongitude: new Prisma.Decimal(region.longitude),
        serviceRadiusKm: new Prisma.Decimal('50.00'),
        deliveryFeePerKm: new Prisma.Decimal('10.00'),
        isActive: true,
      },
      create: {
        code: region.code,
        name: region.name,
        centerLatitude: new Prisma.Decimal(region.latitude),
        centerLongitude: new Prisma.Decimal(region.longitude),
        serviceRadiusKm: new Prisma.Decimal('50.00'),
        deliveryFeePerKm: new Prisma.Decimal('10.00'),
      },
    });
  }

  await prisma.adminUser.upsert({
    where: { email: 'admin@thefeastfactory.local' },
    update: {},
    create: {
      email: 'admin@thefeastfactory.local',
      name: 'The Feast Factory Admin',
      role: AdminRole.ADMIN,
      passwordHash,
    },
  });

  const categories = [
    'Starters',
    'Main Course',
    'Desserts',
    'Beverages',
    'Snacks',
  ];
  const categoryByName = new Map<string, { id: string }>();
  for (const [index, name] of categories.entries()) {
    const category = await prisma.menuCategory.upsert({
      where: { name },
      update: { isActive: true, displayOrder: index + 1 },
      create: {
        name,
        displayOrder: index + 1,
      },
    });
    categoryByName.set(name, category);
  }

  const menuSeeds = [
    ['Starters', 'Paneer Tikka', '120.00', true],
    ['Starters', 'Veg Manchurian', '90.00', true],
    ['Starters', 'Chicken 65', '140.00', false],
    ['Main Course', 'Veg Biryani', '150.00', true],
    ['Main Course', 'Paneer Butter Masala', '170.00', true],
    ['Main Course', 'Chicken Biryani', '190.00', false],
    ['Desserts', 'Gulab Jamun', '60.00', true],
    ['Desserts', 'Rasmalai', '90.00', true],
    ['Beverages', 'Fresh Lime Soda', '50.00', true],
    ['Snacks', 'Samosa', '35.00', true],
  ] as const;

  const itemByName = new Map<
    string,
    { id: string; categoryId: string; basePrice: Prisma.Decimal }
  >();
  for (const [categoryName, name, basePrice, isVeg] of menuSeeds) {
    const category = categoryByName.get(categoryName)!;
    const item = await prisma.menuItem.upsert({
      where: { categoryId_name: { categoryId: category.id, name } },
      update: {
        basePrice: new Prisma.Decimal(basePrice),
        isVeg,
        isActive: true,
        deletedAt: null,
      },
      create: {
        categoryId: category.id,
        name,
        basePrice: new Prisma.Decimal(basePrice),
        isVeg,
      },
    });
    itemByName.set(name, item);
  }

  const packageSeeds = [
    {
      name: 'Silver Package',
      price: '499.00',
      starterCount: 1,
      mainCount: 2,
      dessertCount: 1,
    },
    {
      name: 'Gold Package',
      price: '699.00',
      starterCount: 2,
      mainCount: 3,
      dessertCount: 1,
    },
    {
      name: 'Premium Package',
      price: '899.00',
      starterCount: 3,
      mainCount: 3,
      dessertCount: 2,
    },
  ] as const;

  for (const [index, packageSeed] of packageSeeds.entries()) {
    const pkg = await prisma.package.upsert({
      where: { name: packageSeed.name },
      update: {
        isCustom: false,
        isActive: true,
        displayOrder: index + 1,
        deletedAt: null,
      },
      create: {
        name: packageSeed.name,
        description: `${packageSeed.name} catering selection`,
        isCustom: false,
        displayOrder: index + 1,
      },
    });

    const version = await prisma.packageVersion.upsert({
      where: { packageId_versionNo: { packageId: pkg.id, versionNo: 1 } },
      update: {
        basePricePerPlate: new Prisma.Decimal(packageSeed.price),
        isActive: true,
        publishedAt: new Date(),
      },
      create: {
        packageId: pkg.id,
        versionNo: 1,
        basePricePerPlate: new Prisma.Decimal(packageSeed.price),
        minGuestCount: 10,
        maxGuestCount: 500,
        publishedAt: new Date(),
      },
    });

    const ruleSeeds = [
      ['Starters', packageSeed.starterCount],
      ['Main Course', packageSeed.mainCount],
      ['Desserts', packageSeed.dessertCount],
    ] as const;

    for (const [categoryName, count] of ruleSeeds) {
      const category = categoryByName.get(categoryName)!;
      await prisma.packageCategoryRule.upsert({
        where: {
          packageVersionId_categoryId: {
            packageVersionId: version.id,
            categoryId: category.id,
          },
        },
        update: {
          minSelections: count,
          maxSelections: count,
          isMandatory: true,
        },
        create: {
          packageVersionId: version.id,
          categoryId: category.id,
          minSelections: count,
          maxSelections: count,
          isMandatory: true,
        },
      });
    }

    for (const [name, item] of itemByName) {
      const isPackageCategory = ruleSeeds.some(
        ([categoryName]) =>
          categoryByName.get(categoryName)!.id === item.categoryId,
      );
      if (!isPackageCategory) continue;

      await prisma.packageMenuItem.upsert({
        where: {
          packageVersionId_menuItemId: {
            packageVersionId: version.id,
            menuItemId: item.id,
          },
        },
        update: { categoryId: item.categoryId, isAvailable: true },
        create: {
          packageVersionId: version.id,
          categoryId: item.categoryId,
          menuItemId: item.id,
        },
      });

      const isPremiumDish = [
        'Paneer Tikka',
        'Chicken 65',
        'Paneer Butter Masala',
        'Chicken Biryani',
        'Rasmalai',
      ].includes(name);
      const includedValue = isPremiumDish
        ? item.basePrice.minus(20)
        : item.basePrice;
      await prisma.packageMenuItemPricing.upsert({
        where: {
          packageVersionId_menuItemId: {
            packageVersionId: version.id,
            menuItemId: item.id,
          },
        },
        update: { itemPrice: item.basePrice, includedValue },
        create: {
          packageVersionId: version.id,
          menuItemId: item.id,
          itemPrice: item.basePrice,
          includedValue,
        },
      });
    }
  }

  const customPackage = await prisma.package.upsert({
    where: { name: 'Custom Package' },
    update: {
      description: 'Build your own menu from any available dish.',
      isCustom: true,
      isActive: true,
      displayOrder: packageSeeds.length + 1,
      deletedAt: null,
    },
    create: {
      name: 'Custom Package',
      description: 'Build your own menu from any available dish.',
      isCustom: true,
      isActive: true,
      displayOrder: packageSeeds.length + 1,
    },
  });

  await prisma.packageVersion.upsert({
    where: {
      packageId_versionNo: { packageId: customPackage.id, versionNo: 1 },
    },
    update: {
      basePricePerPlate: new Prisma.Decimal('0.00'),
      minGuestCount: 10,
      maxGuestCount: 500,
      isActive: true,
      publishedAt: new Date(),
    },
    create: {
      packageId: customPackage.id,
      versionNo: 1,
      basePricePerPlate: new Prisma.Decimal('0.00'),
      minGuestCount: 10,
      maxGuestCount: 500,
      isActive: true,
      publishedAt: new Date(),
    },
  });
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
