import { splitSentences } from './tokenizer.mjs';

export function createCloze(sentence, targetWord, distractors = []) {
  const target = String(targetWord ?? '').trim();
  if (!target) throw new Error('targetWord is required');
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
  if (!pattern.test(sentence)) throw new Error('targetWord is not present in sentence');
  const prompt = sentence.replace(pattern, '_____');
  const options = [...new Set([target, ...distractors].filter(Boolean))];
  return { sentence, target, prompt, options };
}

export function createClozeFromText(text, targetWord, distractors = []) {
  const sentence = splitSentences(text).find(item => new RegExp(`\\b${escapeRegExp(targetWord)}\\b`, 'i').test(item));
  if (!sentence) return null;
  return createCloze(sentence, targetWord, distractors);
}

export function checkCloze(cloze, answer) {
  return String(answer ?? '').trim().toLowerCase() === cloze.target.toLowerCase();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
