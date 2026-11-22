import React, { useEffect, useState, useRef } from 'react';
import { formatBDT } from '../lib/decimal';

interface AnimatedCounterProps {
  value: number | string | null | undefined;
  type?: 'bdt' | 'number' | 'pct';
  duration?: number;
  className?: string;
  decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  type = 'bdt',
  duration = 900,
  className = '',
  decimals = 0,
}) => {
  const targetNum = typeof value === 'number' ? value : Number(value) || 0;
  const [displayVal, setDisplayVal] = useState<number>(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // If target is 0 or NaN, quickly settle
    if (targetNum === 0 || isNaN(targetNum)) {
      setDisplayVal(0);
      return;
    }

    const startVal = 0;
    const endVal = targetNum;
    startTimeRef.current = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = startVal + (endVal - startVal) * easedProgress;
      setDisplayVal(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayVal(endVal);
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [targetNum, duration]);

  const formatted = (() => {
    if (type === 'bdt') {
      return formatBDT(displayVal);
    }
    if (type === 'pct') {
      return `${displayVal.toFixed(1)}%`;
    }
    return Math.round(displayVal).toLocaleString('en-US');
  })();

  return <span className={className}>{formatted}</span>;
};
