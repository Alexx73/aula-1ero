import { useCallback, useEffect, useRef, useState } from 'react';

const SETTINGS_KEY = 'aula1ero-speech-settings';
const SETTINGS_EVENT = 'aula1ero-speech-settings-changed';
const DEFAULT_SETTINGS = { englishVoiceProfile: 'teen-girl', englishRate: 0.9 };
const VALID_PROFILES = ['teen-girl', 'male', 'female'];
const VALID_RATES = [1, 0.9, 0.8, 0.7];
const EFFECTIVE_RATES = { 1: 1, 0.9: 0.8, 0.8: 0.6, 0.7: 0.4 };

const restoreLetters = () => {
  document.querySelectorAll('.letter').forEach(letter => {
    letter.style.opacity = '1';
    letter.style.cursor = 'pointer';
  });
};

const normalizeLanguage = language => language.toLowerCase().replaceAll('_', '-');

const isEnglish = language => normalizeLanguage(language).split('-')[0] === 'en';

const normalizeSettings = settings => {
  const rate = Number(settings.englishRate);
  return {
    englishVoiceProfile: VALID_PROFILES.includes(settings.englishVoiceProfile)
      ? settings.englishVoiceProfile
      : DEFAULT_SETTINGS.englishVoiceProfile,
    englishRate: VALID_RATES.includes(rate) ? rate : DEFAULT_SETTINGS.englishRate,
  };
};

const readSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    return normalizeSettings(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}'));
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = settings => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
};

const voiceProfileScore = (voice, profile) => {
  const name = voice.name.toLowerCase();
  const female = /samantha|zira|jenny|ava|karen|moira|tessa|susan|google us english female|google uk english female|female|woman/.test(name);
  const male = /david|mark|daniel|george|alexander|guy|fred|rishi|male|man/.test(name);
  const youthful = /child|kid|girl|junior|young|teen/.test(name);

  if (profile === 'male') {
    return male ? 100 : female || youthful ? -30 : 0;
  }
  if (profile === 'female') {
    return female ? 100 : youthful ? 45 : male ? -30 : 0;
  }
  return youthful ? 100 : female ? 65 : male ? -30 : 0;
};

export const selectVoice = (voices, language, profile = 'teen-girl') => {
  const locale = normalizeLanguage(language);
  const baseLanguage = locale.split('-')[0];
  const exactVoices = voices.filter(voice => normalizeLanguage(voice.lang) === locale);
  const candidates = exactVoices.length ? exactVoices : voices.filter(
    voice => normalizeLanguage(voice.lang).split('-')[0] === baseLanguage,
  );

  if (baseLanguage === 'en') {
    const femaleVoice = candidates
      .map((voice, index) => ({ voice, score: voiceProfileScore(voice, profile), index }))
      .sort((a, b) => b.score - a.score || a.index - b.index)[0];
    if (femaleVoice) return femaleVoice.voice;
  }
  return candidates[0];
};

const profilePitch = profile => {
  if (profile === 'teen-girl') return 1.9;
  if (profile === 'male') return 0.75;
  return 1.2;
};

export default function useSpeech(options = {}) {
  const activeUtterance = useRef(null);
  const synth = typeof window === 'undefined' ? undefined : window.speechSynthesis;
  const { language = 'en-US', pitch = 1.45, rate = 0.9, letterRate = 0.85, requireMatchingVoice = false } = options;
  const [voices, setVoices] = useState(() => synth?.getVoices() ?? []);
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    if (!synth) return undefined;
    const loadVoices = () => setVoices(synth.getVoices());
    synth.addEventListener('voiceschanged', loadVoices);
    loadVoices();
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, [synth]);

  useEffect(() => {
    const loadSettings = () => {
      // All hook instances must forget a cancelled utterance together.
      activeUtterance.current = null;
      synth?.cancel();
      setSettings(readSettings());
    };
    window.addEventListener(SETTINGS_EVENT, loadSettings);
    return () => window.removeEventListener(SETTINGS_EVENT, loadSettings);
  }, [synth]);

  const selectedVoice = selectVoice(
    voices,
    language,
    isEnglish(language) ? settings.englishVoiceProfile : 'female',
  );

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
    const currentSettings = readSettings();
    const voice = selectVoice(
      synth.getVoices(),
      language,
      isEnglish(language) ? currentSettings.englishVoiceProfile : 'female',
    );
    if (requireMatchingVoice && !voice) return;

    let textToSpeak = item;
    if (isLetter && normalizeLanguage(language).split('-')[0] === 'en') {
      if (item.toLowerCase() === 'z') textToSpeak = 'zi';
      else if (item.toLowerCase() === 'y') textToSpeak = 'why';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voice?.lang ?? language;
    utterance.volume = 1;
    // Spread the selectable steps so the difference is audible on browser voices.
    const englishRate = EFFECTIVE_RATES[Number(currentSettings.englishRate)] ?? 0.8;
    utterance.rate = isEnglish(language)
      ? isLetter
        ? englishRate * (letterRate / 0.85)
        : englishRate
      : isLetter
        ? letterRate
        : rate;
    utterance.pitch = isEnglish(language)
      ? profilePitch(currentSettings.englishVoiceProfile)
      : pitch;

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

  const updateSpeechSettings = updates => {
    const nextSettings = normalizeSettings({ ...readSettings(), ...updates });
    if (updates.englishVoiceProfile || updates.englishRate !== undefined) stopSpeech();
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  return {
    playSound,
    stopSpeech,
    selectedVoice,
    speechRate: settings.englishRate,
    speechPlaybackRate: EFFECTIVE_RATES[settings.englishRate] ?? EFFECTIVE_RATES[0.9],
    speechVoiceProfile: settings.englishVoiceProfile,
    updateSpeechSettings,
    speechSupported: Boolean(synth),
  };
}
