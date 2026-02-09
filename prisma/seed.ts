import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const activityTypes = [
  { name: "Development", isBillableDefault: true },
  { name: "Meeting", isBillableDefault: true },
  { name: "Support", isBillableDefault: true },
  { name: "Research", isBillableDefault: true },
  { name: "Internal", isBillableDefault: false },
];

const main = async () => {
  for (const activityType of activityTypes) {
    await prisma.activityType.upsert({
      where: { name: activityType.name },
      update: { isBillableDefault: activityType.isBillableDefault },
      create: activityType,
    });
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Failed to seed activity types", error);
    await prisma.$disconnect();
    process.exit(1);
  });
