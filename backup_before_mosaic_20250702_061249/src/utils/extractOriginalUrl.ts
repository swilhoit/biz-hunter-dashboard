export function extractOriginalUrl(description: string | null): string | null {
  if (!description) return null;
  
  // Look for the original listing URL in the description
  const urlMatch = description.match(/🔗 Original listing: (https?:\/\/[^\s\n]+)/);
  return urlMatch ? urlMatch[1] : null;
}