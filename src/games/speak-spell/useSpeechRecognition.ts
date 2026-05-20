import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSpeechRecognition,
  isSpeechInputAvailable,
} from '@/lib/speech/SpeechInput';

export interface SpeechResult {
  transcript: string;
  alternatives: string[];
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  maxAlternatives?: number;
  timeoutMs?: number;
  onResult?: (result: SpeechResult) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isAvailable: boolean;
  result: SpeechResult | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useSpeechRecognition = ({
  lang = 'en-AU',
  maxAlternatives = 5,
  timeoutMs = 3000,
  onResult,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<SpeechResult | null>(null);
  const recognitionRef = useRef<ReturnType<
    typeof createSpeechRecognition
  > | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    setIsListening(false);
    cleanup();
  }, [cleanup]);

  const start = useCallback(() => {
    setResult(null);
    const recognition = createSpeechRecognition();
    if (!recognition) return;

    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onresult = (ev: unknown) => {
      const event = ev as {
        results: Array<{
          length: number;
          item: (j: number) => { transcript: string };
        }>;
      };
      const resultList = event.results[0];
      if (!resultList) return;

      const alternatives: string[] = [];
      for (let i = 0; i < resultList.length; i++) {
        const alt = resultList.item(i);
        if (alt.transcript) {
          alternatives.push(alt.transcript.trim().toLowerCase());
        }
      }

      const speechResult: SpeechResult = {
        transcript: alternatives[0] ?? '',
        alternatives,
      };
      setResult(speechResult);
      setIsListening(false);
      cleanup();
      onResultRef.current?.(speechResult);
    };

    // eslint-disable-next-line unicorn/prefer-add-event-listener -- SpeechRecognitionLike only exposes .onerror
    recognition.onerror = () => {
      setIsListening(false);
      cleanup();
    };

    recognition.onend = () => {
      setIsListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);

    timeoutRef.current = setTimeout(() => {
      stop();
    }, timeoutMs);
  }, [lang, maxAlternatives, timeoutMs, stop, cleanup]);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isListening,
    isAvailable: isSpeechInputAvailable(),
    result,
    start,
    stop,
    reset,
  };
};
