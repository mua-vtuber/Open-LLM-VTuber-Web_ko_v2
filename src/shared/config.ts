/**
 * 앱 전역 설정 및 환경 변수 관리 유틸리티
 */

// Vite 환경 변수 타입 정의
interface ImportMetaEnv {
  readonly VITE_API_HOST?: string;
  readonly VITE_API_PORT?: string;
  readonly VITE_DEFAULT_LANGUAGE?: string;
}

const env = (import.meta.env as unknown as ImportMetaEnv) || {};

/**
 * 서버 호스트 결정
 * 1. 환경 변수 VITE_API_HOST
 * 2. 현재 브라우저의 hostname
 */
const DEFAULT_HOST = env.VITE_API_HOST || window.location.hostname || 'localhost';

/**
 * 서버 포트 결정
 * 1. 환경 변수 VITE_API_PORT
 * 2. 현재 브라우저의 port (없으면 기본값 12393)
 */
const DEFAULT_PORT = env.VITE_API_PORT || window.location.port || '12393';

export const CONFIG = {
  host: DEFAULT_HOST,
  port: DEFAULT_PORT,

  /** API 기본 URL (http://host:port) */
  get apiUrl() {
    // 포트가 없거나 표준 포트(80, 443)인 경우 생략 가능하지만,
    // 이 프로젝트의 백엔드는 기본적으로 커스텀 포트를 사용하므로 명시적으로 결합
    const portSuffix = this.port ? `:${this.port}` : '';
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    
    // 개발 환경에서 5173(Vite) 등으로 접속 중인 경우, 백엔드 기본 포트인 12393 사용 유도
    if (window.location.port === '5173' && !env.VITE_API_PORT) {
      return `${protocol}//${this.host}:12393`;
    }
    
    return `${protocol}//${this.host}${portSuffix}`;
  },

  /** WebSocket 기본 URL (ws://host:port/client-ws) */
  get wsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const portSuffix = this.port ? `:${this.port}` : '';
    
    if (window.location.port === '5173' && !env.VITE_API_PORT) {
      return `${protocol}//${this.host}:12393/client-ws`;
    }

    return `${protocol}//${this.host}${portSuffix}/client-ws`;
  },

  /** 기본 언어 설정 */
  defaultLanguage: env.VITE_DEFAULT_LANGUAGE || 'ko',
};

export default CONFIG;
