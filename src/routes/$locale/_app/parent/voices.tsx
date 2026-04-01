import { createFileRoute } from '@tanstack/react-router';

const VoiceSelector = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">TTS Voice Selector</h1>
    <p className="mt-2 text-muted-foreground">
      Choose text-to-speech voices for each learner.
    </p>
  </div>
);

export const Route = createFileRoute('/$locale/_app/parent/voices')({
  component: VoiceSelector,
});
