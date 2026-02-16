// Override API editorial names where needed
const NAME_OVERRIDES: Record<string, string> = {
  'Real': 'R. Madrid',
}

export function displayName(editorialName: string): string {
  return NAME_OVERRIDES[editorialName] || editorialName
}
