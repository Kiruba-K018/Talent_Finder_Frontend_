import React, { useState, useEffect } from 'react';
import type { SourceRun } from '@types';
import { useCountUp } from '@hooks';

interface ScoringProgressAnimationProps {
  sourceRun: SourceRun;
}

export const ScoringProgressAnimation: React.FC<ScoringProgressAnimationProps> = ({
  sourceRun,
}) => {
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);

  const profilesCount = useCountUp(sourceRun.profiles_fetched);
  const scoredCount = useCountUp(sourceRun.candidates_scored);
  const shortlistCount = useCountUp(sourceRun.shortlist_size);

  const statusMessages = [
    'Analyzing skill embeddings',
    'Computing semantic similarity',
    'Running AI evaluation',
    'Aggregating scores',
    'Building ranked shortlist',
    'Finalizing results',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [statusMessages.length]);

  return (
    <div className="space-y-8 py-8">
      <PipelineFlow currentStage={sourceRun.current_stage} />

      <div className="grid grid-cols-3 gap-4">
        <CounterCard label="Profiles Fetched" value={profilesCount} />
        <CounterCard label="Candidates Scored" value={scoredCount} />
        <CounterCard label="Shortlist Size" value={shortlistCount} />
      </div>

      <StatusCarousel message={statusMessages[statusMessageIndex]} />
    </div>
  );
};

interface PipelineFlowProps {
  currentStage?: string;
}

const PipelineFlow: React.FC<PipelineFlowProps> = ({ currentStage }) => {
  const stages = [
    { name: 'Profiles Fetched', icon: '🔍' },
    { name: 'Pre-filtering', icon: '⏳' },
    { name: 'Parsing Resumes', icon: '📄' },
    { name: 'Generating Embeddings', icon: '🧠' },
    { name: 'Scoring', icon: '🏆' },
  ];

  return (
    <div className="flex items-center justify-between">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.name}>
          <StageNode
            stage={stage}
            isActive={stage.name === currentStage}
            isCompleted={index < stages.findIndex((s) => s.name === currentStage || stages.length)}
          />
          {index < stages.length - 1 && (
            <div className="flex-1 h-1 bg-gray-200 mx-2 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-transparent pipeline-line"></div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface StageNodeProps {
  stage: { name: string; icon: string };
  isActive: boolean;
  isCompleted: boolean;
}

const StageNode: React.FC<StageNodeProps> = ({ stage, isActive, isCompleted }) => {
  const baseClass =
    'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300';

  let stateClass = 'bg-gray-200 text-gray-600';
  if (isCompleted) stateClass = 'bg-green-500 text-white';
  if (isActive) stateClass = 'bg-blue-500 text-white pulse-glow';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${baseClass} ${stateClass}`}>{stage.icon}</div>
      <span className="text-xs text-center font-medium whitespace-nowrap">{stage.name}</span>
    </div>
  );
};

interface CounterCardProps {
  label: string;
  value: number;
}

const CounterCard: React.FC<CounterCardProps> = ({ label, value }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className="text-3xl font-bold text-blue-600 count-animate">{value}</p>
    </div>
  );
};

interface StatusCarouselProps {
  message: string;
}

const StatusCarousel: React.FC<StatusCarouselProps> = ({ message }) => {
  return (
    <div className="text-center py-4">
      <p className="text-gray-700 fade-text">{message}</p>
    </div>
  );
};
