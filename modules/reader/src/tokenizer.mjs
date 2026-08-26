export function tokenizeText(text) {
  const source = String(text ?? '');
  const tokens = [];
  const pattern = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(source))) {
    if (match.index > lastIndex) tokens.push({ type: 'text', value: source.slice(lastIndex, match.index) });
    tokens.push({ type: 'word', value: match[0], normalized: match[0].toLowerCase() });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < source.length) tokens.push({ type: 'text', value: source.slice(lastIndex) });
  return tokens;
}

export function splitSentences(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(item => item.trim()).filter(Boolean) ?? [];
}

export function wordFrequency(text) {
  const counts = new Map();
  for (const token of tokenizeText(text)) {
    if (token.type !== 'word') continue;
    counts.set(token.normalized, (counts.get(token.normalized) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([word, count]) => ({ word, count }));
}
