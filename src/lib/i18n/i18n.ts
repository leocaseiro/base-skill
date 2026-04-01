import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enEncouragements from './locales/en/encouragements.json';
import enGames from './locales/en/games.json';
import enSettings from './locales/en/settings.json';
import ptCommon from './locales/pt-BR/common.json';
import ptEncouragements from './locales/pt-BR/encouragements.json';
import ptGames from './locales/pt-BR/games.json';
import ptSettings from './locales/pt-BR/settings.json';

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      common: enCommon,
      games: enGames,
      settings: enSettings,
      encouragements: enEncouragements,
    },
    'pt-BR': {
      common: ptCommon,
      games: ptGames,
      settings: ptSettings,
      encouragements: ptEncouragements,
    },
  },
});

export default i18n;
