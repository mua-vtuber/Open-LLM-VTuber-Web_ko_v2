import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../shared/i18n';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 앱 전역 프로바이더
 * - i18n
 * - (추후 추가 가능: 테마, 인증 등)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
