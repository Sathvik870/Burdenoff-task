import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from "bun:test";

import { prisma } from "../src/lib/prisma";

let collectionId: string;

beforeAll(async () => {
  const collection = await prisma.collection.create({
    data: {
      name: "Database Test Collection",
      slug: `database-test-${crypto.randomUUID()}`,
    },
  });

  collectionId = collection.id;

  await prisma.document.create({
    data: {
      title: "Database Test Document",
      content: "Database test content",
      tags: ["test"],
      collectionId,
      isArchived: false,
    },
  });
});

describe("Database", () => {
  test("connects to PostgreSQL and fetches collections", async () => {
    const collections = await prisma.collection.findMany();

    expect(collections).toBeArray();
    expect(collections.length).toBeGreaterThan(0);
  });

  test("fetches documents", async () => {
    const documents = await prisma.document.findMany();

    expect(documents).toBeArray();
    expect(documents.length).toBeGreaterThan(0);
  });

  test("collections contain valid required fields", async () => {
    const collections = await prisma.collection.findMany({
      where: {
        id: collectionId,
      },
      take: 1,
    });

    const collection = collections[0];

    expect(collection).toBeDefined();

    if (!collection) {
      return;
    }

    expect(collection.id).toBeString();
    expect(collection.name).toBeString();
    expect(collection.slug).toBeString();
    expect(collection.createdAt).toBeInstanceOf(Date);
  });

  test("documents contain valid required fields", async () => {
    const documents = await prisma.document.findMany({
      where: {
        collectionId,
      },
      take: 1,
    });

    const document = documents[0];

    expect(document).toBeDefined();

    if (!document) {
      return;
    }

    expect(document.id).toBeString();
    expect(document.title).toBeString();
    expect(document.content).toBeString();
    expect(document.tags).toBeArray();
    expect(document.collectionId).toBeString();
    expect(document.isArchived).toBeBoolean();
    expect(document.createdAt).toBeInstanceOf(Date);
  });
});

afterAll(async () => {
  await prisma.collection.delete({
    where: {
      id: collectionId,
    },
  });

  await prisma.$disconnect();
});