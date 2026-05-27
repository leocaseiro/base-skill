import { Link } from '@tanstack/react-router';
import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type VoiceUnavailableDialogContextValue = {
  show: (voiceName: string, locale: string) => void;
};

const VoiceUnavailableDialogContext =
  createContext<VoiceUnavailableDialogContextValue | null>(null);

export const useVoiceUnavailableDialog =
  (): VoiceUnavailableDialogContextValue => {
    const ctx = useContext(VoiceUnavailableDialogContext);
    if (!ctx) {
      throw new Error(
        'useVoiceUnavailableDialog must be used inside VoiceUnavailableDialogProvider',
      );
    }
    return ctx;
  };

type DialogState = {
  open: boolean;
  voiceName: string;
  locale: string;
};

type VoiceUnavailableDialogProviderProps = {
  children: React.ReactNode;
};

export const VoiceUnavailableDialogProvider = ({
  children,
}: VoiceUnavailableDialogProviderProps): JSX.Element => {
  const { t } = useTranslation('common');
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    voiceName: '',
    locale: 'en',
  });

  const show = useCallback((voiceName: string, locale: string) => {
    setDialog((prev) =>
      prev.open &&
      prev.voiceName === voiceName &&
      prev.locale === locale
        ? prev
        : { open: true, voiceName, locale },
    );
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setDialog((prev) => ({ ...prev, open }));
  }, []);

  return (
    <VoiceUnavailableDialogContext.Provider value={{ show }}>
      {children}
      <AlertDialog open={dialog.open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('voiceUnavailable.dialogTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('voiceUnavailable.dialogDescription', {
                voice: dialog.voiceName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('voiceUnavailable.dialogCancel')}
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link
                to="/$locale/settings"
                params={{ locale: dialog.locale }}
                target="_blank"
                rel="noreferrer"
              >
                {t('voiceUnavailable.dialogAction')}
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VoiceUnavailableDialogContext.Provider>
  );
};
