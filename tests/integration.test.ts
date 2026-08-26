import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from "bun:test";
import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";

import { prisma } from "../src/lib/prisma";
import { resolvers } from "../src/schema/resolvers";

const typeDefs = readFileSync(
  new URL("../src/schema/schema.graphql", import.meta.url),
  "utf8",
);

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
});

const request = async (
  query: string,
  variables?: Record<string, unknown>,
) => {
  return yoga.fetch("http://localhost/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
};

let collectionId: string;
let secondCollectionId: string;

beforeAll(async () => {
  const collection = await prisma.collection.create({
    data: {
      name: "Integration Test Collection",
      slug: `integration-test-${crypto.randomUUID()}`,
    },
  });

  const secondCollection = await prisma.collection.create({
    data: {
      name: "Second Integration Collection",
      slug: `integration-test-second-${crypto.randomUUID()}`,
    },
  });

  collectionId = collection.id;
  secondCollectionId = secondCollection.id;

  await prisma.document.createMany({
    data: [
      {
        title: "Bank Statement",
        content: "September bank statement",
        tags: ["bank", "statement"],
        collectionId,
        isArchived: false,
      },
      {
        title: "Bank Account Details",
        content: "Bank account information",
        tags: ["bank"],
        collectionId,
        isArchived: false,
      },
      {
        title: "Archived Bank Document",
        content: "Old bank document",
        tags: ["bank", "archived"],
        collectionId,
        isArchived: true,
      },
      {
        title: "Insurance Policy",
        content: "Home insurance policy",
        tags: ["insurance"],
        collectionId: secondCollectionId,
        isArchived: false,
      },
    ],
  });
});

afterAll(async () => {
  await prisma.collection.deleteMany({
    where: {
      id: {
        in: [collectionId, secondCollectionId],
      },
    },
  });

  await prisma.$disconnect();
});

describe("GraphQL Integration Tests", () => {
  test("fetches all collections", async () => {
    const response = await request(`
      query {
        collections {
          id
          name
          slug
          createdAt
        }
      }
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.collections).toBeArray();
    expect(result.data.collections.length).toBeGreaterThanOrEqual(2);
  });

  test("fetches collection by id", async () => {
    const response = await request(
      `
        query($id: ID!) {
          collection(id: $id) {
            id
            name
            slug
            createdAt
          }
        }
      `,
      {
        id: collectionId,
      },
    );

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.collection).not.toBeNull();
    expect(result.data.collection.id).toBe(collectionId);
  });

  test("returns null for non-existent collection", async () => {
    const nonExistentCollectionId = crypto.randomUUID();

    const response = await request(
      `
        query($id: ID!) {
          collection(id: $id) {
            id
            name
            slug
          }
        }
      `,
      {
        id: nonExistentCollectionId,
      },
    );

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.collection).toBeNull();
  });

  test("fetches documents without filters", async () => {
    const response = await request(`
      query {
        documents {
          items {
            id
            title
            content
            tags
            collectionId
            isArchived
            createdAt
          }
          nextCursor
        }
      }
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents).toBeDefined();
    expect(result.data.documents.items).toBeArray();
    expect(result.data.documents.items.length).toBeGreaterThan(0);
  });

  test("fetches documents by collection", async () => {
    const response = await request(
      `
        query($collectionId: ID!) {
          documents(collectionId: $collectionId) {
            items {
              id
              title
              collectionId
            }
            nextCursor
          }
        }
      `,
      {
        collectionId,
      },
    );

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();
    expect(result.data.documents.items.length).toBeGreaterThan(0);

    for (const document of result.data.documents.items) {
      expect(document.collectionId).toBe(collectionId);
    }
  });

  test("searches documents by title or content", async () => {
    const response = await request(
      `
        query($search: String!) {
          documents(search: $search) {
            items {
              id
              title
              content
            }
            nextCursor
          }
        }
      `,
      {
        search: "Bank",
      },
    );

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();
    expect(result.data.documents.items.length).toBeGreaterThan(0);

    for (const document of result.data.documents.items) {
      const title = document.title.toLowerCase();
      const content = document.content.toLowerCase();

      expect(
        title.includes("bank") ||
          content.includes("bank"),
      ).toBe(true);
    }
  });

  test("filters documents by archived status", async () => {
    const response = await request(`
      query {
        documents(isArchived: false) {
          items {
            id
            title
            isArchived
          }
          nextCursor
        }
      }
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();
    expect(result.data.documents.items.length).toBeGreaterThan(0);

    for (const document of result.data.documents.items) {
      expect(document.isArchived).toBe(false);
    }
  });

  test("respects the take limit", async () => {
    const response = await request(`
      query {
        documents(take: 2) {
          items {
            id
            title
          }
          nextCursor
        }
      }
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();
    expect(result.data.documents.items.length).toBeLessThanOrEqual(2);
  });

  test("handles cursor pagination", async () => {
    const firstResponse = await request(`
      query {
        documents(take: 2) {
          items {
            id
            title
          }
          nextCursor
        }
      }
    `);

    expect(firstResponse.status).toBe(200);

    const firstResult = await firstResponse.json();

    expect(firstResult.errors).toBeUndefined();
    expect(firstResult.data.documents.items).toBeArray();

    if (firstResult.data.documents.nextCursor) {
      const secondResponse = await request(
        `
          query($cursor: String!) {
            documents(take: 2, cursor: $cursor) {
              items {
                id
                title
              }
              nextCursor
            }
          }
        `,
        {
          cursor: firstResult.data.documents.nextCursor,
        },
      );

      expect(secondResponse.status).toBe(200);

      const secondResult = await secondResponse.json();

      expect(secondResult.errors).toBeUndefined();
      expect(secondResult.data.documents.items).toBeArray();

      const firstPageIds =
        firstResult.data.documents.items.map(
          (document: { id: string }) => document.id,
        );

      const secondPageIds =
        secondResult.data.documents.items.map(
          (document: { id: string }) => document.id,
        );

      for (const id of secondPageIds) {
        expect(firstPageIds).not.toContain(id);
      }
    }
  });

  test("handles combined filters", async () => {
    const response = await request(
      `
        query(
          $collectionId: ID!
          $search: String!
        ) {
          documents(
            collectionId: $collectionId
            search: $search
            isArchived: false
            take: 5
          ) {
            items {
              id
              title
              content
              collectionId
              isArchived
            }
            nextCursor
          }
        }
      `,
      {
        collectionId,
        search: "Bank",
      },
    );

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();

    for (const document of result.data.documents.items) {
      expect(document.collectionId).toBe(collectionId);
      expect(document.isArchived).toBe(false);

      const title = document.title.toLowerCase();
      const content = document.content.toLowerCase();

      expect(
        title.includes("bank") ||
          content.includes("bank"),
      ).toBe(true);
    }
  });

  test("returns empty result for a search with no matches", async () => {
    const response = await request(`
      query {
        documents(
          search: "THIS_DOCUMENT_SHOULD_NOT_EXIST_123456"
        ) {
          items {
            id
            title
          }
          nextCursor
        }
      }
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toEqual([]);
    expect(result.data.documents.nextCursor).toBeNull();
  });

  test("clamps take to the minimum value", async () => {
    const response = await request(`
      query {
        documents(take: 0) {
          items {
            id
          }
          nextCursor
        }
      }
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();
    expect(result.data.documents.items.length).toBeGreaterThanOrEqual(1);
  });
});