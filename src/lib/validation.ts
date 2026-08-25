export function validateRequiredText(
  value: string,
  fieldName: string,
): void {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
}

export function validateSlug(slug: string): void {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (!slugPattern.test(slug)) {
    throw new Error(
      "Slug must contain only lowercase letters, numbers, and single hyphens",
    );
  }
}