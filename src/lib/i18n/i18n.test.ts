import { describe, expect, it } from 'vitest';
import { i18n } from './i18n';

describe('i18n', () => {
  it('resolves common:appName for en and pt-BR', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('common:appName')).toBe('BaseSkill');
    await i18n.changeLanguage('pt-BR');
    expect(i18n.t('common:appName')).toBe('BaseSkill');
  });
});
