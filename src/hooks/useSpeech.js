import { useCallback, useEffect, useRef, useState } from 'react';

const restoreLetters = () => {
  document.querySelectorAll('.letter').forEach(letter => {
    letter.style.opacity = '1';
    letter.style.cursor = 'pointer';
  });
};

const normalizeLanguage = language => language.toLowerCase().replaceAll('_', '-');

const selectVoice = (voices, language) => {
  const locale = normalizeLanguage(language);
  const baseLanguage = locale.split('-')[0];
  const exactVoices = voices.filter(voice => normalizeLanguage(voice.lang) === locale);
  const candidates = exactVoices.length ? exactVoices : voices.filter(
    voice => normalizeLanguage(voice.lang).split('-')[0] === baseLanguage,
  );

  // Preserve the preference for youthful English voices within the matching locale.
  if (baseLanguage === 'en') {
    const preferred = candidates.find(voice =>
      /child|kid|boy|junior|young|female/i.test(voice.name),
    );
    if (preferred) return preferred;
  }
  return candidates[0];
};

export default function useSpeech(options = {}) {
  const activeUtterance = useRef(null);
  const synth = typeof window === 'undefined' ? undefined : window.speechSynthesis;
  const { language = 'en-US', pitch = 1.35, rate = 1.08, letterRate = 0.95, requireMatchingVoice = false } = options;
  const [voices, setVoices] = useState(() => synth?.getVoices() ?? []);

  useEffect(() => {
    if (!synth) return undefined;
    const loadVoices = () => setVoices(synth.getVoices());
    synth.addEventListener('voiceschanged', loadVoices);
    loadVoices();
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, [synth]);

  const selectedVoice = selectVoice(voices, language);

  const stopSpeech = useCallback(() => {
    // Ignore delayed events from an utterance that has already been cancelled.
    activeUtterance.current = null;
    synth?.cancel();
    restoreLetters();
  }, [synth]);

  useEffect(() => () => stopSpeech(), [stopSpeech, language]);

  const playSound = (item, isLetter = false, force = false) => {
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    if (force) stopSpeech();
    else if (activeUtterance.current) return;

    // A language hint alone can fall back to an English system voice.
    const voice = selectVoice(synth.getVoices(), language);
    if (requireMatchingVoice && !voice) return;

    let textToSpeak = item;
    if (isLetter && normalizeLanguage(language).split('-')[0] === 'en') {
      if (item.toLowerCase() === 'z') textToSpeak = 'zi';
      else if (item.toLowerCase() === 'y') textToSpeak = 'why';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voice?.lang ?? language;
    utterance.volume = 1;
    utterance.rate = isLetter ? letterRate : rate;
    utterance.pitch = pitch;

    // Read the current list each time: browsers may load voices asynchronously.
    if (voice) utterance.voice = voice;

    const finish = () => {
      if (activeUtterance.current !== utterance) return;
      activeUtterance.current = null;
      restoreLetters();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    activeUtterance.current = utterance;

    try {
      document.querySelectorAll('.letter').forEach(letter => {
        letter.style.opacity = '0.6';
        letter.style.cursor = 'default';
      });
      document.querySelectorAll('[data-item]').forEach(element => {
        if (element.dataset.item === item) element.style.opacity = '1';
      });
      synth.speak(utterance);
    } catch (error) {
      console.error('Error playing sound:', error);
      finish();
    }
  };

  return { playSound, stopSpeech, selectedVoice, speechSupported: Boolean(synth) };
}
