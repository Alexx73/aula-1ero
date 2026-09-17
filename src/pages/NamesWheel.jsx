import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import WheelSpinner from '../components/WheelSpinner';
import useSpeech from '../hooks/useSpeech';
import useShake from '../hooks/useShake';

const STORAGE_KEY = 'aula-wheel-names';
const DEFAULT_NAMES = `Naomi
Alejo
Elián
Abigail
David
León
Thian
Daniel
Tian
Estefanía
Bautista
Bastián
Clara
Thiago
Zaira
Kiara
Dylan
Franco
Naiara
Ailín
Maitena
Juan Pablo
Lara`;

const LEGACY_NAMES = new Map([
  ['Elian', 'Elián'],
  ['Leon', 'León'],
  ['Estefania', 'Estefanía'],
  ['Bastian', 'Bastián'],
  ['Ailin', 'Ailín'],
]);

const parseNames = (text) => {
  const uniqueNames = new Set();
  return text
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter((name) => name && !uniqueNames.has(name) && uniqueNames.add(name));
};

const readStoredNames = () => {
  try {
    const savedNames = window.localStorage.getItem(STORAGE_KEY);
    if (savedNames === null) return parseNames(DEFAULT_NAMES);
    // Apply spelling corrections before deduplication; preserve custom names and order.
    return parseNames(parseNames(savedNames)
      .map((name) => LEGACY_NAMES.get(name) ?? name)
      .join('\n'));
  } catch {
    return parseNames(DEFAULT_NAMES);
  }
};

export default function NamesWheel() {
  const { playSound, stopSpeech, selectedVoice, speechSupported } = useSpeech({
    language: 'es-AR', rate: 0.9, pitch: 1.1, requireMatchingVoice: true,
  });
  const [names, setNames] = useState(readStoredNames);
  const [availableNames, setAvailableNames] = useState(readStoredNames);
  const [nameText, setNameText] = useState(() => readStoredNames().join('\n'));
  const [usedNames, setUsedNames] = useState([]);
  const [wheelVersion, setWheelVersion] = useState(0);
  const [result, setResult] = useState(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [spinRequest, setSpinRequest] = useState(0);
  const shake = useShake({
    armed: isResultOpen,
    onShake: () => {
      if (!isResultOpen || availableNames.length === 0) return;
      stopSpeech();
      setIsResultOpen(false);
      setSpinRequest(current => current + 1);
    },
  });
  const nameAreaRef = useRef(null);
  const nameTextRef = useRef(null);

  useLayoutEffect(() => {
    if (!isResultOpen) return undefined;
    const area = nameAreaRef.current;
    const text = nameTextRef.current;
    let disposed = false;
    const fitName = () => {
      if (disposed || !area.clientWidth || !area.clientHeight) return;
      let minimum = 1;
      let maximum = area.clientHeight;
      // Fit the width first, then stretch to fill the available classroom display height.
      while (maximum - minimum > 0.5) {
        const size = (minimum + maximum) / 2;
        text.style.fontSize = `${size}px`;
        if (text.scrollWidth <= area.clientWidth && text.scrollHeight <= area.clientHeight) {
          minimum = size;
        } else {
          maximum = size;
        }
      }
      text.style.fontSize = `${minimum}px`;
      const verticalScale = (area.clientHeight * 0.95) / Math.max(text.scrollHeight, 1);
      text.style.setProperty('--name-vertical-scale', String(verticalScale));
    };
    fitName();
    const observer = new ResizeObserver(fitName);
    observer.observe(area);
    document.fonts.ready.then(fitName);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [isResultOpen, result]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, names.join('\n'));
    } catch {
      // Keep the activity usable when storage is unavailable.
    }
  }, [names]);

  useEffect(() => {
    if (!isResultOpen) return undefined;
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') {
        stopSpeech();
        setIsResultOpen(false);
      }
    };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [isResultOpen, stopSpeech]);

  const handleWinner = (winner) => {
    setAvailableNames((currentNames) => currentNames.filter((name) => name !== winner));
    setUsedNames((current) => [...current, winner]);
    setResult(winner);
    setIsResultOpen(true);
    playSound(winner, false, true);
  };

  const updateNames = (text) => {
    stopSpeech();
    const parsedNames = parseNames(text);
    setNameText(text);
    setNames(parsedNames);
    setAvailableNames(parsedNames);
    setUsedNames([]);
    setWheelVersion((current) => current + 1);
    setResult(null);
    setIsResultOpen(false);
  };

  const resetNames = () => {
    stopSpeech();
    setAvailableNames(names);
    setUsedNames([]);
    setWheelVersion((current) => current + 1);
    setResult(null);
    setIsResultOpen(false);
  };

  const closeResult = () => {
    stopSpeech();
    setIsResultOpen(false);
  };

  return (
    <main className="number-wheel-page names-wheel-page">
      <section className="number-wheel-panel names-wheel-panel">
        <div className="number-wheel-title-wrap w-full text-center">
          <h1 className="number-wheel-title">Wheel of Names</h1>
        </div>

        <WheelSpinner
          key={wheelVersion}
          items={availableNames}
          onWinner={handleWinner}
          spinRequest={spinRequest}
          ariaLabel="Rueda de nombres de alumnos"
        />

        <section className="names-wheel-footer" aria-label="Alumnos que ya salieron">
          <div className="names-wheel-history-header">
            <p role="status">Salieron <strong>{usedNames.length}</strong> de {names.length} alumnos</p>
            <button type="button" onClick={resetNames} className="names-wheel-reset-button">
              Reiniciar
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <button type="button" onClick={shake.toggle} disabled={shake.pending} aria-pressed={shake.enabled} className="rounded bg-slate-700 px-2 py-1 text-white">
              {shake.pending ? 'Solicitando permiso…' : shake.enabled ? 'Desactivar sacudida' : 'Activar sacudida'}
            </button>
          </div>
          {shake.message && <p role="status" className="mt-1 text-xs text-slate-300">{shake.message}</p>}
          <ol className="names-wheel-history" aria-label="Orden de salida">
            {usedNames.map((name, index) => (
              <li key={name} className="is-used">
                <span className="names-wheel-history-number">{index + 1}</span>
                <span className="names-wheel-history-name" title={name}>{name}</span>
              </li>
            ))}
          </ol>
          <details className="names-wheel-settings">
            <summary>Editar alumnos y voz · Quedan {availableNames.length}</summary>
            <button
              type="button"
              onClick={() => updateNames(DEFAULT_NAMES)}
              className="names-wheel-reset-button mt-2"
            >
              Cargar lista del código
            </button>
            <p className="mt-1">Reemplaza la lista actual y reinicia el sorteo.</p>
            <p role="status" className="my-2 text-xs text-slate-300">
              {selectedVoice
                ? `Voz: ${selectedVoice.name} (${selectedVoice.lang})`
                : speechSupported
                  ? 'No hay una voz española disponible en este navegador. Probá abrir esta actividad en Chrome.'
                  : 'Este navegador no permite pronunciar los nombres.'}
            </p>
            <label htmlFor="names-list" className="number-wheel-controls-label">Nombres de los alumnos</label>
            <textarea
              id="names-list"
              value={nameText}
              onChange={(event) => updateNames(event.target.value)}
              className="names-wheel-textarea w-full rounded-xl border-2 border-slate-600 bg-white px-3 py-2 text-sm font-bold text-slate-950"
              rows="3"
              aria-label="Lista de nombres, uno por línea"
            />
          </details>
        </section>
      </section>

      {isResultOpen && (
        <div className="number-wheel-modal-backdrop" role="presentation">
          <div className="number-wheel-modal" role="dialog" aria-modal="true" aria-labelledby="names-wheel-modal-title">
            <button type="button" className="number-wheel-modal-close" onClick={closeResult} aria-label="Cerrar resultado">×</button>
            <p id="names-wheel-modal-title" className="number-wheel-modal-label">The student is</p>
            {availableNames.length === 0 && (
              <p role="status" className="absolute bottom-1 left-2 right-2 z-10 text-xs font-bold text-slate-700">Ya salieron todos. Tocá Reiniciar</p>
            )}
            <div className="names-wheel-modal-name-area" ref={nameAreaRef}>
              <span className="names-wheel-modal-name" ref={nameTextRef}>{result}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

