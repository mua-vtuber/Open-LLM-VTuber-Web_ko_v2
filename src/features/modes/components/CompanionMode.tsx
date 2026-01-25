import { isElectron } from '../../../shared/utils';
import { ElectronCompanion } from './companion/ElectronCompanion';
import { WebCompanion } from './companion/WebCompanion';

/**
 * CompanionMode - Electron/Web 분기 라우터
 *
 * Electron 환경에서는 투명 오버레이 + 자동 이동 캐릭터
 * Web 환경에서는 전통적인 플로팅 윈도우 스타일
 */
export function CompanionMode() {
  return isElectron ? <ElectronCompanion /> : <WebCompanion />;
}
