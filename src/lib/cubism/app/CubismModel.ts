/**
 * CubismModel - Live2D 모델 클래스
 *
 * CubismUserModel을 확장하여 모델 로드, 업데이트, 렌더링을 담당합니다.
 */

import { CubismUserModel } from '@framework/model/cubismusermodel';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';
import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismEyeBlink } from '@framework/effect/cubismeyeblink';
import { CubismBreath, BreathParameterData } from '@framework/effect/cubismbreath';
import { csmVector } from '@framework/type/csmvector';
import { csmMap } from '@framework/type/csmmap';
import { ACubismMotion } from '@framework/motion/acubismmotion';
import type { FinishedMotionCallback } from '@framework/motion/acubismmotion';
import { CubismFramework } from '@framework/live2dcubismframework';
import { CubismDefaultParameterId } from '@framework/cubismdefaultparameterid';
import { CubismTextureManager } from './CubismTextureManager';

// 모션 우선순위
export const MotionPriority = {
  None: 0,
  Idle: 1,
  Normal: 2,
  Force: 3,
} as const;

export type MotionPriorityType = (typeof MotionPriority)[keyof typeof MotionPriority];

export class CubismModel extends CubismUserModel {
  private _modelSetting: ICubismModelSetting | null = null;
  private _modelHomeDir: string = '';
  private _motions: csmMap<string, ACubismMotion> = new csmMap();
  private _expressions: csmMap<string, ACubismMotion> = new csmMap();
  private _textureManager: CubismTextureManager;
  private _gl: WebGLRenderingContext | null = null;
  private _idParamAngleX: number = -1;
  private _idParamAngleY: number = -1;
  private _idParamAngleZ: number = -1;
  private _idParamBodyAngleX: number = -1;
  private _idParamEyeBallX: number = -1;
  private _idParamEyeBallY: number = -1;

  // 마우스 트래킹 시선 값
  private _lookAtX: number = 0;
  private _lookAtY: number = 0;

  // 이동 기울기 값
  private _movementTiltX: number = 0;
  private _movementTiltY: number = 0;
  private _movementIntensity: number = 0;
  private _isMoving: boolean = false;

  // 현재 적용 중인 기울기 (부드러운 전환용)
  private _currentTiltX: number = 0;
  private _currentTiltY: number = 0;

  constructor() {
    super();
    this._textureManager = new CubismTextureManager();
  }

  /**
   * WebGL 컨텍스트 설정
   */
  public setGl(gl: WebGLRenderingContext): void {
    this._gl = gl;
    this._textureManager.setGl(gl);
  }

  /**
   * 모델 로드 (URL에서)
   * @param modelUrl model3.json URL
   */
  public async loadFromUrl(modelUrl: string): Promise<void> {
    // 모델 디렉토리 경로 추출
    const lastSlash = modelUrl.lastIndexOf('/');
    this._modelHomeDir = modelUrl.substring(0, lastSlash + 1);
    const modelFileName = modelUrl.substring(lastSlash + 1);

    console.log('[CubismModel] Loading model from:', modelUrl);
    console.log('[CubismModel] Model home dir:', this._modelHomeDir);

    // model3.json 로드
    const response = await fetch(modelUrl);
    const arrayBuffer = await response.arrayBuffer();

    // 모델 설정 파싱
    this._modelSetting = new CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength);

    // 각 에셋 로드
    await this.setupModel();

    // 파라미터 ID 설정
    this.setupParameterIds();

    console.log('[CubismModel] Model loaded successfully');
  }

  /**
   * 모델 에셋 설정
   */
  private async setupModel(): Promise<void> {
    if (!this._modelSetting) return;

    // MOC 파일 로드
    const mocFileName = this._modelSetting.getModelFileName();
    if (mocFileName) {
      await this.loadMocFile(mocFileName);
    }

    // 텍스처 로드
    const textureCount = this._modelSetting.getTextureCount();
    for (let i = 0; i < textureCount; i++) {
      const texturePath = this._modelSetting.getTextureFileName(i);
      if (texturePath) {
        await this.loadTexture(i, texturePath);
      }
    }

    // 표정 로드
    const expressionCount = this._modelSetting.getExpressionCount();
    for (let i = 0; i < expressionCount; i++) {
      const expressionName = this._modelSetting.getExpressionName(i);
      const expressionPath = this._modelSetting.getExpressionFileName(i);
      if (expressionPath) {
        await this.loadExpressionFile(expressionName, expressionPath);
      }
    }

    // 물리 연산 로드
    const physicsPath = this._modelSetting.getPhysicsFileName();
    if (physicsPath) {
      await this.loadPhysicsFile(physicsPath);
    }

    // 포즈 로드
    const posePath = this._modelSetting.getPoseFileName();
    if (posePath) {
      await this.loadPoseFile(posePath);
    }

    // 눈 깜빡임 설정
    this.setupEyeBlink();

    // 호흡 설정
    this.setupBreath();

    // 레이아웃 설정
    this.setupLayout();

    // 유저 데이터 로드
    const userDataPath = this._modelSetting.getUserDataFile();
    if (userDataPath) {
      await this.loadUserDataFile(userDataPath);
    }

    // 모션 프리로드 (Idle 그룹만)
    await this.preloadMotionGroup('Idle');

    // 렌더러 생성
    this.createRenderer();
    if (this._gl) {
      this.getRenderer().startUp(this._gl);
    }

    // 텍스처 바인딩
    this.bindTextures();

    this.setInitialized(true);
  }

  /**
   * MOC 파일 로드
   */
  private async loadMocFile(fileName: string): Promise<void> {
    const url = this._modelHomeDir + fileName;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    this.loadModel(buffer, this._mocConsistency);
  }

  /**
   * 텍스처 로드
   */
  private async loadTexture(index: number, fileName: string): Promise<void> {
    const url = this._modelHomeDir + fileName;
    await this._textureManager.createTextureFromUrl(url, true);
  }

  /**
   * 표정 파일 로드
   */
  private async loadExpressionFile(name: string, fileName: string): Promise<void> {
    const url = this._modelHomeDir + fileName;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const motion = this.loadExpression(buffer, buffer.byteLength, name);
    if (motion) {
      this._expressions.setValue(name, motion);
    }
  }

  /**
   * 물리 연산 파일 로드
   */
  private async loadPhysicsFile(fileName: string): Promise<void> {
    const url = this._modelHomeDir + fileName;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    this.loadPhysics(buffer, buffer.byteLength);
  }

  /**
   * 포즈 파일 로드
   */
  private async loadPoseFile(fileName: string): Promise<void> {
    const url = this._modelHomeDir + fileName;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    this.loadPose(buffer, buffer.byteLength);
  }

  /**
   * 유저 데이터 파일 로드
   */
  private async loadUserDataFile(fileName: string): Promise<void> {
    const url = this._modelHomeDir + fileName;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    this.loadUserData(buffer, buffer.byteLength);
  }

  /**
   * 눈 깜빡임 설정
   */
  private setupEyeBlink(): void {
    if (!this._modelSetting) return;

    const eyeBlinkCount = this._modelSetting.getEyeBlinkParameterCount();
    if (eyeBlinkCount > 0) {
      this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
    }
  }

  /**
   * 호흡 설정
   */
  private setupBreath(): void {
    this._breath = CubismBreath.create();

    const breathParameters: csmVector<BreathParameterData> = new csmVector();
    breathParameters.pushBack(
      new BreathParameterData(
        CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleX),
        0.0,
        15.0,
        6.5345,
        0.5
      )
    );
    breathParameters.pushBack(
      new BreathParameterData(
        CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleY),
        0.0,
        8.0,
        3.5345,
        0.5
      )
    );
    breathParameters.pushBack(
      new BreathParameterData(
        CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleZ),
        0.0,
        10.0,
        5.5345,
        0.5
      )
    );
    breathParameters.pushBack(
      new BreathParameterData(
        CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBodyAngleX),
        0.0,
        4.0,
        15.5345,
        0.5
      )
    );
    breathParameters.pushBack(
      new BreathParameterData(
        CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath),
        0.5,
        0.5,
        3.2345,
        0.5
      )
    );

    this._breath.setParameters(breathParameters);
  }

  /**
   * 레이아웃 설정
   */
  private setupLayout(): void {
    if (!this._modelSetting) return;

    const layout = new csmMap<string, number>();
    if (this._modelSetting.getLayoutMap(layout)) {
      this._modelMatrix.setupFromLayout(layout);
    }
  }

  /**
   * 파라미터 ID 설정
   * 모델마다 파라미터 이름이 다를 수 있어서 키워드 기반으로 자동 탐색
   */
  private setupParameterIds(): void {
    // 모델의 모든 파라미터를 가져옴
    const allParams = this.getAllParameterNames();

    // 키워드 기반으로 파라미터 찾기
    this._idParamAngleX = this.findParamByKeywords(allParams, ['angle'], ['x'], ['y', 'z']);
    this._idParamAngleY = this.findParamByKeywords(allParams, ['angle'], ['y'], ['x', 'z']);
    this._idParamAngleZ = this.findParamByKeywords(allParams, ['angle'], ['z'], ['x', 'y']);
    this._idParamBodyAngleX = this.findParamByKeywords(allParams, ['body', 'angle'], ['x'], []);
    this._idParamEyeBallX = this.findParamByKeywords(allParams, ['eye', 'ball'], ['x'], ['y']);
    this._idParamEyeBallY = this.findParamByKeywords(allParams, ['eye', 'ball'], ['y'], ['x']);

    // 디버그: 모델 파라미터 정보 출력
    this.logModelParameters();
  }

  /**
   * 모델의 모든 파라미터 이름을 가져옴
   */
  private getAllParameterNames(): { name: string; index: number }[] {
    if (!this._model) return [];

    const params: { name: string; index: number }[] = [];
    const paramCount = this._model.getParameterCount();

    for (let i = 0; i < paramCount; i++) {
      const paramId = this._model.getParameterId(i);
      if (paramId) {
        params.push({ name: paramId.getString().s, index: i });
      }
    }
    return params;
  }

  /**
   * 키워드 기반으로 파라미터 인덱스 찾기
   * @param params 모든 파라미터 목록
   * @param mustInclude 반드시 포함해야 하는 키워드들 (AND 조건)
   * @param shouldInclude 포함해야 하는 키워드들 (OR 조건)
   * @param mustExclude 포함하면 안되는 키워드들
   */
  private findParamByKeywords(
    params: { name: string; index: number }[],
    mustInclude: string[],
    shouldInclude: string[],
    mustExclude: string[]
  ): number {
    for (const param of params) {
      const nameLower = param.name.toLowerCase().replace(/[_-]/g, '');

      // mustInclude 키워드가 모두 포함되어야 함
      const hasAllMust = mustInclude.every((kw) => nameLower.includes(kw.toLowerCase()));
      if (!hasAllMust) continue;

      // shouldInclude 키워드 중 하나 이상 포함되어야 함
      const hasAnyShouldInclude = shouldInclude.some((kw) => nameLower.includes(kw.toLowerCase()));
      if (!hasAnyShouldInclude) continue;

      // mustExclude 키워드가 포함되면 안됨
      const hasAnyExclude = mustExclude.some((kw) => nameLower.includes(kw.toLowerCase()));
      if (hasAnyExclude) continue;

      return param.index;
    }
    return -1;
  }

  /**
   * 모델 파라미터 정보를 콘솔에 출력 (디버그용)
   */
  private logModelParameters(): void {
    if (!this._model) return;

    const paramCount = this._model.getParameterCount();
    const params: string[] = [];

    for (let i = 0; i < paramCount; i++) {
      const paramId = this._model.getParameterId(i);
      if (paramId) {
        params.push(paramId.getString().s);
      }
    }

    console.log('[CubismModel] 모델 파라미터 목록 (' + paramCount + '개):');
    console.log(params);

    // 마우스 트래킹 관련 파라미터 확인
    console.log('[CubismModel] 마우스 트래킹 파라미터 인덱스:');
    console.log('  ParamAngleX:', this._idParamAngleX);
    console.log('  ParamAngleY:', this._idParamAngleY);
    console.log('  ParamAngleZ:', this._idParamAngleZ);
    console.log('  ParamBodyAngleX:', this._idParamBodyAngleX);
    console.log('  ParamEyeBallX:', this._idParamEyeBallX);
    console.log('  ParamEyeBallY:', this._idParamEyeBallY);

    // -1이면 해당 파라미터가 모델에 없음
    if (this._idParamAngleX < 0 && this._idParamEyeBallX < 0) {
      console.warn('[CubismModel] ⚠️ 이 모델은 마우스 트래킹 파라미터가 없습니다!');
    }
  }

  /**
   * 텍스처 바인딩
   */
  private bindTextures(): void {
    const textureCount = this._textureManager.getTextureCount();
    for (let i = 0; i < textureCount; i++) {
      const textureInfo = this._textureManager.getTextureInfo(i);
      if (textureInfo) {
        this.getRenderer().bindTexture(i, textureInfo.id);
      }
    }
    this.getRenderer().setIsPremultipliedAlpha(true);
  }

  /**
   * 모션 그룹 프리로드
   */
  public async preloadMotionGroup(group: string): Promise<void> {
    if (!this._modelSetting) return;

    const count = this._modelSetting.getMotionCount(group);
    for (let i = 0; i < count; i++) {
      const motionPath = this._modelSetting.getMotionFileName(group, i);
      if (motionPath) {
        const name = `${group}_${i}`;
        await this.loadMotionFile(name, motionPath, group, i);
      }
    }
  }

  /**
   * 모션 파일 로드
   */
  private async loadMotionFile(
    name: string,
    fileName: string,
    group: string,
    index: number
  ): Promise<ACubismMotion | null> {
    const url = this._modelHomeDir + fileName;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    const motion = this.loadMotion(
      buffer,
      buffer.byteLength,
      name,
      undefined,
      undefined,
      this._modelSetting || undefined,
      group,
      index
    );

    if (motion) {
      this._motions.setValue(name, motion);
    }

    return motion;
  }

  /**
   * 모델 업데이트
   * @param deltaTime 경과 시간 (초)
   */
  public update(deltaTime: number): void {
    if (!this._model) return;

    this._model.loadParameters();

    // 모션 업데이트
    const motionUpdated = this._motionManager.updateMotion(this._model, deltaTime);

    // 표정 업데이트
    this._expressionManager.updateMotion(this._model, deltaTime);

    this._model.saveParameters();

    // 눈 깜빡임
    if (this._eyeBlink) {
      this._eyeBlink.updateParameters(this._model, deltaTime);
    }

    // 호흡
    if (this._breath) {
      this._breath.updateParameters(this._model, deltaTime);
    }

    // 시선 방향 (마우스 트래킹) - 호흡 효과 후에 적용
    this.applyLookAt();

    // 물리 연산
    if (this._physics) {
      this._physics.evaluate(this._model, deltaTime);
    }

    // 포즈
    if (this._pose) {
      this._pose.updateParameters(this._model, deltaTime);
    }

    this._model.update();
  }

  /**
   * 모델 렌더링
   * @param matrix 프로젝션 행렬
   */
  public draw(matrix: CubismMatrix44): void {
    if (!this._model || !this.getRenderer() || !this._gl) return;

    const projectionMatrix = matrix;
    projectionMatrix.multiplyByMatrix(this._modelMatrix);

    this.getRenderer().setMvpMatrix(projectionMatrix);

    // 클리핑 마스크를 위한 렌더 상태 설정
    // 현재 프레임버퍼와 뷰포트를 저장하여 클리핑 마스크 처리 후 복원할 수 있도록 함
    const viewport: number[] = this._gl.getParameter(this._gl.VIEWPORT);
    const fbo: WebGLFramebuffer = this._gl.getParameter(this._gl.FRAMEBUFFER_BINDING);
    this.getRenderer().setRenderState(fbo, viewport);

    this.getRenderer().drawModel();
  }

  /**
   * 표정 설정
   * @param expressionId 표정 ID
   */
  public setExpression(expressionId: string): void {
    const motion = this._expressions.getValue(expressionId);
    if (motion) {
      this._expressionManager.startMotionPriority(motion, false, MotionPriority.Force);
      console.log('[CubismModel] Set expression:', expressionId);
    } else {
      console.warn('[CubismModel] Expression not found:', expressionId);
    }
  }

  /**
   * 랜덤 표정 설정
   */
  public setRandomExpression(): void {
    const count = this._expressions.getSize();
    if (count === 0) return;

    const index = Math.floor(Math.random() * count);
    let i = 0;
    for (
      const iter = this._expressions.begin();
      iter.notEqual(this._expressions.end());
      iter.preIncrement()
    ) {
      if (i === index) {
        this.setExpression(iter.ptr().first);
        break;
      }
      i++;
    }
  }

  /**
   * 모션 시작
   * @param group 모션 그룹
   * @param index 모션 인덱스
   * @param priority 우선순위
   * @param onFinished 완료 콜백
   */
  public async startMotion(
    group: string,
    index: number,
    priority: MotionPriorityType,
    onFinished?: FinishedMotionCallback
  ): Promise<void> {
    const name = `${group}_${index}`;

    // 모션이 없으면 로드
    let motion = this._motions.getValue(name);
    if (!motion && this._modelSetting) {
      const motionPath = this._modelSetting.getMotionFileName(group, index);
      if (motionPath) {
        motion = await this.loadMotionFile(name, motionPath, group, index);
      }
    }

    if (motion) {
      this._motionManager.startMotionPriority(motion, false, priority);
      console.log('[CubismModel] Start motion:', name);
    }
  }

  /**
   * 랜덤 모션 시작
   * @param group 모션 그룹
   * @param priority 우선순위
   */
  public async startRandomMotion(
    group: string,
    priority: MotionPriorityType
  ): Promise<void> {
    if (!this._modelSetting) return;

    const count = this._modelSetting.getMotionCount(group);
    if (count === 0) return;

    const index = Math.floor(Math.random() * count);
    await this.startMotion(group, index, priority);
  }

  /**
   * 립싱크 값 설정
   * @param value 립싱크 값 (0.0 ~ 1.0)
   */
  public setLipSyncValue(value: number): void {
    this._lastLipSyncValue = value;

    if (!this._model || !this._modelSetting) return;

    const count = this._modelSetting.getLipSyncParameterCount();
    for (let i = 0; i < count; i++) {
      const parameterId = this._modelSetting.getLipSyncParameterId(i);
      if (parameterId) {
        this._model.addParameterValueById(parameterId, value, 0.8);
      }
    }
  }

  /**
   * 시선 방향 설정 (마우스 트래킹)
   * @param x X 좌표 (-1.0 ~ 1.0, 왼쪽에서 오른쪽)
   * @param y Y 좌표 (-1.0 ~ 1.0, 아래에서 위)
   */
  public setLookAt(x: number, y: number): void {
    // 값을 -1 ~ 1 범위로 클램프하고 저장 (update()에서 적용됨)
    this._lookAtX = Math.max(-1, Math.min(1, x));
    this._lookAtY = Math.max(-1, Math.min(1, y));
  }

  /**
   * 이동 기울기 설정 (캐릭터 이동 방향)
   * @param x X 방향 (-1.0 ~ 1.0)
   * @param y Y 방향 (-1.0 ~ 1.0)
   * @param intensity 기울기 강도 (0.0 ~ 1.0)
   * @param isMoving 현재 이동 중인지
   */
  public setMovementTilt(x: number, y: number, intensity: number, isMoving: boolean): void {
    // 이전 상태와 다를 때만 로그 (과도한 로그 방지)
    if (this._isMoving !== isMoving) {
      console.log(`[CubismModel] 이동 기울기: isMoving=${isMoving}, direction=(${x.toFixed(2)}, ${y.toFixed(2)}), intensity=${intensity.toFixed(2)}`);
    }
    this._movementTiltX = Math.max(-1, Math.min(1, x));
    this._movementTiltY = Math.max(-1, Math.min(1, y));
    this._movementIntensity = Math.max(0, Math.min(1, intensity));
    this._isMoving = isMoving;
  }

  /**
   * 시선/기울기 파라미터 적용 (update() 내부에서 호출)
   * - 이동 중: 이동 방향으로 기울기 (얼굴+몸+눈 모두)
   * - 멈춤: 마우스 트래킹으로 부드럽게 복귀
   */
  private applyLookAt(): void {
    if (!this._model) return;

    // 목표 기울기 결정
    let targetX: number;
    let targetY: number;

    if (this._isMoving && this._movementIntensity > 0) {
      // 이동 중: 이동 방향 사용
      targetX = this._movementTiltX * this._movementIntensity;
      targetY = this._movementTiltY * this._movementIntensity * 0.5; // Y축은 약하게
    } else {
      // 멈춤: 마우스 트래킹 사용
      targetX = this._lookAtX;
      targetY = this._lookAtY;
    }

    // 부드러운 전환 (lerp)
    // 이동→멈춤: 느리게 (0.03), 멈춤→이동: 빠르게 (0.15)
    const lerpSpeed = this._isMoving ? 0.15 : 0.03;
    this._currentTiltX += (targetX - this._currentTiltX) * lerpSpeed;
    this._currentTiltY += (targetY - this._currentTiltY) * lerpSpeed;

    const x = this._currentTiltX;
    const y = this._currentTiltY;

    // 얼굴 각도 설정 (30도 범위)
    if (this._idParamAngleX >= 0) {
      this._model.addParameterValueByIndex(this._idParamAngleX, x * 30, 0.5);
    }
    if (this._idParamAngleY >= 0) {
      this._model.addParameterValueByIndex(this._idParamAngleY, y * 30, 0.5);
    }

    // 눈동자 움직임 설정
    if (this._idParamEyeBallX >= 0) {
      this._model.setParameterValueByIndex(this._idParamEyeBallX, x);
    }
    if (this._idParamEyeBallY >= 0) {
      this._model.setParameterValueByIndex(this._idParamEyeBallY, y);
    }

    // 몸통 각도 (얼굴 각도의 1/3)
    if (this._idParamBodyAngleX >= 0) {
      this._model.addParameterValueByIndex(this._idParamBodyAngleX, x * 10, 0.5);
    }
  }

  /**
   * 사용 가능한 표정 목록 반환
   */
  public getExpressionNames(): string[] {
    const names: string[] = [];
    for (
      const iter = this._expressions.begin();
      iter.notEqual(this._expressions.end());
      iter.preIncrement()
    ) {
      names.push(iter.ptr().first);
    }
    return names;
  }

  /**
   * 사용 가능한 모션 그룹 목록 반환
   */
  public getMotionGroupNames(): string[] {
    if (!this._modelSetting) return [];

    const groupCount = this._modelSetting.getMotionGroupCount();
    const names: string[] = [];
    for (let i = 0; i < groupCount; i++) {
      names.push(this._modelSetting.getMotionGroupName(i));
    }
    return names;
  }

  /**
   * 모델 너비 반환
   */
  public getModelWidth(): number {
    return this._model ? this._model.getCanvasWidth() : 0;
  }

  /**
   * 모델 높이 반환
   */
  public getModelHeight(): number {
    return this._model ? this._model.getCanvasHeight() : 0;
  }

  /**
   * 리소스 해제
   */
  public override release(): void {
    // 모션 해제
    for (
      const iter = this._motions.begin();
      iter.notEqual(this._motions.end());
      iter.preIncrement()
    ) {
      ACubismMotion.delete(iter.ptr().second);
    }
    this._motions.clear();

    // 표정 해제
    for (
      const iter = this._expressions.begin();
      iter.notEqual(this._expressions.end());
      iter.preIncrement()
    ) {
      ACubismMotion.delete(iter.ptr().second);
    }
    this._expressions.clear();

    // 텍스처 해제
    this._textureManager.dispose();

    // 모델 설정 해제
    if (this._modelSetting) {
      (this._modelSetting as CubismModelSettingJson).release();
      this._modelSetting = null;
    }

    // 부모 클래스 해제
    super.release();
  }
}
