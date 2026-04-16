/**
 * Converts a title string to a URL-safe kebab-case slug.
 * Handles special characters and Hindi/Devanagari text gracefully.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    // Normalize unicode (e.g. accented chars → base chars where possible)
    .normalize("NFKD")
    // Remove Devanagari and other non-ASCII scripts that don't transliterate
    .replace(/[^\x00-\x7F]/g, "")
    // Replace any non-alphanumeric character (except hyphens) with a space
    .replace(/[^a-z0-9\s-]/g, " ")
    // Collapse whitespace and hyphens into a single hyphen
    .trim()
    .replace(/[\s-]+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a unique slug for a given title.
 * If the derived slug already exists in `existingSlugs`, appends a `-<timestamp>` suffix.
 */
export function generateUniqueSlug(
  title: string,
  existingSlugs: string[]
): string {
  const base = slugify(title);
  if (!existingSlugs.includes(base)) {
    return base;
  }
  return `${base}-${Date.now()}`;
}
