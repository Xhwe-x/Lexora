export function checkGrammarAnswer(question, answer) {
  const normalized = normalize(answer);
  const accepted = [question.answer, ...(question.accept ?? [])].map(normalize);
  return { correct: accepted.includes(normalized), expected: question.answer, actual: String(answer ?? '').trim() };
}

export function getGrammarQuestion(lesson, index = 0) {
  return lesson?.questions?.[index % lesson.questions.length] ?? null;
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');
}
