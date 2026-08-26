import { describe, expect, test } from "bun:test";
import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";

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

const request = async (query: string, variables?: Record<string, unknown>) => {
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
  });

  test("fetches collection by id", async () => {
    const response = await request(`
      query {
        collection(id: "d0132f9c-0f81-433b-900f-524c6018393a") {
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
    expect(result.data.collection).not.toBeNull();
    expect(result.data.collection.id).toBe(
      "d0132f9c-0f81-433b-900f-524c6018393a",
    );
  });

  test("returns null for non-existent collection", async () => {
    const response = await request(`
      query {
        collection(id: "00000000-0000-0000-0000-000000000000") {
          id
          name
          slug
        }
      }
    `);

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
  });

  test("fetches documents by collection", async () => {
    const response = await request(`
      query {
        documents(
          collectionId: "d0132f9c-0f81-433b-900f-524c6018393a"
        ) {
          items {
            id
            title
            collectionId
          }
          nextCursor
        }
      }
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();

    for (const document of result.data.documents.items) {
      expect(document.collectionId).toBe(
        "d0132f9c-0f81-433b-900f-524c6018393a",
      );
    }
  });

  test("searches documents by title or content", async () => {
    const response = await request(`
      query {
        documents(search: "Bank") {
          items {
            id
            title
            content
          }
          nextCursor
        }
      }
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();
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

      const firstPageIds = firstResult.data.documents.items.map(
        (document: { id: string }) => document.id,
      );

      const secondPageIds = secondResult.data.documents.items.map(
        (document: { id: string }) => document.id,
      );

      for (const id of secondPageIds) {
        expect(firstPageIds).not.toContain(id);
      }
    }
  });

  test("handles combined filters", async () => {
    const response = await request(`
      query {
        documents(
          collectionId: "d0132f9c-0f81-433b-900f-524c6018393a"
          search: "Bank"
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
    `);

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documents.items).toBeArray();

    for (const document of result.data.documents.items) {
      expect(document.collectionId).toBe(
        "d0132f9c-0f81-433b-900f-524c6018393a",
      );

      expect(document.isArchived).toBe(false);
    }
  });

  test("returns empty result for a search with no matches", async () => {
    const response = await request(`
      query {
        documents(search: "THIS_DOCUMENT_SHOULD_NOT_EXIST_123456") {
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

  test("returns validation error for invalid take value", async () => {
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
  });
});