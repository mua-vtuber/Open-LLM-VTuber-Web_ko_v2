/**
 * CubismRenderer - WebGL 렌더러
 *
 * Canvas와 WebGL 컨텍스트를 관리하고 렌더 루프를 실행합니다.
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismViewMatrix } from '@framework/math/cubismviewmatrix';
import { CubismModel, MotionPriority } from './CubismModel';
import type { MotionPriorityType } from './CubismModel';

export class CubismRenderer {
  private _canvas: HTMLCanvasElement | null = null;
  private _gl: WebGLRenderingContext | null = null;
  private _model: CubismModel | null = null;
  private _rafId: number | null = null;
  private _lastTime: number = 0;
  private _isRunning: boolean = false;

  private _viewMatrix: CubismViewMatrix;
  private _projectionMatrix: CubismMatrix44;
  private _deviceToScreen: CubismMatrix44;

  // 줌 관련
  private _scale: number = 1.0;
  private _minScale: number = 0.5;
  private _maxScale: number = 3.0;
  private _zoomEnabled: boolean = false;
  private _wheelHandler: ((e: WheelEvent) => void) | null = null;
  private _onScaleChange: ((scale: number) => void) | null = null;

  constructor() {
    this._viewMatrix = new CubismViewMatrix();
    this._projectionMatrix = new CubismMatrix44();
    this._deviceToScreen = new CubismMatrix44();
  }

  /**
   * WebGL 컨텍스트 초기화
   * @param canvas HTML Canvas 요소
   * @returns 초기화 성공 여부
   */
  public initialize(canvas: HTMLCanvasElement): boolean {
    if (!canvas) {
      console.error('[CubismRenderer] Canvas is null');
      return false;
    }

    this._canvas = canvas;

    // WebGL 컨텍스트 획득 (WebGL1 우선)
    const contextOptions: WebGLContextAttributes = {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    };

    this._gl = canvas.getContext('webgl', contextOptions) as WebGLRenderingContext;
    if (!this._gl) {
      this._gl = canvas.getContext('experimental-webgl', contextOptions) as WebGLRenderingContext;
    }

    if (!this._gl) {
      console.error('[CubismRenderer] Failed to get WebGL context');
      return false;
    }

    // WebGL 설정
    this._gl.enable(this._gl.BLEND);
    this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

    // 뷰포트 설정
    this.resize();

    console.log('[CubismRenderer] WebGL context initialized');
    return true;
  }

  /**
   * 캔버스 크기에 맞춰 뷰포트 조정
   */
  public resize(): void {
    if (!this._canvas || !this._gl) return;

    const width = this._canvas.width;
    const height = this._canvas.height;

    // 뷰포트 설정
    this._gl.viewport(0, 0, width, height);

    // 프로젝션 행렬 설정
    const ratio = width / height;
    const left = -ratio;
    const right = ratio;
    const bottom = -1.0;
    const top = 1.0;

    // 뷰 행렬 설정
    this._viewMatrix.setScreenRect(left, right, bottom, top);
    this._viewMatrix.scale(1.0, 1.0);

    // 디바이스 좌표 변환 행렬
    this._deviceToScreen.loadIdentity();
    if (width > height) {
      const screenW = Math.abs(right - left);
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    } else {
      const screenH = Math.abs(top - bottom);
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height);
    }
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    // 프로젝션 행렬 (화면 비율에 맞게)
    this._projectionMatrix.loadIdentity();
    this._projectionMatrix.scale(1.0, width / height);

    // 뷰 행렬 최대 스케일 설정
    this._viewMatrix.setMaxScale(2.0);
    this._viewMatrix.setMinScale(0.8);

    console.log('[CubismRenderer] Viewport resized:', width, 'x', height);
  }

  /**
   * 모델 로드
   * @param modelUrl model3.json URL
   * @returns 로드된 모델
   */
  public async loadModel(modelUrl: string): Promise<CubismModel> {
    if (!this._gl) {
      throw new Error('WebGL context not initialized');
    }

    // 기존 모델 해제
    if (this._model) {
      this._model.release();
      this._model = null;
    }

    // 새 모델 생성 및 로드
    const model = new CubismModel();
    model.setGl(this._gl);
    await model.loadFromUrl(modelUrl);

    this._model = model;
    console.log('[CubismRenderer] Model loaded:', modelUrl);

    return model;
  }

  /**
   * 렌더 루프 시작
   */
  public startRenderLoop(): void {
    if (this._isRunning) return;

    this._isRunning = true;
    this._lastTime = performance.now();

    const render = (currentTime: number) => {
      if (!this._isRunning) return;

      const deltaTime = (currentTime - this._lastTime) / 1000.0;
      this._lastTime = currentTime;

      this.update(deltaTime);
      this.draw();

      this._rafId = requestAnimationFrame(render);
    };

    this._rafId = requestAnimationFrame(render);
    console.log('[CubismRenderer] Render loop started');
  }

  /**
   * 렌더 루프 정지
   */
  public stopRenderLoop(): void {
    if (!this._isRunning) return;

    this._isRunning = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    console.log('[CubismRenderer] Render loop stopped');
  }

  /**
   * 모델 업데이트
   */
  private update(deltaTime: number): void {
    if (!this._model) return;

    this._model.update(deltaTime);
  }

  /**
   * 화면 그리기
   */
  private draw(): void {
    if (!this._gl || !this._model) return;

    // 화면 클리어
    this._gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT);

    // 프로젝션 행렬 계산
    const projection = new CubismMatrix44();
    projection.loadIdentity();

    if (this._canvas) {
      const width = this._canvas.width;
      const height = this._canvas.height;
      projection.scale(1.0, width / height);
    }

    projection.multiplyByMatrix(this._viewMatrix);

    // 모델 그리기
    this._model.draw(projection);
  }

  /**
   * 현재 모델 반환
   */
  public getModel(): CubismModel | null {
    return this._model;
  }

  /**
   * WebGL 컨텍스트 반환
   */
  public getGl(): WebGLRenderingContext | null {
    return this._gl;
  }

  /**
   * Canvas 요소 반환
   */
  public getCanvas(): HTMLCanvasElement | null {
    return this._canvas;
  }

  /**
   * 렌더러가 실행 중인지 확인
   */
  public isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * 표정 설정 (편의 메서드)
   */
  public setExpression(expressionId: string): void {
    if (this._model) {
      this._model.setExpression(expressionId);
    }
  }

  /**
   * 모션 시작 (편의 메서드)
   */
  public async startMotion(
    group: string,
    index: number,
    priority: MotionPriorityType = MotionPriority.Normal
  ): Promise<void> {
    if (this._model) {
      await this._model.startMotion(group, index, priority);
    }
  }

  /**
   * 립싱크 값 설정 (편의 메서드)
   */
  public setLipSyncValue(value: number): void {
    if (this._model) {
      this._model.setLipSyncValue(value);
    }
  }

  /**
   * 시선 방향 설정 (마우스 트래킹)
   * @param x X 좌표 (-1.0 ~ 1.0)
   * @param y Y 좌표 (-1.0 ~ 1.0)
   */
  public setLookAt(x: number, y: number): void {
    if (this._model) {
      this._model.setLookAt(x, y);
    }
  }

  /**
   * 이동 방향 기울기 설정 (캐릭터 움직임 효과)
   * @param x X 방향 (-1.0 ~ 1.0, 왼쪽/오른쪽)
   * @param y Y 방향 (-1.0 ~ 1.0, 위/아래)
   * @param intensity 강도 (0.0 ~ 1.0, 속도에 비례)
   * @param isMoving 현재 이동 중인지 여부
   */
  public setMovementTilt(x: number, y: number, intensity: number, isMoving: boolean): void {
    if (this._model) {
      this._model.setMovementTilt(x, y, intensity, isMoving);
    }
  }

  /**
   * 줌 활성화/비활성화
   */
  public setZoomEnabled(enabled: boolean): void {
    if (this._zoomEnabled === enabled) return;
    this._zoomEnabled = enabled;

    if (enabled) {
      this._attachWheelHandler();
    } else {
      this._detachWheelHandler();
    }

    console.log('[CubismRenderer] Zoom enabled:', enabled);
  }

  /**
   * 줌 활성화 여부 반환
   */
  public isZoomEnabled(): boolean {
    return this._zoomEnabled;
  }

  /**
   * 현재 스케일 반환
   */
  public getScale(): number {
    return this._scale;
  }

  /**
   * 스케일 설정
   */
  public setScale(scale: number): void {
    this._scale = Math.max(this._minScale, Math.min(this._maxScale, scale));
    this._updateViewMatrix();
  }

  /**
   * 스케일 범위 설정
   */
  public setScaleRange(min: number, max: number): void {
    this._minScale = min;
    this._maxScale = max;
    // 현재 스케일이 범위를 벗어나면 조정
    this._scale = Math.max(this._minScale, Math.min(this._maxScale, this._scale));
    this._updateViewMatrix();
  }

  /**
   * 휠 이벤트 핸들러 연결
   */
  private _attachWheelHandler(): void {
    if (!this._canvas || this._wheelHandler) return;

    this._wheelHandler = (e: WheelEvent) => {
      e.preventDefault();

      // 줌 계산 (휠 위로: 확대, 아래로: 축소)
      const zoomSpeed = 0.001;
      const delta = -e.deltaY * zoomSpeed;
      const newScale = this._scale * (1 + delta);

      this.setScale(newScale);

      // 콜백 호출 (Store 연동용)
      this._onScaleChange?.(this._scale);
    };

    this._canvas.addEventListener('wheel', this._wheelHandler, { passive: false });
  }

  /**
   * 휠 이벤트 핸들러 해제
   */
  private _detachWheelHandler(): void {
    if (!this._canvas || !this._wheelHandler) return;

    this._canvas.removeEventListener('wheel', this._wheelHandler);
    this._wheelHandler = null;
  }

  /**
   * 뷰 매트릭스 업데이트 (스케일 적용)
   */
  private _updateViewMatrix(): void {
    if (!this._canvas) return;

    const width = this._canvas.width;
    const height = this._canvas.height;
    const ratio = width / height;

    const left = -ratio;
    const right = ratio;
    const bottom = -1.0;
    const top = 1.0;

    this._viewMatrix.setScreenRect(left, right, bottom, top);
    this._viewMatrix.scale(this._scale, this._scale);
  }

  /**
   * 스케일 변경 콜백 설정
   * @param callback 스케일 변경 시 호출될 콜백 함수
   */
  public setOnScaleChange(callback: ((scale: number) => void) | null): void {
    this._onScaleChange = callback;
  }

  /**
   * 모델 위치 설정
   * @param x X 좌표 (정규화된 좌표, 화면 비율에 따라 -ratio ~ ratio)
   * @param y Y 좌표 (정규화된 좌표, -1.0 ~ 1.0)
   */
  public setModelPosition(x: number, y: number): void {
    if (this._model) {
      const matrix = this._model.getModelMatrix();
      if (matrix) {
        matrix.setCenterPosition(x, y);
      }
    }
  }

  /**
   * 모델 위치 조회
   * @returns 현재 모델 위치 또는 null
   */
  public getModelPosition(): { x: number; y: number } | null {
    if (this._model) {
      const matrix = this._model.getModelMatrix();
      if (matrix) {
        return { x: matrix.getTranslateX(), y: matrix.getTranslateY() };
      }
    }
    return null;
  }

  /**
   * 리소스 해제
   */
  public dispose(): void {
    this.stopRenderLoop();
    this._detachWheelHandler();

    if (this._model) {
      this._model.release();
      this._model = null;
    }

    this._gl = null;
    this._canvas = null;

    console.log('[CubismRenderer] Disposed');
  }
}
