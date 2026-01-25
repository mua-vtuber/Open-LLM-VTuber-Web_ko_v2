import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koTranslation from '../../locales/ko/translation.json';
import enTranslation from '../../locales/en/translation.json';
import zhTranslation from '../../locales/zh/translation.json';

const resources = {
  ko: { translation: koTranslation },
  en: { translation: enTranslation },
  zh: { translation: zhTranslation },
};

// 브라우저 언어 감지
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  return ['ko', 'en', 'zh'].includes(browserLang) ? browserLang : 'ko';
};

// 저장된 언어 가져오기
const getSavedLanguage = (): string => {
  try {
    const stored = localStorage.getItem('open-llm-vtuber-storage');
    if (stored) {
      const data = JSON.parse(stored);
      return data?.state?.settings?.system?.language || getBrowserLanguage();
    }
  } catch {
    // 무시
  }
  return getBrowserLanguage();
};

i18n.use(initReactI18next).init({
  resources,
  lng: getSavedLanguage(),
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false, // React에서 XSS 보호함
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

// 언어 변경 함수
export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
};

// 현재 언어 가져오기
export const getCurrentLanguage = () => i18n.language;

// 지원 언어 목록
export const supportedLanguages = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];
