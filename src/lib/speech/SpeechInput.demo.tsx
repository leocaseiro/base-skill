import { useState } from 'react';
import {
  createSpeechRecognition,
  isSpeechInputAvailable,
} from './SpeechInput';
import { Button } from '#/components/ui/button';

export const SpeechInputDemo = () => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);

  if (!isSpeechInputAvailable()) {
    return (
      <p className="text-muted-foreground text-sm">
        Speech recognition is not available in this browser.
      </p>
    );
  }

  const start = () => {
    const recognition = createSpeechRecognition();
    if (!recognition) return;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (ev) => {
      const list = (
        ev as { results: ArrayLike<{ 0?: { transcript: string } }> }
      ).results;
      const result = list[0]?.[0];
      if (result) setTranscript(result.transcript);
    };
    recognition.onend = () => setListening(false);
    /* Web Speech API uses event-handler properties, not DOM addEventListener. */
    // eslint-disable-next-line unicorn/prefer-add-event-listener -- SpeechRecognition API
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <Button onClick={start} disabled={listening}>
        {listening ? 'Listening…' : 'Start listening'}
      </Button>
      {transcript && (
        <p className="rounded border p-2 text-sm">
          <strong>Heard:</strong> {transcript}
        </p>
      )}
    </div>
  );
};
