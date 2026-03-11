import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@hooks';
import { fetchSourceRun, startPolling, stopPolling } from '@redux';
import { Card } from './Card';
import { Icon } from './Icon';
import type { SourceRun } from '@types';

interface ScoringProgressModalProps {
  jobId: string;
  isOpen: boolean;
  onClose?: () => void;
}

const stageIcons: Record<string, 'download' | 'settings' | 'robot' | 'scissors' | 'checkCircle' | 'error' | 'pause'> = {
  'loading': 'download',
  'processing': 'settings',
  'scoring': 'robot',
  'shortlisting': 'scissors',
  'completed': 'checkCircle',
  'failed': 'error',
  'idle': 'pause'
};

const stageLabels: Record<string, string> = {
  'loading': 'Loading Candidates',
  'processing': 'Processing Candidates',
  'scoring': 'Scoring & Evaluation',
  'shortlisting': 'Creating Shortlist',
  'completed': 'Completed',
  'failed': 'Failed',
  'idle': 'Idle'
};

export const ScoringProgressModal: React.FC<ScoringProgressModalProps> = ({ jobId, isOpen, onClose }) => {
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
    >
      <Card className="w-full max-w-2xl mx-4 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icon name={stageIcons[progress.current_stage] || 'pause'} size="lg" />
            {stageLabels[progress.current_stage] || 'Processing'}
          </h2>
          {isComplete && <span className="text-green-600 font-bold text-lg">Complete</span>}
          {isFailed && <span className="text-red-600 font-bold text-lg">Failed</span>}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFailed ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Candidate Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
            <p className="text-3xl font-bold text-blue-600">{progress.total_candidates || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Processed</p>
            <p className="text-3xl font-bold text-green-600">{progress.processed_candidates || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Scored</p>
            <p className="text-3xl font-bold text-purple-600">{progress.scored_candidates || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Filtered</p>
            <p className="text-3xl font-bold text-yellow-600">{progress.filtered_candidates || 0}</p>
          </div>
        </div>

        {/* Status Message */}
        {progress.message && (
          <div className={`p-4 rounded-lg ${isFailed ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
            <p className="text-sm">{progress.message}</p>
          </div>
        )}

        {/* Stages */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-600">Stages</p>
          <div className="space-y-1">
            {(['loading', 'processing', 'scoring', 'shortlisting', 'completed'] as const).map((stage) => {
              const isActive = progress.current_stage === stage;
              const isDone = 
                progress.current_stage === 'completed' ||
                ['loading', 'processing', 'scoring', 'shortlisting', 'completed'].indexOf(progress.current_stage) > ['loading', 'processing', 'scoring', 'shortlisting', 'completed'].indexOf(stage);

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : isDone
                      ? 'bg-green-100 text-green-900'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon name={stageIcons[stage]} size="md" />
                  <span>{stageLabels[stage]}</span>
                  {isActive && <span className="ml-auto animate-pulse">●</span>}
                  {isDone && <span className="ml-auto">✓</span>}
                </div>
              );
            })}
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
          >
            {isComplete || isFailed ? 'Close' : 'Minimize'}
          </button>
        </div>
      </Card>
    </div>
  );
};
