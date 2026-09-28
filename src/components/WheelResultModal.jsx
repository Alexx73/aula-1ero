export default function WheelResultModal({
  title,
  onClose,
  onSpin,
  spinDisabled = false,
  status,
  children,
}) {
  const titleId = title ? 'wheel-result-modal-title' : undefined;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/80 p-4 backdrop-blur" role="presentation">
      <div
        className="relative flex min-h-[min(105.8vh,48.3rem)] max-h-[calc(100vh-2rem)] w-[min(92vw,34rem)] flex-col items-center justify-center overflow-hidden rounded-[2rem] border-[0.35rem] border-amber-400 bg-white text-center text-slate-900 shadow-[0_1rem_3rem_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={title ? undefined : 'Resultado de la rueda'}
      >
        <button type="button" className="absolute right-[0.7rem] top-[0.65rem] z-10 h-[3.2rem] w-[3.2rem] rounded-full border-0 bg-slate-200 text-[2.3rem] font-medium leading-none text-slate-900 hover:bg-slate-300" onClick={onClose} aria-label="Cerrar resultado">
          ×
        </button>
        {title && <p id={titleId} className="absolute left-0 right-0 top-16 z-[2] text-[clamp(1.2rem,4vw,1.7rem)] font-black uppercase tracking-[0.08em] text-blue-600">{title}</p>}
        {status}
        {children}
        {onSpin && (
          <button
            type="button"
            className="absolute bottom-4 z-[3] rounded-full border-0 bg-orange-500 px-24 py-5 text-xl font-black text-white shadow-[0_0.25rem_0.6rem_rgba(249,115,22,0.35)] hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
            onClick={onSpin}
            disabled={spinDisabled}
            aria-label="Volver a girar la rueda"
          >
            ↻ Spin again
          </button>
        )}
      </div>
    </div>
  );
}
