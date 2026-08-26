import { mock } from "bun:test";

import { createResolvers } from "../src/schema/resolvers";

const getCollections = mock(() =>
  Promise.resolve([
    {
      id: "collection-1",
      name: "Test Collection",
      slug: "test-collection",
      createdAt: new Date(),
    },
  ]),
);

const getCollectionById = mock((id: string) =>
  Promise.resolve({
    id,
    name: "Test Collection",
    slug: "test-collection",
    createdAt: new Date(),
  }),
);

const getDocuments = mock((args: unknown) =>
  Promise.resolve({
    items: [],
    nextCursor: null,
    args,
  }),
);

const createCollection = mock((name: string, slug: string) =>
  Promise.resolve({
    id: "collection-created",
    name,
    slug,
    createdAt: new Date(),
  }),
);

const createDocument = mock((
  title: string,
  content: string,
  tags: string[] | null | undefined,
  collectionId: string,
) =>
  Promise.resolve({
    id: "document-created",
    title,
    content,
    tags: tags ?? [],
    collectionId,
    isArchived: false,
    createdAt: new Date(),
  }),
);

const updateDocument = mock((
  id: string,
  title?: string | null,
  content?: string | null,
  tags?: string[] | null,
  isArchived?: boolean | null,
) =>
  Promise.resolve({
    id,
    title: title ?? "Updated title",
    content: content ?? "Updated content",
    tags: tags ?? [],
    collectionId: "collection-1",
    isArchived: isArchived ?? false,
    createdAt: new Date(),
  }),
);

const deleteDocument = mock((id: string) =>
  Promise.resolve(id === "document-1"),
);

const moveDocument = mock((
  id: string,
  collectionId: string,
) =>
  Promise.resolve({
    id,
    title: "Test Document",
    content: "Test content",
    tags: [],
    collectionId,
    isArchived: false,
    createdAt: new Date(),
  }),
);

const mockServices = {
  collectionService: {
    getCollections,
    getCollectionById,
    createCollection,
  },

  documentService: {
    getDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    moveDocument,
    getDocumentsByCollectionId: mock(() =>
      Promise.resolve([]),
    ),
  },
};

const resolvers = createResolvers(mockServices);