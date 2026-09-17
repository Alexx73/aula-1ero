import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const validVector = value => value && ['x', 'y', 'z'].every(axis => Number.isFinite(value[axis]));

export default function useShake({ armed, onShake }) {
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const callback = useRef(onShake);
  const mounted = useRef(false);
  const requesting = useRef(false);
  const blockedUntil = useRef(0);
  useLayoutEffect(() => { callback.current = onShake; }, [onShake]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const toggle = async () => {
    if (requesting.current) return;
    if (enabled) {
      setEnabled(false);
      setMessage('');
      return;
    }
    if (!window.isSecureContext) {
      setMessage('La sacudida necesita HTTPS. Abrí la versión de GitHub Pages.');
      return;
    }
    if (!window.DeviceMotionEvent) {
      setMessage('Este navegador no admite el sensor. Usá SPIN.');
      return;
    }
    requesting.current = true;
    setPending(true);
    try {
      const permission = typeof window.DeviceMotionEvent.requestPermission === 'function'
        ? await window.DeviceMotionEvent.requestPermission() : 'granted';
      if (!mounted.current) return;
      if (permission !== 'granted') {
        setMessage('Permiso de movimiento denegado. Podés seguir usando SPIN.');
        return;
      }
      setMessage('Esperando el sensor de movimiento…');
      setEnabled(true);
    } catch {
      if (mounted.current) setMessage('No se pudo activar el sensor. Podés seguir usando SPIN.');
    } finally {
      requesting.current = false;
      if (mounted.current) setPending(false);
    }
  };

  useEffect(() => {
    if (!enabled) return undefined;
    let previous = null;
    let firstPeak = null;
    let aboveThreshold = false;
    let received = false;
    const reset = () => { previous = null; firstPeak = null; aboveThreshold = false; };
    const timer = window.setTimeout(() => {
      if (!received) {
        setMessage('El dispositivo no entrega datos de movimiento. Usá SPIN o intentá activar otra vez.');
        setEnabled(false);
      }
    }, 5000);
    const onMotion = event => {
      const direct = validVector(event.acceleration) ? event.acceleration : null;
      const gravity = validVector(event.accelerationIncludingGravity) ? event.accelerationIncludingGravity : null;
      if (!direct && !gravity) return;
      if (!received) {
        received = true;
        window.clearTimeout(timer);
        setMessage('Sacudida activada: con un nombre visible, sacudí para elegir el siguiente.');
      }
      if (!armed || document.hidden) { reset(); return; }
      const now = performance.now();
      if (now < blockedUntil.current) { reset(); return; }
      let vector = direct;
      if (!vector) {
        const last = previous;
        previous = gravity;
        if (!last) return;
        vector = { x: gravity.x - last.x, y: gravity.y - last.y, z: gravity.z - last.z };
      }
      const high = Math.hypot(vector.x, vector.y, vector.z) > 15;
      const rising = high && !aboveThreshold;
      aboveThreshold = high;
      if (!rising) return;
      if (firstPeak === null || now - firstPeak > 600) { firstPeak = now; return; }
      if (now - firstPeak < 80) return;
      blockedUntil.current = now + 1500;
      reset();
      callback.current();
    };
    window.addEventListener('devicemotion', onMotion);
    document.addEventListener('visibilitychange', reset);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('devicemotion', onMotion);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [enabled, armed]);

  return { enabled, pending, message, toggle };
}
