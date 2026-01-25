/**
 * CubismManager - Cubism SDK 싱글톤 매니저
 *
 * SDK 초기화/정리 및 전역 상태 관리를 담당합니다.
 */

import { CubismFramework, Option, LogLevel } from '@framework/live2dcubismframework';

export class CubismManager {
  private static _instance: CubismManager | null = null;
  private _initialized: boolean = false;

  private constructor() {
    // 싱글톤 패턴 - 외부 인스턴스화 방지
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): CubismManager {
    if (!CubismManager._instance) {
      CubismManager._instance = new CubismManager();
    }
    return CubismManager._instance;
  }

  /**
   * Cubism SDK 초기화
   * 앱 시작 시 한 번만 호출
   */
  public initialize(): boolean {
    if (this._initialized) {
      console.log('[CubismManager] Already initialized');
      return true;
    }

    // Core 스크립트 로드 확인
    if (typeof Live2DCubismCore === 'undefined') {
      console.error('[CubismManager] Live2DCubismCore is not loaded. Check index.html');
      return false;
    }

    // SDK 옵션 설정
    const option = new Option();
    option.logFunction = (message: string) => {
      console.log(`[Cubism] ${message}`);
    };
    option.loggingLevel = LogLevel.LogLevel_Verbose;

    // SDK 시작
    if (!CubismFramework.startUp(option)) {
      console.error('[CubismManager] Failed to start up CubismFramework');
      return false;
    }

    // SDK 초기화
    CubismFramework.initialize();

    this._initialized = true;
    console.log('[CubismManager] Cubism SDK initialized successfully');
    return true;
  }

  /**
   * Cubism SDK 정리
   * 앱 종료 시 호출
   */
  public dispose(): void {
    if (!this._initialized) {
      return;
    }

    CubismFramework.dispose();
    this._initialized = false;
    console.log('[CubismManager] Cubism SDK disposed');
  }

  /**
   * SDK 초기화 상태 확인
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 싱글톤 인스턴스 정리 (테스트용)
   */
  public static releaseInstance(): void {
    if (CubismManager._instance) {
      CubismManager._instance.dispose();
      CubismManager._instance = null;
    }
  }
}
