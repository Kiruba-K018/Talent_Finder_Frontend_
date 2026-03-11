import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval?: number;
  shouldPoll?: boolean;
  onPoll?: () => void | Promise<void>;
}

export const usePolling = ({
  interval = 5000,
  shouldPoll = true,
  onPoll,
}: UsePollingOptions): void => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!shouldPoll || !onPoll) return;

    // Call immediately first
    onPoll();

    // Then set up interval
    intervalRef.current = setInterval(() => {
      onPoll();
    }, interval);
  }, [interval, shouldPoll, onPoll]);

  useEffect(() => {
    if (shouldPoll) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [shouldPoll, startPolling, stopPolling]);

  return;
};
