/**
 * Filename sanitizer utility for Web2MD Mobile & Extension
 * Ensures filenames are compliant with Android, iOS, Windows, macOS, and Linux filesystem constraints.
 */
export function sanitizeFilename(title: string, fallback = 'web2md_export'): string {
  if (!title || typeof title !== 'string') {
    return `${fallback}.md`;
  }

  // 1. Remove invalid characters
  let clean = title
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Control characters
    .replace(/[\\/:*?"<>|]/g, '-')        // Forbidden characters
    .replace(/[\r\n\t]/g, ' ')            // Line breaks & tabs
    .trim();

  // 2. Replace multiple spaces or hyphens with a single hyphen
  clean = clean
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, ''); // Trim leading/trailing separators

  // 3. Check for reserved names
  const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  if (reservedNames.test(clean)) {
    clean = `${clean}_doc`;
  }

  // 4. Truncate to maximum safe length (120 chars)
  if (clean.length > 120) {
    clean = clean.substring(0, 120).replace(/-+$/, '');
  }

  // Fallback if title becomes empty
  if (!clean) {
    clean = fallback;
  }

  // Append .md extension if not already present
  if (!clean.toLowerCase().endsWith('.md')) {
    clean += '.md';
  }

  return clean;
}
