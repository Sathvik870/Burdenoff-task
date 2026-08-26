import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import {
  validateRequiredText,
  validateSlug,
} from "../lib/validation";
import { AppError } from "../errors/app-error";

const isPrismaUniqueConstraintError = (
  error: unknown,
): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
};


export const collectionService = {

    async getCollections() {
    logger.info("Fetching collections");

    try {
      const collections = await prisma.collection.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      logger.info("Collections fetched", {
        count: collections.length,
      });

      return collections;
    } catch (error: unknown) {
      logger.error("Database operation failed", {
        operation: "getCollections",
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });

      throw new AppError(
        "DATABASE_ERROR",
        "Database error while fetching collections",
        503,
      );
    }
  },

  async getCollectionById(id: string) {
    logger.info("Fetching collection", {
      collectionId: id,
    });

    try {
      const collection = await prisma.collection.findUnique({
        where: {
          id,
        },
      });

      if (!collection) {
        logger.warn("Collection not found", {
          collectionId: id,
        });

        return null;
      }

      logger.info("Collection fetched", {
        collectionId: collection.id,
      });

      return collection;
    } catch (error: unknown) {
      logger.error("Database operation failed", {
        operation: "getCollectionById",
        collectionId: id,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });

      throw new AppError(
        "DATABASE_ERROR",
        "Database error while fetching collection",
        503,
      );
    }
  },

  async createCollection(
    name: string,
    slug: string,
  ) {
    const normalizedName = name.trim();
    const normalizedSlug = slug.trim();

    logger.info("Creating collection", {
      slug: normalizedSlug,
    });

    const nameValidation = validateRequiredText(
      normalizedName,
      "Collection name",
    );

    if (!nameValidation.success) {
      logger.warn("Collection creation rejected", {
        message: nameValidation.error.message,
      });

      throw nameValidation.error;
    }

    const slugValidation = validateSlug(
      normalizedSlug,
    );

    if (!slugValidation.success) {
      logger.warn("Collection creation rejected", {
        message: slugValidation.error.message,
      });

      throw slugValidation.error;
    }

    try {
      const collection = await prisma.collection.create({
        data: {
          name: nameValidation.data,
          slug: slugValidation.data,
        },
      });

      logger.info("Collection created", {
        collectionId: collection.id,
      });

      return collection;
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        logger.warn("Collection creation rejected", {
          reason: "DUPLICATE_RESOURCE",
          slug: normalizedSlug,
        });

        throw new AppError(
          "DUPLICATE_RESOURCE",
          "A collection with this slug already exists",
          409,
        );
      }

      logger.error("Database operation failed", {
        operation: "createCollection",
        slug: normalizedSlug,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      });

      throw new AppError(
        "DATABASE_ERROR",
        "Database error while creating collection",
        503,
      );
    }
  },
};