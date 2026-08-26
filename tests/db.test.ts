import { afterAll, describe, expect, test } from "bun:test";
import { prisma } from "../src/lib/prisma";

describe("Database", () => {
  test("connects to PostgreSQL and fetches collections", async () => {
    const collections = await prisma.collection.findMany();

    expect(collections).toBeArray();
  });

  test("fetches documents", async () => {
    const documents = await prisma.document.findMany();

    expect(documents).toBeArray();
  });

  test("collections contain valid required fields", async () => {
    const collections = await prisma.collection.findMany({
      take: 1,
    });

    expect(collections.length).toBeGreaterThan(0);

    const collection = collections[0]!;

    expect(collection.id).toBeString();
    expect(collection.name).toBeString();
    expect(collection.slug).toBeString();
    expect(collection.createdAt).toBeInstanceOf(Date);
  });

  test("documents contain valid required fields", async () => {
    const documents = await prisma.document.findMany({
      take: 1,
    });

    expect(documents.length).toBeGreaterThan(0);

    const document = documents[0]!;

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
  await prisma.$disconnect();
});