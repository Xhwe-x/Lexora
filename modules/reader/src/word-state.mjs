export const WORD_STATES = ['new', 'learning', 'known'];

export function nextWordState(current = 'new') {
  const index = WORD_STATES.indexOf(current);
  return WORD_STATES[(index + 1 + WORD_STATES.length) % WORD_STATES.length];
}

export function setWordState(dictionary, word, state) {
  if (!WORD_STATES.includes(state)) throw new Error(`Unknown word state: ${state}`);
  return { ...dictionary, [String(word).toLowerCase()]: state };
}

export function getWordState(dictionary, word) {
  return dictionary?.[String(word).toLowerCase()] ?? 'new';
}
