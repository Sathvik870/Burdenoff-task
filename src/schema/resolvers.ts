import { collectionService } from "../services/collection.service";
import { documentService } from "../services/document.service";

export const resolvers = {
  Query: {
    collections: () => {
      return collectionService.getCollections();
    },

    collection: (
      _: unknown,
      args: { id: string },
    ) => {
      return collectionService.getCollectionById(args.id);
    },

    documents: (
      _: unknown,
      args: {
        collectionId?: string | null;
        search?: string | null;
        isArchived?: boolean | null;
        take?: number | null;
        cursor?: string | null;
      },
    ) => {
      return documentService.getDocuments(args);
    },
  },

  Collection: {
    createdAt: (collection: { createdAt: Date }) => {
      return collection.createdAt.toISOString();
    },

    documents: async (collection: { id: string }) => {
      return documentService.getDocumentsByCollectionId(collection.id);
    },
  },

  Document: {
    createdAt: (document: { createdAt: Date }) => {
      return document.createdAt.toISOString();
    },
  },

  Mutation: {
    createCollection: (
      _: unknown,
      args: {
        name: string;
        slug: string;
      },
    ) => {
      return collectionService.createCollection(
        args.name,
        args.slug,
      );
    },

    createDocument: (
      _: unknown,
      args: {
        title: string;
        content: string;
        tags?: string[] | null;
        collectionId: string;
      },
    ) => {
      return documentService.createDocument(
        args.title,
        args.content,
        args.tags,
        args.collectionId,
      );
    },

    updateDocument: (
      _: unknown,
      args: {
        id: string;
        title?: string | null;
        content?: string | null;
        tags?: string[] | null;
        isArchived?: boolean | null;
      },
    ) => {
      return documentService.updateDocument(
        args.id,
        args.title,
        args.content,
        args.tags,
        args.isArchived,
      );
    },

    deleteDocument: (
      _: unknown,
      args: { id: string },
    ) => {
      return documentService.deleteDocument(args.id);
    },

    moveDocument: (
      _: unknown,
      args: {
        id: string;
        collectionId: string;
      },
    ) => {
      return documentService.moveDocument(
        args.id,
        args.collectionId,
      );
    },
  },
};