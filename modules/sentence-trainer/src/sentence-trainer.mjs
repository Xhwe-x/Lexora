const punctuationPattern = /[.,!?;:'“”‘’()\[\]{}…—-]/g;

export function normalizeEnglish(text, { ignoreCase = true, ignorePunctuation = true } = {}) {
  let value = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (ignorePunctuation) value = value.replace(punctuationPattern, '').replace(/\s+/g, ' ').trim();
  if (ignoreCase) value = value.toLowerCase();
  return value;
}

export function tokenizeSentence(text) {
  return normalizeEnglish(text).split(' ').filter(Boolean);
}

export function evaluateSentence(input, expected) {
  const actualText = normalizeEnglish(input);
  const expectedText = normalizeEnglish(expected);
  const actual = actualText.split(' ').filter(Boolean);
  const target = expectedText.split(' ').filter(Boolean);
  const length = Math.max(actual.length, target.length);
  const tokens = Array.from({ length }, (_, index) => ({
    index,
    expected: target[index] ?? '',
    actual: actual[index] ?? '',
    correct: actual[index] === target[index]
  }));
  return {
    correct: actualText === expectedText,
    actual: actualText,
    expected: expectedText,
    tokens,
    firstMismatch: tokens.find(item => !item.correct)?.index ?? -1
  };
}

export function buildHint(expected, revealCount = 1) {
  const words = String(expected).trim().split(/\s+/).filter(Boolean);
  const count = Math.max(0, Math.min(words.length, revealCount));
  return words.map((word, index) => index < count ? word : maskWord(word)).join(' ');
}

function maskWord(word) {
  const clean = word.replace(/[^A-Za-z']/g, '');
  if (!clean) return word;
  if (clean.length <= 2) return `${clean[0]}${'_'.repeat(Math.max(0, clean.length - 1))}`;
  return `${clean[0]}${'_'.repeat(clean.length - 1)}`;
}

export class SentenceSession {
  constructor(lessons = []) {
    this.lessons = lessons;
    this.index = 0;
    this.streak = 0;
    this.totalCorrect = 0;
    this.attempts = 0;
    this.hintLevel = 0;
  }

  get current() {
    return this.lessons[this.index] ?? null;
  }

  submit(input) {
    if (!this.current) return { correct: false, finished: true };
    this.attempts += 1;
    const evaluation = evaluateSentence(input, this.current.answer);
    if (evaluation.correct) {
      this.streak += 1;
      this.totalCorrect += 1;
    } else {
      this.streak = 0;
    }
    return { ...evaluation, streak: this.streak, lesson: this.current };
  }

  hint() {
    if (!this.current) return '';
    this.hintLevel += 1;
    return buildHint(this.current.answer, this.hintLevel);
  }

  next() {
    if (!this.lessons.length) return null;
    this.index = (this.index + 1) % this.lessons.length;
    this.hintLevel = 0;
    return this.current;
  }
}
