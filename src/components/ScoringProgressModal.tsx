import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@hooks';
import { fetchSourceRun, startPolling, stopPolling } from '@redux/slices/sourceRunSlice';
import { Card } from './Card';
import { Icon } from './Icon';
import type { SourceRun } from '@types';

interface ScoringProgressModalProps {
  jobId: string;
  isOpen: boolean;
  onClose?: () => void;
}

const stageIcons: Record<
  string,
  'download' | 'settings' | 'robot' | 'scissors' | 'checkCircle' | 'error' | 'pause'
> = {
  loading: 'download',
  processing: 'settings',
  scoring: 'robot',
  shortlisting: 'scissors',
  completed: 'checkCircle',
  failed: 'error',
  idle: 'pause',
};

const stageLabels: Record<string, string> = {
  loading: 'Loading Candidates',
  processing: 'Processing Candidates',
  scoring: 'Scoring & Evaluation',
  shortlisting: 'Creating Shortlist',
  completed: 'Completed',
  failed: 'Failed',
  idle: 'Idle',
};

export const ScoringProgressModal: React.FC<ScoringProgressModalProps> = ({
  jobId,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { runsByJobId } = useAppSelector((state) => state.sourceRun);
  const progress: SourceRun | undefined = runsByJobId[jobId];
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // Start polling
    dispatch(startPolling(jobId));

    // Initial fetch
    dispatch(fetchSourceRun(jobId));

    // Poll every 5 seconds (reduced from 2s to avoid API flooding)
    const interval = setInterval(() => {
      dispatch(fetchSourceRun(jobId));
    }, 100000);

    return () => {
      clearInterval(interval);
    };
  }, [dispatch, jobId, isOpen]);

  useEffect(() => {
    // Stop polling if completed or failed
    if (progress?.status === 'completed' || progress?.status === 'failed') {
      dispatch(stopPolling(jobId));
    }
  }, [progress?.status, dispatch, jobId]);

  if (!isOpen || !progress) {
    return null;
  }

  const progressPercent = progress.progress_percent || 0;
  const isComplete = progress.status === 'completed';
  const isFailed = progress.status === 'failed';

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal only if clicking on the backdrop itself, not the card
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoring-modal-title"
      >
        <Card className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="scoring-modal-title" className="text-2xl font-bold flex items-center gap-2">
              <Icon
                name={stageIcons[progress.current_stage] || 'pause'}
                size="lg"
                aria-hidden="true"
              />
              {stageLabels[progress.current_stage] || 'Processing'}
            </h2>
            {isComplete && (
              <span className="text-green-600 font-bold text-lg" aria-label="Scoring complete">
                {progress.status === 'completed' ? 'Complete' : 'Complete'}
              </span>
            )}
            {isFailed && (
              <span className="text-red-600 font-bold text-lg" aria-label="Scoring failed">
                {progress.status === 'failed' ? 'Failed' : 'Failed'}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span
                className="font-semibold"
                aria-live="polite"
                aria-label={`Progress: ${progressPercent} percent`}
              >
                {progressPercent}%
              </span>
            </div>
            <div
              className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall progress"
            >
              <div
                className={`h-full transition-all duration-500 ${
                  isFailed ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Candidate Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
              <p
                className="text-3xl font-bold text-blue-600"
                aria-label={`Total candidates: ${progress.total_candidates || 0}`}
              >
                {progress.total_candidates || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Processed</p>
              <p
                className="text-3xl font-bold text-green-600"
                aria-label={`Processed candidates: ${progress.processed_candidates || 0}`}
              >
                {progress.processed_candidates || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Scored</p>
              <p
                className="text-3xl font-bold text-purple-600"
                aria-label={`Scored candidates: ${progress.scored_candidates || 0}`}
              >
                {progress.scored_candidates || 0}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Filtered</p>
              <p
                className="text-3xl font-bold text-yellow-600"
                aria-label={`Filtered candidates: ${progress.filtered_candidates || 0}`}
              >
                {progress.filtered_candidates || 0}
              </p>
            </div>
          </div>

          {/* Status Message */}
          {progress.message && (
            <div
              className={`p-4 rounded-lg ${isFailed ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}
              role={isFailed ? 'alert' : 'status'}
              aria-live="polite"
            >
              <p className="text-sm">{progress.message}</p>
            </div>
          )}

          {/* Stages */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600">Stages</p>
            <div className="space-y-1" role="list">
              {(['loading', 'processing', 'scoring', 'shortlisting', 'completed'] as const).map(
                (stage) => {
                  const isActive = progress.current_stage === stage;
                  const isDone =
                    progress.current_stage === 'completed' ||
                    ['loading', 'processing', 'scoring', 'shortlisting', 'completed'].indexOf(
                      progress.current_stage
                    ) >
                      ['loading', 'processing', 'scoring', 'shortlisting', 'completed'].indexOf(
                        stage
                      );

                  return (
                    <div
                      key={stage}
                      role="listitem"
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : isDone
                            ? 'bg-green-100 text-green-900'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                      aria-label={`${stageLabels[stage]} ${isActive ? '(in progress)' : isDone ? '(completed)' : '(pending)'}`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <Icon name={stageIcons[stage]} size="md" aria-hidden="true" />
                      <span>{stageLabels[stage]}</span>
                      {isActive && (
                        <span className="ml-auto animate-pulse" aria-hidden="true">
                          ●
                        </span>
                      )}
                      {isDone && (
                        <span className="ml-auto" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isComplete || isFailed
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label={
                isComplete || isFailed
                  ? 'Close scoring progress modal'
                  : 'Minimize scoring progress modal'
              }
            >
              {isComplete || isFailed ? 'Close' : 'Minimize'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
