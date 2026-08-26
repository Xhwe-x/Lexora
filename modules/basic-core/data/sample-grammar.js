export const sampleGrammar = [
  {
    id: 'be-present',
    title: 'be 动词：am / is / are',
    level: 'A1',
    summary: 'I 用 am；he/she/it 用 is；you/we/they 用 are。',
    examples: ['I am ready.', 'She is happy.', 'They are students.'],
    questions: [
      { prompt: 'I ___ ready.', answer: 'am' },
      { prompt: 'She ___ happy.', answer: 'is' },
      { prompt: 'They ___ students.', answer: 'are' }
    ]
  },
  {
    id: 'simple-present',
    title: '一般现在时',
    level: 'A1',
    summary: '表达习惯或事实；第三人称单数通常在动词后加 -s / -es。',
    examples: ['I study every day.', 'He reads at night.'],
    questions: [
      { prompt: 'He ___ English every day. (study)', answer: 'studies' },
      { prompt: 'I ___ books at night. (read)', answer: 'read' }
    ]
  },
  {
    id: 'because-so',
    title: 'because 与 so',
    level: 'A2',
    summary: 'because 引出原因；so 引出结果。',
    examples: ['I stayed home because it rained.', 'It rained, so I stayed home.'],
    questions: [
      { prompt: 'I was tired, ___ I went to bed early.', answer: 'so' },
      { prompt: 'I went to bed early ___ I was tired.', answer: 'because' }
    ]
  }
];
