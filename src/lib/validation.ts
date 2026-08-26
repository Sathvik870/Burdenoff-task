import { AppError } from "../errors/app-error";
import type { Result } from "../types/result";

export const validateRequiredText = (
  value: string,
  fieldName: string,
): Result<string> => {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return {
      success: false,
      error: new AppError(
        "VALIDATION_ERROR",
        `${fieldName} cannot be empty`,
        400,
      ),
    };
  }

  return {
    success: true,
    data: normalizedValue,
  };
};

export const validateSlug = (
  slug: string,
): Result<string> => {
  const normalizedSlug = slug.trim();

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (!slugPattern.test(normalizedSlug)) {
    return {
      success: false,
      error: new AppError(
        "VALIDATION_ERROR",
        "Slug must contain only lowercase letters, numbers, and hyphens",
        400,
      ),
    };
  }

  return {
    success: true,
    data: normalizedSlug,
  };
};