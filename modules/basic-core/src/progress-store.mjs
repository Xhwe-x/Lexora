import { JsonStore } from '../../shared/src/storage.mjs';

export class LearningProgress {
  constructor(store = new JsonStore()) {
    this.store = store;
  }

  getAll() {
    return this.store.get('progress', { words: {}, grammar: {}, stats: { xp: 0, streak: 0 } });
  }

  updateWord(id, patch) {
    return this.store.update('progress', this.getAll(), progress => ({
      ...progress,
      words: {
        ...progress.words,
        [id]: { ...(progress.words[id] ?? {}), ...patch }
      }
    }));
  }

  updateGrammar(id, patch) {
    return this.store.update('progress', this.getAll(), progress => ({
      ...progress,
      grammar: {
        ...progress.grammar,
        [id]: { ...(progress.grammar[id] ?? {}), ...patch }
      }
    }));
  }

  addXp(amount = 1) {
    return this.store.update('progress', this.getAll(), progress => ({
      ...progress,
      stats: { ...progress.stats, xp: (progress.stats?.xp ?? 0) + amount }
    }));
  }
}
