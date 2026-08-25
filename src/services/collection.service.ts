import { prisma } from "../lib/prisma";
import {
  validateRequiredText,
  validateSlug,
} from "../lib/validation";

export const collectionService = {
  async getCollections() {
    return prisma.collection.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async getCollectionById(id: string) {
    return prisma.collection.findUnique({
      where: {
        id,
      },
    });
  },

  async createCollection(name: string, slug: string) {
    validateRequiredText(name, "Collection name");
    validateSlug(slug);

    return prisma.collection.create({
      data: {
        name: name.trim(),
        slug,
      },
    });
  },
};