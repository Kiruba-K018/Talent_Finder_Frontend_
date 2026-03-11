import { useState, useEffect } from 'react';

interface UseCountUpOptions {
  duration?: number;
  delay?: number;
}

export const useCountUp = (
  targetValue: number,
  options: UseCountUpOptions = {}
): number => {
  const { duration = 500, delay = 0 } = options;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (count === targetValue) return;

      const increment = targetValue / (duration / 16); // 16ms per frame (60fps)
      const step = Math.max(1, Math.ceil(increment));
      const nextCount = Math.min(count + step, targetValue);

      const interval = setInterval(() => {
        setCount((prev) => {
          const next = Math.min(prev + step, targetValue);
          if (next >= targetValue) {
            clearInterval(interval);
            return targetValue;
          }
          return next;
        });
      }, 16);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [targetValue, duration, delay]);

  return count;
};
