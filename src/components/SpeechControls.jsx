import { useEffect, useRef, useState } from 'react';
import useSpeech from '../hooks/useSpeech';

const voiceOptions = [
  { value: 'teen-girl', label: 'Niña adolescente' },
  { value: 'male', label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
];

function SpeechDropdown({ id, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => String(option.value) === String(value)) ?? options[0];

  return (
    <div className="relative mt-1">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-2 py-1 text-left text-xs font-semibold text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
        style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
      >
        <span>{selected.label}</span>
        <span aria-hidden="true" className="ml-2 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-full z-[70] mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl dark:border-slate-500 dark:bg-slate-700"
          style={{ backgroundColor: '#ffffff' }}
        >
          {options.map(option => (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs font-semibold transition-colors ${
                String(option.value) === String(value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-900 hover:bg-blue-100 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
              }`}
              style={
                String(option.value) === String(value)
                  ? { color: '#ffffff', backgroundColor: '#2563eb' }
                  : { color: '#0f172a', backgroundColor: '#ffffff' }
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpeechControls() {
  const {
    speechRate,
    speechVoiceProfile,
    updateSpeechSettings,
    speechSupported,
  } = useSpeech({ language: 'en-US' });
  const [open, setOpen] = useState(false);
  const controlRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = event => {
      if (!controlRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!speechSupported) return null;

  return (
    <div ref={controlRef} className="relative">
      <button
        type="button"
        aria-label="Configuración de voz"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-900 ${open ? 'bg-blue-500 ring-2 ring-blue-300' : 'bg-blue-600'}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M4 9v6h4l5 4V5L8 9H4Zm11.5 3a3.5 3.5 0 0 0-1.5-2.87v5.74A3.5 3.5 0 0 0 15.5 12Zm0-7.5v2.1A6 6 0 0 1 19 12a6 6 0 0 1-3.5 5.4v2.1A8 8 0 0 0 21 12a8 8 0 0 0-5.5-7.5Z" />
        </svg>
      </button>

      {open && (
      <div className="absolute right-0 top-9 z-[60] w-64 rounded-xl border border-slate-300 bg-white p-3 text-slate-900 shadow-xl dark:border-slate-600 dark:bg-slate-800 dark:text-white">
        <label className="block text-xs font-bold" htmlFor="english-voice">
          Perfil de voz
        </label>
        <SpeechDropdown
          id="english-voice"
          value={speechVoiceProfile}
          options={voiceOptions}
          onChange={value => updateSpeechSettings({ englishVoiceProfile: value })}
        />

        <label className="mt-3 block text-xs font-bold" htmlFor="english-rate">
          Velocidad: {speechRate === 1 ? '1x' : `${speechRate.toFixed(1)}x`}
        </label>
        <input
          id="english-rate"
          type="range"
          min="0.7"
          max="1"
          step="0.1"
          value={speechRate}
          onChange={event => updateSpeechSettings({ englishRate: Number(event.target.value) })}
          className="mt-2 w-full accent-blue-600"
        />
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-300">
          <span>0.7x</span>
          <span>0.8x</span>
          <span>0.9x</span>
          <span>1x</span>
        </div>
      </div>
      )}
    </div>
  );
}
