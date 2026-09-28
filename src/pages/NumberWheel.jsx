import { useEffect, useState } from 'react';
import WheelSpinner from '../components/WheelSpinner';
import WheelResultModal from '../components/WheelResultModal';

const RANGES = [
  { id: '20', label: '1 al 20', max: 20 },
  { id: '100', label: '1 al 100', max: 100 },
];

export default function NumberWheel() {
  const [rangeId, setRangeId] = useState('20');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [result, setResult] = useState(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [spinRequest, setSpinRequest] = useState(0);

  const selectedRange = RANGES.find((range) => range.id === rangeId) ?? RANGES[0];
  const items = Array.from({ length: selectedRange.max }, (_, index) => String(index + 1));

  useEffect(() => {
    if (!isResultOpen) return undefined;
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') setIsResultOpen(false);
    };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [isResultOpen]);

  const changeRange = (nextRangeId) => {
    setRangeId(nextRangeId);
    setIsManualMode(false);
    setManualNumber('');
    setResult(null);
    setIsResultOpen(false);
  };

  const enableManualMode = () => {
    setIsManualMode(true);
    setManualNumber('');
    setResult(null);
    setIsResultOpen(false);
  };

  const showManualNumber = () => {
    const selectedNumber = Number(manualNumber);
    if (!Number.isInteger(selectedNumber) || selectedNumber < 1 || selectedNumber > 100) return;
    setResult(String(selectedNumber));
    setIsResultOpen(true);
  };

  const spinAgain = () => {
    if (isManualMode) return;
    setIsResultOpen(false);
    setSpinRequest((current) => current + 1);
  };

  return (
    <main className="number-wheel-page names-wheel-page">
      <section className="number-wheel-panel names-wheel-panel">
        <div className="number-wheel-title-wrap w-full text-center">
          <h1 className="number-wheel-title">Numbers</h1>
        </div>

        <WheelSpinner items={items} onWinner={(winner) => { setResult(winner); setIsResultOpen(true); }} spinRequest={spinRequest} disabled={isManualMode} ariaLabel={`Rueda con números del 1 al ${selectedRange.max}`} />

        <div className="number-wheel-controls w-full max-w-sm rounded-2xl bg-slate-950/70 p-2" role="group" aria-label="Seleccionar rango o modo manual">
          <p className="number-wheel-controls-label">Rango de números</p>
          <div className="grid grid-cols-3 gap-2">
            {RANGES.map((range) => (
              <button key={range.id} type="button" className={`rounded-xl px-3 py-2.5 text-base font-black transition-colors ${!isManualMode && rangeId === range.id ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-white/10'}`} aria-pressed={!isManualMode && rangeId === range.id} onClick={() => changeRange(range.id)}>
                {range.label}
              </button>
            ))}
            <button type="button" className={`rounded-xl px-2 py-2.5 text-sm font-black transition-colors ${isManualMode ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-white/10'}`} aria-pressed={isManualMode} onClick={enableManualMode}>Manual</button>
          </div>
        </div>

        {isManualMode && (
          <form className="number-wheel-manual-panel grid w-full max-w-sm grid-cols-[1fr_auto] gap-2 rounded-2xl bg-slate-950/90 p-2" onSubmit={(event) => { event.preventDefault(); showManualNumber(); }}>
            <label className="sr-only" htmlFor="manual-number">Ingresar un número manual</label>
            <input id="manual-number" type="number" min="1" max="100" step="1" value={manualNumber} onChange={(event) => setManualNumber(event.target.value)} placeholder="1-100" className="min-w-0 rounded-xl border-2 border-slate-600 bg-white px-3 py-2 text-center text-lg font-black text-slate-950 outline-none focus:border-amber-300" />
            <button type="submit" className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-black text-white transition-colors hover:bg-blue-500">Mostrar</button>
          </form>
        )}
      </section>

      {isResultOpen && (
        <WheelResultModal
          // title="The number is"
          onClose={() => setIsResultOpen(false)}
          onSpin={isManualMode ? undefined : spinAgain}
        >
            <span className={`absolute bottom-[4.9rem] left-2 right-2 top-5 flex scale-y-[2.4] items-center justify-center text-center font-black leading-[0.85] tracking-[-0.09em] text-slate-900 ${String(result).length === 1 ? 'text-[min(38vh,62vw)]' : String(result).length === 2 ? 'text-[min(32vh,55vw)]' : 'text-[min(25vh,50vw)]'}`}>
              {result}
            </span>
        </WheelResultModal>
      )}
    </main>
  );
}
