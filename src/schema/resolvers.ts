import { prisma } from "../lib/prisma";
import { validateRequiredText, validateSlug } from "../lib/validation"
export const resolvers = {
    
  //query
  Query: {
    collections: async () => {
      return prisma.collection.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    collection: async (
      _: unknown,
      args: { id: string },
    ) => {
      return prisma.collection.findUnique({
        where: {
          id: args.id,
        },
      });
    },
  },

  //collections
  Collection: {
    createdAt: (collection: { createdAt: Date }) => {
      return collection.createdAt.toISOString();
    },

    documents: async (collection: { id: string }) => {
      return prisma.document.findMany({
        where: {
          collectionId: collection.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
  },
  
  //mutations
  Mutation: {
    createCollection: async (
        _: unknown,
        args: {
        name: string;
        slug: string;
        },
    ) => {
        validateRequiredText(args.name, "Collection name");
        validateSlug(args.slug);

        return prisma.collection.create({
        data: {
            name: args.name.trim(),
            slug: args.slug,
        },
        });
    },
    },
};