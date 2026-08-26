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

  async getDocuments({
    collectionId,
    search,
    isArchived,
    take = 10,
    cursor,
  }: {
    collectionId?: string | null;
    search?: string | null;
    isArchived?: boolean | null;
    take?: number | null;
    cursor?: string | null;
  }) {
    const where = {
      ...(collectionId
        ? {
            collectionId,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                content: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),

      ...(isArchived !== undefined && isArchived !== null
        ? {
            isArchived,
          }
        : {}),
    };

    const limit = Math.min(Math.max(take ?? 10, 1), 50);

    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1,
          }
        : {}),
    });

    const hasNextPage = documents.length > limit;

    const items = hasNextPage
      ? documents.slice(0, limit)
      : documents;

    const nextCursor = hasNextPage
      ? items[items.length - 1]?.id ?? null
      : null;

    return {
      items,
      nextCursor,
    };
  },

  async updateDocument(
    id: string,
    title?: string | null,
    content?: string | null,
    tags?: string[] | null,
    isArchived?: boolean | null,
  ) {
    const existingDocument = await prisma.document.findUnique({
      where: {
        id,
      },
    });

    if (!existingDocument) {
      throw new Error("Document not found");
    }

    if (title !== undefined && title !== null) {
      validateRequiredText(title, "Document title");
    }

    if (content !== undefined && content !== null) {
      validateRequiredText(content, "Document content");
    }

    const data: {
      title?: string;
      content?: string;
      tags?: string[];
      isArchived?: boolean;
    } = {};

    if (title !== undefined && title !== null) {
      data.title = title.trim();
    }

    if (content !== undefined && content !== null) {
      data.content = content.trim();
    }

    if (tags !== undefined && tags !== null) {
      data.tags = tags;
    }

    if (isArchived !== undefined && isArchived !== null) {
      data.isArchived = isArchived;
    }

    return prisma.document.update({
      where: {
        id,
      },
      data,
    });
  },

  async deleteDocument(id: string) {
    const existingDocument = await prisma.document.findUnique({
      where: {
        id,
      },
    });

    if (!existingDocument) {
      throw new Error("Document not found");
    }

    await prisma.document.delete({
      where: {
        id,
      },
    });

    return true;
  },

  async moveDocument(
    id: string,
    collectionId: string,
  ) {
    const document = await prisma.document.findUnique({
      where: {
        id,
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
    });

    if (!collection) {
      throw new Error("Collection not found");
    }

    return prisma.document.update({
      where: {
        id,
      },
      data: {
        collectionId,
      },
    });
  },
};

