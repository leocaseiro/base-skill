import { AnswerGameProvider } from '../AnswerGameProvider';
import type { AnswerGameConfig, AnswerGameDraftState } from '../types';
import type { ReactNode } from 'react';

interface AnswerGameProps {
  config: AnswerGameConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  children: ReactNode;
}

const AnswerGameRoot = ({
  config,
  initialState,
  sessionId,
  children,
}: AnswerGameProps) => (
  <AnswerGameProvider
    config={config}
    initialState={initialState}
    sessionId={sessionId}
  >
    <div className="flex min-h-0 w-full flex-col items-center">
      {children}
    </div>
  </AnswerGameProvider>
);

const Question = ({ children }: { children?: ReactNode }) => (
  <div className="game-question-zone flex flex-col items-center gap-4 px-4 py-6">
    {children}
  </div>
);

const Answer = ({ children }: { children?: ReactNode }) => (
  <div className="game-answer-zone flex flex-wrap justify-center gap-2 px-4 py-4">
    {children}
  </div>
);

const Choices = ({ children }: { children?: ReactNode }) => (
  <div className="game-choices-zone flex flex-wrap justify-center gap-3 px-4 py-4">
    {children}
  </div>
);

export const AnswerGame = Object.assign(AnswerGameRoot, {
  Question,
  Answer,
  Choices,
});
