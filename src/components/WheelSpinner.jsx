import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const COLORS = ['#facc15', '#66b77e', '#b9f3d6', '#405b5b'];
const CENTER = 250;
const RADIUS = 238;
const INNER_RADIUS = 44;
const POINTER_ANGLE = -90;
const SPIN_DURATION = 4800;

const toRadians = (angle) => (angle * Math.PI) / 180;

const pointOnCircle = (radius, angle) => ({
  x: CENTER + radius * Math.cos(toRadians(angle)),
  y: CENTER + radius * Math.sin(toRadians(angle)),
});

const getSegmentPath = (startAngle, endAngle) => {
  const start = pointOnCircle(RADIUS, startAngle);
  const end = pointOnCircle(RADIUS, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const getRandomIndex = (length) => Math.floor(Math.random() * length);

export default function WheelSpinner({
  items,
  onWinner,
  disabled = false,
  spinRequest = 0,
  ariaLabel = 'Rueda de selección',
}) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const timerRef = useRef(null);
  const spinningRef = useRef(false);
  const spinRef = useRef(null);
  const lastRequest = useRef(spinRequest);
  const audioContextRef = useRef(null);
  const spinSoundTimerRef = useRef(null);

  const segments = useMemo(() => {
    const step = 360 / Math.max(items.length, 1);
    const labelRadius = items.length <= 20 ? 190 : 218;
    const fontSize = items.length <= 10 ? 20 : items.length <= 20 ? 14 : items.length <= 40 ? 10 : 8;

    return items.map((item, index) => {
      const startAngle = POINTER_ANGLE + index * step;
      const endAngle = startAngle + step;
      const middleAngle = startAngle + step / 2;
      const labelPoint = pointOnCircle(labelRadius, middleAngle);
      const isLight = index % COLORS.length === 0 || index % COLORS.length === 2;

      return {
        item,
        index,
        path: getSegmentPath(startAngle, endAngle),
        labelPoint,
        middleAngle,
        color: COLORS[index % COLORS.length],
        textColor: isLight ? '#10201d' : '#ffffff',
        fontSize,
      };
    });
  }, [items]);

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    window.clearTimeout(spinSoundTimerRef.current);
  }, []);

  const playVictorySound = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioContextRef.current ??= new AudioContext();
    const audioContext = audioContextRef.current;
    audioContext.resume();
    [392, 523, 659, 784, 988].forEach((frequency, index) => {
      const start = audioContext.currentTime + index * 0.1;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index === 4 ? 'square' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.17);
    });
  };

  const startSpinSound = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioContextRef.current ??= new AudioContext();
    const audioContext = audioContextRef.current;
    const playTick = () => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(145, now);
      oscillator.frequency.exponentialRampToValueAtTime(85, now + 0.055);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.07);
    };

    const startedAt = performance.now();
    const scheduleTick = () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= SPIN_DURATION) return;
      playTick();
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      spinSoundTimerRef.current = window.setTimeout(scheduleTick, 75 + (progress ** 2) * 375);
    };

    audioContext.resume();
    window.clearTimeout(spinSoundTimerRef.current);
    scheduleTick();
  };

  const spin = () => {
    if (disabled || spinningRef.current || items.length === 0) return;
    spinningRef.current = true;

    const winnerIndex = getRandomIndex(items.length);
    const step = 360 / items.length;
    const winnerCenterAngle = POINTER_ANGLE + (winnerIndex + 0.5) * step;
    const correction = (POINTER_ANGLE - (winnerCenterAngle + rotation) + 360) % 360;

    startSpinSound();
    setIsSpinning(true);
    setRotation(rotation + 360 * 6 + correction);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      window.clearTimeout(spinSoundTimerRef.current);
      spinningRef.current = false;
      setIsSpinning(false);
      onWinner(items[winnerIndex]);
      playVictorySound();
    }, SPIN_DURATION);
  };

  useLayoutEffect(() => { spinRef.current = spin; });
  useEffect(() => {
    if (spinRequest === lastRequest.current) return;
    const increased = spinRequest > lastRequest.current;
    lastRequest.current = spinRequest;
    if (increased) spinRef.current();
  }, [spinRequest]);

  return (
    <div className="number-wheel-stage" aria-label={ariaLabel}>
      <div className="number-wheel-pointer" aria-hidden="true" />
      <svg
        className={`number-wheel-svg ${isSpinning ? 'is-spinning' : ''}`}
        viewBox="0 0 500 500"
        role="img"
        aria-label={ariaLabel}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <circle cx={CENTER} cy={CENTER} r={RADIUS + 2} fill="#f8fafc" />
        {segments.map((segment) => (
          <g key={`${segment.index}-${segment.item}`}>
            <path d={segment.path} fill={segment.color} stroke="#ffffff" strokeWidth={items.length <= 20 ? 2 : 0.6} />
            <text
              x={segment.labelPoint.x}
              y={segment.labelPoint.y}
              fill={segment.textColor}
              fontSize={segment.fontSize}
              fontWeight="900"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${segment.middleAngle + 90} ${segment.labelPoint.x} ${segment.labelPoint.y})`}
            >
              {segment.item}
            </text>
          </g>
        ))}
        <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS + 5} fill="#ffffff" opacity="0.9" />
        <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="#263b3b" stroke="#ffffff" strokeWidth="3" />
      </svg>
      <button
        type="button"
        className="number-wheel-center-button"
        onClick={spin}
        disabled={disabled || isSpinning || items.length === 0}
        aria-label={isSpinning ? 'La rueda está girando' : 'Girar la rueda'}
      >
        {isSpinning ? '...' : 'SPIN'}
      </button>
    </div>
  );
}
