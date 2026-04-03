import { AnswerGameProvider } from '../AnswerGameProvider';
import type { AnswerGameConfig } from '../types';
import type { ReactNode } from 'react';

interface AnswerGameProps {
  config: AnswerGameConfig;
  children: ReactNode;
}

const AnswerGameRoot = ({ config, children }: AnswerGameProps) => (
  <AnswerGameProvider config={config}>
    <div className="flex min-h-dvh flex-col">{children}</div>
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
