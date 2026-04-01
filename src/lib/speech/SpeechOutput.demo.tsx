import { useState } from 'react';
import {
  cancelSpeech,
  isSpeechOutputAvailable,
  speak,
} from './SpeechOutput';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';

export const SpeechOutputDemo = () => {
  const [text, setText] = useState('Hello, world!');

  if (!isSpeechOutputAvailable()) {
    return (
      <p className="text-muted-foreground text-sm">
        Speech synthesis is not available in this browser.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Text to speak"
        aria-label="Text to speak"
      />
      <div className="flex gap-2">
        <Button onClick={() => speak(text)}>Speak</Button>
        <Button variant="outline" onClick={cancelSpeech}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
