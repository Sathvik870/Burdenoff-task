import { prisma } from "../src/lib/prisma";

const collections = await prisma.collection.findMany();

console.log(collections);

await prisma.$disconnect();