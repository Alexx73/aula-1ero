import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const COLORS = ['#facc15', '#66b77e', '#b9f3d6', '#405b5b'];
const CENTER = 250;
const RADIUS = 238;
const INNER_RADIUS = 44;
const POINTER_ANGLE = -90;
const SPIN_DURATION = 4800;
const SPIN_EASING = [0.12, 0.74, 0.18, 1];

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

const createCubicBezier = ([x1, y1, x2, y2]) => {
  const sampleCurveX = (t) => (((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t + 3 * x1) * t;
  const sampleCurveY = (t) => (((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t + 3 * y1) * t;
  const sampleDerivativeX = (t) => (3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + 3 * x1;

  return (progress) => {
    let t = progress;
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const derivative = sampleDerivativeX(t);
      if (Math.abs(derivative) < 1e-6) break;
      t -= (sampleCurveX(t) - progress) / derivative;
    }

    let lower = 0;
    let upper = 1;
    t = Math.min(1, Math.max(0, t));
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const x = sampleCurveX(t);
      if (Math.abs(x - progress) < 1e-5) break;
      if (x < progress) lower = t;
      else upper = t;
      t = (lower + upper) / 2;
    }
    return sampleCurveY(t);
  };
};

const easeSpin = createCubicBezier(SPIN_EASING);

export default function WheelSpinner({
  items,
  onWinner,
  disabled = false,
  spinRequest = 0,
  selectedItem = null,
  onSelectItem,
  ariaLabel = 'Rueda de selección',
}) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const rotationRef = useRef(0);
  const animationFrameRef = useRef(null);
  const spinningRef = useRef(false);
  const spinRef = useRef(null);
  const lastRequest = useRef(spinRequest);
  const audioContextRef = useRef(null);

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
        markerPoint: pointOnCircle(labelRadius - 16, middleAngle),
        middleAngle,
        color: COLORS[index % COLORS.length],
        textColor: isLight ? '#10201d' : '#ffffff',
        fontSize,
      };
    });
  }, [items]);

  useEffect(() => () => {
    window.cancelAnimationFrame(animationFrameRef.current);
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

  const playSpinTick = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioContextRef.current ??= new AudioContext();
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(145, now);
    oscillator.frequency.exponentialRampToValueAtTime(85, now + 0.055);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.07);
  };

  const spin = () => {
    if (disabled || spinningRef.current || items.length === 0) return;
    spinningRef.current = true;

    const selectedIndex = items.indexOf(selectedItem);
    const winnerIndex = selectedIndex >= 0 ? selectedIndex : getRandomIndex(items.length);
    const step = 360 / items.length;
    const winnerCenterAngle = POINTER_ANGLE + (winnerIndex + 0.5) * step;
    const startRotation = rotationRef.current;
    const correction = (POINTER_ANGLE - (winnerCenterAngle + startRotation) + 360) % 360;
    const totalRotation = 360 * 6 + correction;
    const targetRotation = startRotation + totalRotation;
    const tickAngle = Math.max(24, step * 2);
    const itemsSnapshot = items.slice();
    const context = window.AudioContext || window.webkitAudioContext;

    if (context) {
      audioContextRef.current ??= new context();
      audioContextRef.current.resume();
      playSpinTick();
    }
    setIsSpinning(true);
    let startedAt = null;
    let nextTickDistance = tickAngle;

    const animate = (timestamp) => {
      if (startedAt === null) startedAt = timestamp;
      const elapsed = timestamp - startedAt;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const distance = totalRotation * easeSpin(progress);
      const nextRotation = startRotation + distance;

      rotationRef.current = nextRotation;
      setRotation(nextRotation);

      if (distance >= nextTickDistance && progress < 1) {
        playSpinTick();
        nextTickDistance += tickAngle;
      }

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      rotationRef.current = targetRotation;
      setRotation(targetRotation);
      spinningRef.current = false;
      setIsSpinning(false);
      onWinner(itemsSnapshot[winnerIndex]);
      playVictorySound();
    };

    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = window.requestAnimationFrame(animate);
  };

  useLayoutEffect(() => { spinRef.current = spin; });
  useEffect(() => {
    if (spinRequest === lastRequest.current) return;
    const increased = spinRequest > lastRequest.current;
    lastRequest.current = spinRequest;
    if (increased) spinRef.current();
  }, [spinRequest]);

  const selectItem = (item) => {
    if (disabled || spinningRef.current || !onSelectItem) return;
    onSelectItem(item === selectedItem ? null : item);
  };

  return (
    <div className="number-wheel-stage" aria-label={ariaLabel}>
      <div className="number-wheel-pointer" aria-hidden="true" />
      <svg
        className={`number-wheel-svg ${isSpinning ? 'is-spinning' : ''}`}
        viewBox="0 0 500 500"
        role={onSelectItem ? 'group' : 'img'}
        aria-label={ariaLabel}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <circle cx={CENTER} cy={CENTER} r={RADIUS + 2} fill="#f8fafc" />
        {segments.map((segment) => (
          <g
            key={`${segment.index}-${segment.item}`}
            role={onSelectItem ? 'button' : undefined}
            tabIndex={onSelectItem && !disabled && !isSpinning ? 0 : undefined}
            aria-label={onSelectItem ? `Elegir a ${segment.item} para el próximo giro` : undefined}
            aria-pressed={onSelectItem ? selectedItem === segment.item : undefined}
            aria-disabled={onSelectItem ? disabled || isSpinning : undefined}
            onClick={onSelectItem ? () => selectItem(segment.item) : undefined}
            onKeyDown={onSelectItem ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectItem(segment.item);
              }
            } : undefined}
            style={{ cursor: onSelectItem && !disabled && !isSpinning ? 'pointer' : undefined }}
          >
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
            {selectedItem === segment.item && !isSpinning && (
              <circle cx={segment.markerPoint.x} cy={segment.markerPoint.y} r="2.5" fill={segment.textColor} aria-hidden="true" />
            )}
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
