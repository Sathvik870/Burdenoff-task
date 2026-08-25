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
  },
};