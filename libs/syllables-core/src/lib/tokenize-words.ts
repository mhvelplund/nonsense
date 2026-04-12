export function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}
