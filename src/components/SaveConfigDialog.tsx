import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type SaveConfigDialogProps = {
  open: boolean;
  suggestedName: string;
  existingNames: string[];
  onSave: (name: string) => void;
  onCancel: () => void;
};

export const SaveConfigDialog = ({
  open,
  suggestedName,
  existingNames,
  onSave,
  onCancel,
}: SaveConfigDialogProps) => {
  const { t } = useTranslation('common');
  const [name, setName] = useState(suggestedName);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('saveConfig.errorEmpty'));
      return;
    }
    if (existingNames.includes(trimmed)) {
      setError(t('saveConfig.errorDuplicate', { name: trimmed }));
      return;
    }
    onSave(trimmed);
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('saveConfig.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={t('saveConfig.placeholder')}
            aria-label={t('saveConfig.nameLabel')}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('saveConfig.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('saveConfig.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
