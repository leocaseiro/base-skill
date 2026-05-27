import { useNavigate } from '@tanstack/react-router';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import type { SpeechResult } from './useSpeechRecognition';
import type {
  WordSpellConfig,
  WordSpellRound,
} from '@/games/word-spell/types';
import { useSeenWordsStore } from '@/db/hooks/useSeenWordsStore';
import { buildRoundOrder } from '@/games/build-round-order';
import { useLibraryRounds } from '@/games/word-spell/useLibraryRounds';
import { isSpeechInputAvailable } from '@/lib/speech/SpeechInput';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';

type RoundResult = 'correct' | 'incorrect' | null;

interface SpeakSpellProps {
  config: WordSpellConfig;
  seed?: string;
}

const FEEDBACK_DELAY_MS = 1500;

const SpeakSpellRound = ({
  round,
  onCorrect,
  ttsEnabled,
}: {
  round: WordSpellRound;
  onCorrect: () => void;
  ttsEnabled: boolean;
}) => {
  const [roundResult, setRoundResult] = useState<RoundResult>(null);
  const [lastResult, setLastResult] = useState<SpeechResult | null>(
    null,
  );
  const targetWord = round.word.trim().toLowerCase();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleSpeechResult = useCallback(
    (speechResult: SpeechResult) => {
      const matched = speechResult.alternatives.some(
        (alt) => alt.toLowerCase() === targetWord,
      );
      setLastResult(speechResult);

      if (matched) {
        setRoundResult('correct');
        feedbackTimerRef.current = setTimeout(
          onCorrect,
          FEEDBACK_DELAY_MS,
        );
      } else {
        setRoundResult('incorrect');
        feedbackTimerRef.current = setTimeout(() => {
          setRoundResult(null);
          setLastResult(null);
        }, FEEDBACK_DELAY_MS);
      }
    },
    [targetWord, onCorrect],
  );

  const { isListening, start, stop, reset } = useSpeechRecognition({
    lang: 'en-AU',
    maxAlternatives: 10,
    timeoutMs: 5000,
    onResult: handleSpeechResult,
  });

  const handleMicClick = () => {
    if (isListening) {
      stop();
    } else {
      cancelSpeech();
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
      setRoundResult(null);
      setLastResult(null);
      reset();
      start();
    }
  };

  const handleSpeak = () => {
    cancelSpeech();
    speak(round.word);
  };

  const hasEmoji = Boolean(round.emoji?.trim());
  const hasImage = Boolean(round.image);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 px-4 py-8">
      <div className="flex flex-col items-center gap-4">
        {hasEmoji ? (
          <button
            type="button"
            onClick={handleSpeak}
            className="rounded-2xl bg-white/80 p-4 shadow-lg active:scale-95"
            aria-label={`${round.word} — tap to hear`}
          >
            <span className="block text-[7rem] leading-none select-none">
              {round.emoji}
            </span>
          </button>
        ) : hasImage ? (
          <button
            type="button"
            onClick={handleSpeak}
            className="overflow-hidden rounded-2xl shadow-lg active:scale-95"
            aria-label={`${round.word} — tap to hear`}
          >
            <img
              src={round.image}
              alt={round.word}
              className="h-40 w-40 object-cover"
            />
          </button>
        ) : null}

        {ttsEnabled ? (
          <button
            type="button"
            onClick={handleSpeak}
            className="flex size-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-md active:scale-95"
            aria-label="Hear the word"
          >
            <Volume2 size={24} />
          </button>
        ) : null}
      </div>

      <p className="text-center text-3xl font-bold tracking-wide text-foreground">
        {round.word}
      </p>

      <button
        type="button"
        onClick={handleMicClick}
        disabled={roundResult === 'correct'}
        className={`flex h-24 w-24 items-center justify-center rounded-full shadow-xl transition-all active:scale-95 ${
          isListening
            ? 'animate-pulse bg-red-500 text-white'
            : roundResult === 'correct'
              ? 'bg-green-500 text-white'
              : roundResult === 'incorrect'
                ? 'bg-orange-400 text-white'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <Mic size={40} /> : <MicOff size={40} />}
      </button>

      <p
        className={`text-center text-lg font-semibold ${
          roundResult === 'correct'
            ? 'text-green-600'
            : roundResult === 'incorrect'
              ? 'text-orange-500'
              : isListening
                ? 'text-red-500'
                : 'text-muted-foreground'
        }`}
      >
        {isListening
          ? 'Listening…'
          : roundResult === 'correct'
            ? 'Correct!'
            : roundResult === 'incorrect'
              ? `Try again! (heard: "${lastResult?.transcript ?? ''}")`
              : 'Tap the microphone and say the word'}
      </p>

      {lastResult && roundResult === 'incorrect' ? (
        <p className="text-center text-xs text-muted-foreground">
          Alternatives: {lastResult.alternatives.join(', ')}
        </p>
      ) : null}
    </div>
  );
};

export const SpeakSpell = ({ config, seed }: SpeakSpellProps) => {
  const navigate = useNavigate();
  const seenWordsStore = useSeenWordsStore();
  const [roundIndex, setRoundIndex] = useState(0);
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const sampleSeed = useMemo(
    () => `${seed}-epoch-${sessionEpoch}`,
    [seed, sessionEpoch],
  );

  const { rounds: resolvedRounds, isLoading } = useLibraryRounds(
    config,
    sampleSeed,
    seenWordsStore,
  );

  const roundOrder = useMemo(() => {
    void sessionEpoch;
    return buildRoundOrder(
      resolvedRounds.length,
      config.roundsInOrder === true,
      seed,
    );
  }, [resolvedRounds.length, config.roundsInOrder, seed, sessionEpoch]);

  const totalRounds = roundOrder.length;
  const configRoundIndex = roundOrder[roundIndex];
  const currentRound =
    configRoundIndex === undefined
      ? undefined
      : resolvedRounds[configRoundIndex];

  const handleCorrect = useCallback(() => {
    if (roundIndex + 1 >= totalRounds) {
      setGameOver(true);
    } else {
      setRoundIndex((i) => i + 1);
    }
  }, [roundIndex, totalRounds]);

  const handlePlayAgain = () => {
    setRoundIndex(0);
    setGameOver(false);
    setSessionEpoch((e) => e + 1);
  };

  const handleHome = () => {
    void navigate({ to: '/$locale', params: { locale: 'en' } });
  };

  if (!isSpeechInputAvailable()) {
    return (
      <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4 text-foreground">
        <MicOff size={48} className="text-muted-foreground" />
        <p className="text-lg font-semibold">
          Speech recognition is not available
        </p>
        <p className="text-sm text-muted-foreground">
          Please use Chrome or Edge for speech recognition support.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-[200px] w-full items-center justify-center text-foreground"
      >
        Loading words…
      </div>
    );
  }

  if (!currentRound && !gameOver) {
    return (
      <div
        role="alert"
        className="flex min-h-[200px] w-full flex-col items-center justify-center gap-2 text-muted-foreground"
      >
        <p>No words matched the current filter.</p>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-6 text-foreground">
        <span className="text-[6rem] leading-none">🎉</span>
        <p className="text-2xl font-bold">Great job!</p>
        <p className="text-muted-foreground">
          You completed all {totalRounds} words!
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handlePlayAgain}
            className="rounded-xl bg-indigo-500 px-6 py-3 text-lg font-semibold text-white shadow-md hover:bg-indigo-600 active:scale-95"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={handleHome}
            className="rounded-xl bg-gray-200 px-6 py-3 text-lg font-semibold text-gray-700 shadow-md hover:bg-gray-300 active:scale-95"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
      <div className="mb-4 text-sm text-muted-foreground">
        {roundIndex + 1} / {totalRounds}
      </div>

      <SpeakSpellRound
        key={`${sessionEpoch}-${roundIndex}`}
        round={currentRound!}
        onCorrect={handleCorrect}
        ttsEnabled={config.ttsEnabled}
      />
    </div>
  );
};
