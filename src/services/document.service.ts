import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger"
import { AppError } from "../errors/app-error";
import { validateRequiredText } from "../lib/validation";

export const documentService = {

  async createDocument(
    title: string,
    content: string,
    tags: string[] | null | undefined,
    collectionId: string,
  ) {
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();
    const normalizedTags = tags ?? [];

    logger.info("Creating document", {
      collectionId,
    });

    const titleValidation = validateRequiredText(
      normalizedTitle,
      "Document title",
    );

    if (!titleValidation.success) {
      logger.warn("Document creation rejected", {
        reason: titleValidation.error.message,
      });

      throw titleValidation.error;
    }

    const contentValidation = validateRequiredText(
      normalizedContent,
      "Document content",
    );

    if (!contentValidation.success) {
      logger.warn("Document creation rejected", {
        reason: contentValidation.error.message,
      });

      throw contentValidation.error;
    }

    try {
      const collection = await prisma.collection.findUnique({
        where: {
          id: collectionId,
        },
      });

      if (!collection) {
        logger.warn("Document creation rejected", {
          reason: "Collection not found",
          collectionId,
        });

        throw new AppError(
          "NOT_FOUND",
          "Collection not found",
          404,
        );
      }

      const document = await prisma.document.create({
        data: {
          title: titleValidation.data,
          content: contentValidation.data,
          tags: normalizedTags,
          collectionId,
        },
      });

      logger.info("Document created", {
        documentId: document.id,
        collectionId,
      });

      return document;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error("Database operation failed", {
        operation: "createDocument",
        collectionId,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });

      throw new AppError(
        "DATABASE_ERROR",
        "Database error while creating document",
        503,
      );
    }
  },


  async getDocumentsByCollectionId(collectionId: string) {
    logger.info("Fetching documents", {
      collectionId,
    });

    try {
      const documents = await prisma.document.findMany({
        where: {
          collectionId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      logger.info("Documents fetched", {
        collectionId,
        count: documents.length,
      });

      return documents;
    } catch (error: unknown) {
      logger.error("Database operation failed", {
        operation: "getDocumentsByCollectionId",
        collectionId,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });

      throw new AppError(
        "DATABASE_ERROR",
        "Database error while fetching documents",
        503,
      );
    }
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
    logger.info("Fetching documents", {
      collectionId,
      search,
      isArchived,
      take,
      cursor,
    });

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

    const limit = Math.min(
      Math.max(take ?? 10, 1),
      50,
    );

    try {
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

      logger.info("Documents fetched", {
        count: items.length,
        hasNextPage,
        collectionId,
      });

      return {
        items,
        nextCursor,
      };
    } catch (error: unknown) {
      logger.error("Database operation failed", {
        operation: "getDocuments",
        collectionId,
        search,
        isArchived,
        take: limit,
        cursor,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });

      throw new AppError(
        "DATABASE_ERROR",
        "Database error while fetching documents",
        503,
      );
    }
  },

  async updateDocument(
    id: string,
    title?: string | null,
    content?: string | null,
    tags?: string[] | null,
    isArchived?: boolean | null,
  ) {
    logger.info("Updating document", {
      documentId: id,
    });

    if (
      title === undefined &&
      content === undefined &&
      tags === undefined &&
      isArchived === undefined
    ) {
      logger.warn("Document update rejected", {
        reason: "No fields provided for update",
        documentId: id,
      });

      throw new AppError(
        "VALIDATION_ERROR",
        "At least one field is required to update the document",
        400,
      );
    }

    try {
      const existingDocument = await prisma.document.findUnique({
        where: {
          id,
        },
      });

      if (!existingDocument) {
        logger.warn("Document update rejected", {
          reason: "Document not found",
          documentId: id,
        });

        throw new AppError(
          "NOT_FOUND",
          "Document not found",
          404,
        );
      }

      const data: {
        title?: string;
        content?: string;
        tags?: string[];
        isArchived?: boolean;
      } = {};

      if (title !== undefined && title !== null) {
        const titleValidation = validateRequiredText(
          title,
          "Document title",
        );

        if (!titleValidation.success) {
          logger.warn("Document update rejected", {
            reason: titleValidation.error.message,
            documentId: id,
          });

          throw titleValidation.error;
        }

        data.title = titleValidation.data;
      }

      if (content !== undefined && content !== null) {
        const contentValidation = validateRequiredText(
          content,
          "Document content",
        );

        if (!contentValidation.success) {
          logger.warn("Document update rejected", {
            reason: contentValidation.error.message,
            documentId: id,
          });

          throw contentValidation.error;
        }

        data.content = contentValidation.data;
      }

      if (tags !== undefined && tags !== null) {
        data.tags = tags;
      }

      if (isArchived !== undefined && isArchived !== null) {
        data.isArchived = isArchived;
      }

      const document = await prisma.document.update({
        where: {
          id,
        },
        data,
      });

      logger.info("Document updated", {
        documentId: document.id,
      });

      return document;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error("Database operation failed", {
        operation: "updateDocument",
        documentId: id,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });
      throw new AppError(
        "DATABASE_ERROR",
        "Database error while updating document",
        503,
      );
    }
  },

  async deleteDocument(id: string) {
    logger.info("Deleting document", {
      documentId: id,
    });

    try {
      const existingDocument = await prisma.document.findUnique({
        where: {
          id,
        },
      });

      if (!existingDocument) {
        logger.warn("Document deletion rejected", {
          reason: "Document not found",
          documentId: id,
        });

        throw new AppError(
          "NOT_FOUND",
          "Document not found",
          404,
        );
      }

      await prisma.document.delete({
        where: {
          id,
        },
      });

      logger.info("Document deleted", {
        documentId: id,
      });

      return true;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error("Database operation failed", {
        operation: "deleteDocument",
        documentId: id,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });

      throw new AppError(
        "DATABASE_ERROR",
        "Database error while deleting document",
        503,
      );
    }
  },

  async moveDocument(
    id: string,
    collectionId: string,
  ) {
    logger.info("Moving document", {
      documentId: id,
      targetCollectionId: collectionId,
    });

    try {
      const document = await prisma.document.findUnique({
        where: {
          id,
        },
      });

      if (!document) {
        logger.warn("Document move rejected", {
          reason: "Document not found",
          documentId: id,
        });

        throw new AppError(
          "NOT_FOUND",
          "Document not found",
          404,
        );
      }

      const collection = await prisma.collection.findUnique({
        where: {
          id: collectionId,
        },
      });

      if (!collection) {
        logger.warn("Document move rejected", {
          reason: "Collection not found",
          collectionId,
        });

        throw new AppError(
          "NOT_FOUND",
          "Collection not found",
          404,
        );
      }

      if (document.collectionId === collectionId) {
        logger.warn("Document move rejected", {
          reason: "Document already in collection",
          documentId: id,
          collectionId,
        });

        throw new AppError(
          "VALIDATION_ERROR",
          "Document is already in this collection",
          400,
        );
      }

      const updatedDocument = await prisma.document.update({
        where: {
          id,
        },
        data: {
          collectionId,
        },
      });

      logger.info("Document moved", {
        documentId: id,
        fromCollectionId: document.collectionId,
        toCollectionId: collectionId,
      });

      return updatedDocument;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error("Database operation failed", {
        operation: "moveDocument",
        documentId: id,
        targetCollectionId: collectionId,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });

      throw new AppError(
        "DATABASE_ERROR",
        "Database error while moving document",
        503,
      );
    }
  },
};

