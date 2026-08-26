export class JsonStore {
  constructor(namespace = 'free-english', storage = globalThis.localStorage) {
    this.namespace = namespace;
    this.storage = storage ?? createMemoryStorage();
  }

  key(name) {
    return `${this.namespace}:${name}`;
  }

  get(name, fallback = null) {
    const raw = this.storage.getItem(this.key(name));
    if (raw == null) return structuredCloneSafe(fallback);
    try {
      return JSON.parse(raw);
    } catch {
      return structuredCloneSafe(fallback);
    }
  }

  set(name, value) {
    this.storage.setItem(this.key(name), JSON.stringify(value));
    return value;
  }

  update(name, fallback, updater) {
    const next = updater(this.get(name, fallback));
    return this.set(name, next);
  }

  remove(name) {
    this.storage.removeItem(this.key(name));
  }
}

export function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    clear() { data.clear(); }
  };
}

function structuredCloneSafe(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
