import { AnswerGameProvider } from '../AnswerGameProvider';
import { ProgressHUDRoot } from '../ProgressHUD/ProgressHUDRoot';
import type { AnswerGameConfig, AnswerGameDraftState } from '../types';
import type { GameSkin } from '@/lib/skin';
import type { ReactNode } from 'react';

interface AnswerGameProps {
  config: AnswerGameConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  /**
   * Optional skin. When provided, `skin.ProgressHUD` (if defined) replaces
   * the default HUD; otherwise the default HUD renders. `skin.tokens` are
   * applied by individual game components on their own game container, not
   * here.
   */
  skin?: GameSkin;
  children: ReactNode;
}

const AnswerGameRoot = ({
  config,
  initialState,
  sessionId,
  skin,
  children,
}: AnswerGameProps) => (
  <AnswerGameProvider
    config={config}
    initialState={initialState}
    sessionId={sessionId}
  >
    <div className="flex min-h-0 w-full flex-col items-center">
      <ProgressHUDRoot skin={skin} />
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
