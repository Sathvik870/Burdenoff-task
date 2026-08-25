import { prisma } from "../lib/prisma";
import { validateRequiredText } from "../lib/validation";

export const documentService = {
  
  async createDocument(
    title: string,
    content: string,
    tags: string[] | null | undefined,
    collectionId: string,
    ) {
      validateRequiredText(title, "Document title");
      validateRequiredText(content, "Document content");

      const collection = await prisma.collection.findUnique({
        where: {
          id: collectionId,
        },
      });

      if (!collection) {
        throw new Error("Collection not found");
      }

      return prisma.document.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          tags: tags ?? [],
          collectionId,
        },
      });
    },


  async getDocumentsByCollectionId(collectionId: string) {
    return prisma.document.findMany({
      where: {
        collectionId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};

