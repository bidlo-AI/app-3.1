// Convert a Unicode emoji string to a Twemoji PNG URL (72x72 assets)
// Keep small and dependency-free; callers can cache results locally.
export function toTwemojiUrl(emoji: string): string {
  // Convert each code point to hex and join with hyphen, lowercased
  const hex = Array.from(emoji)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-')
    .toLowerCase();
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/${hex}.png`;
}
