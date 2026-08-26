export function speakEnglish(text, options = {}) {
  const synth = globalThis.speechSynthesis;
  const Utterance = globalThis.SpeechSynthesisUtterance;
  if (!synth || !Utterance) return { ok: false, reason: 'speech-synthesis-unavailable' };

  synth.cancel();
  const utterance = new Utterance(String(text));
  utterance.lang = options.lang ?? 'en-US';
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;
  synth.speak(utterance);
  return { ok: true };
}
