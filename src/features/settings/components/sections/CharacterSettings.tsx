import { useTranslation } from 'react-i18next';
import { FolderPlus, RefreshCw, X, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../../../shared/store';
import { Button, Input, Switch, Slider, Select } from '../../../../shared/components';
import type { MovementMode } from '../../../../shared/types';
import { useModelList } from '../../hooks';

const positionOptions = [
  { value: 'center', label: 'Center' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const movementModeOptions = [
  { value: 'disabled', label: 'Disabled' },
  { value: 'free', label: 'Free' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
];

export function CharacterSettings() {
  const { t } = useTranslation();

  const modelUrl = useAppStore((state) => state.character.model.modelUrl);
  const scale = useAppStore((state) => state.character.model.scale);
  const position = useAppStore((state) => state.character.model.position);
  const lipSyncEnabled = useAppStore((state) => state.settings.character.lipSyncEnabled);
  const eyeBlinkEnabled = useAppStore((state) => state.settings.character.eyeBlinkEnabled);
  const autoBreathing = useAppStore((state) => state.settings.character.autoBreathing);
  const idleMotion = useAppStore((state) => state.settings.character.idleMotion);
  const movementMode = useAppStore((state) => state.settings.character.movementMode) ?? 'disabled';
  const movementSpeed = useAppStore((state) => state.settings.character.movementSpeed) ?? 1.0;
  const movementActiveness = useAppStore((state) => state.settings.character.movementActiveness) ?? 0.5;

  const setModelUrl = useAppStore((state) => state.setModelUrl);
  const setModelScale = useAppStore((state) => state.setModelScale);
  const setModelPosition = useAppStore((state) => state.setModelPosition);
  const updateCharacterSettings = useAppStore((state) => state.updateCharacterSettings);

  // WebSocket URL에서 백엔드 base URL 추출
  const wsUrl = useAppStore((state) => state.settings.system.websocketUrl);
  const backendBaseUrl = (() => {
    try {
      const url = new URL(wsUrl);
      const protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
      return `${protocol}//${url.host}`;
    } catch {
      return 'http://localhost:12393';
    }
  })();

  // 모델 목록 훅
  const {
    models,
    externalFolders,
    isLoading,
    error,
    refresh,
    removeFolder,
    selectAndAddFolder,
    isElectron,
  } = useModelList();

  // 모델 선택 옵션 생성 (절대 URL로 변환)
  const modelOptions = models.map((model) => ({
    value: `${backendBaseUrl}${model.model_path}`,
    label: model.source === 'external'
      ? `${model.name} (${t('settings.character.external')})`
      : model.name,
  }));

  // 현재 선택된 모델 찾기
  const currentModel = models.find((m) => modelUrl.includes(m.model_path));

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-text-primary">
          {t('settings.character.model')}
        </h3>

        <div className="space-y-4">
          {/* 에러 표시 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 모델 선택 드롭다운 */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              {isLoading ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('settings.character.selectModel')}
                  </label>
                  <div className="flex items-center gap-2 h-10 px-3 bg-surface-secondary rounded-lg text-text-secondary text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('settings.character.loading')}
                  </div>
                </div>
              ) : modelOptions.length > 0 ? (
                <Select
                  label={t('settings.character.selectModel')}
                  value={currentModel ? `${backendBaseUrl}${currentModel.model_path}` : modelUrl}
                  onValueChange={(value) => setModelUrl(value)}
                  options={modelOptions}
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('settings.character.selectModel')}
                  </label>
                  <div className="flex items-center gap-2 h-10 px-3 bg-surface-secondary rounded-lg text-text-secondary text-sm">
                    {t('settings.character.noModelsFound')}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => refresh()}
              disabled={isLoading}
              className="mb-0.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 직접 URL 입력 (고급) */}
          <Input
            label={t('settings.character.modelUrl')}
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            placeholder="/live2d-models/shizuku/shizuku.model3.json"
          />

          {/* 외부 폴더 추가 버튼 (Electron에서만) */}
          {isElectron && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => selectAndAddFolder()}
              disabled={isLoading}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              {t('settings.character.addModelFolder')}
            </Button>
          )}

          {/* 등록된 외부 폴더 목록 */}
          {externalFolders.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                {t('settings.character.externalFolders')}
              </label>
              <div className="space-y-1">
                {externalFolders.map((folder) => (
                  <div
                    key={folder.path}
                    className="flex items-center gap-2 p-2 bg-surface-secondary rounded-lg"
                  >
                    <span className="flex-1 text-sm text-text-primary truncate" title={folder.path}>
                      {folder.path}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFolder(folder.path)}
                      className="flex-shrink-0 text-text-secondary hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Transform */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-text-primary">
          {t('settings.character.transform')}
        </h3>

        <Slider
          label={t('settings.character.scale')}
          value={[scale]}
          onValueChange={([v]) => setModelScale(v)}
          min={0.1}
          max={2}
          step={0.1}
          formatValue={(v) => `${(v * 100).toFixed(0)}%`}
        />

        <Select
          label={t('settings.character.position')}
          value={position.x === 0 ? 'center' : position.x < 0 ? 'left' : 'right'}
          onValueChange={(v) => {
            const x = v === 'left' ? -200 : v === 'right' ? 200 : 0;
            setModelPosition(x, position.y);
          }}
          options={positionOptions}
        />

        <Slider
          label={t('settings.character.verticalPosition')}
          description={t('settings.character.verticalPositionDesc')}
          value={[position.y]}
          onValueChange={([v]) => setModelPosition(position.x, v)}
          min={-300}
          max={300}
          step={10}
          formatValue={(v) => `${v}px`}
        />
      </div>

      {/* Animation Settings */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-text-primary">
          {t('settings.character.animation')}
        </h3>

        <Switch
          label={t('settings.character.lipSync')}
          description={t('settings.character.lipSyncDesc')}
          checked={lipSyncEnabled}
          onCheckedChange={(checked) => updateCharacterSettings({ lipSyncEnabled: checked })}
        />

        <Switch
          label={t('settings.character.eyeBlink')}
          description={t('settings.character.eyeBlinkDesc')}
          checked={eyeBlinkEnabled}
          onCheckedChange={(checked) => updateCharacterSettings({ eyeBlinkEnabled: checked })}
        />

        <Switch
          label={t('settings.character.autoBreathing')}
          description={t('settings.character.autoBreathingDesc')}
          checked={autoBreathing}
          onCheckedChange={(checked) => updateCharacterSettings({ autoBreathing: checked })}
        />

        <Switch
          label={t('settings.character.idleMotion')}
          description={t('settings.character.idleMotionDesc')}
          checked={idleMotion}
          onCheckedChange={(checked) => updateCharacterSettings({ idleMotion: checked })}
        />
      </div>

      {/* Movement Settings */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-text-primary">
          {t('settings.character.movement')}
        </h3>

        <Select
          label={t('settings.character.movementMode')}
          description={t('settings.character.movementModeDesc')}
          value={movementMode}
          onValueChange={(v) => updateCharacterSettings({ movementMode: v as MovementMode })}
          options={movementModeOptions.map((opt) => ({
            ...opt,
            label: t(`settings.character.movementModes.${opt.value}`),
          }))}
        />

        {movementMode !== 'disabled' && (
          <>
            <Slider
              label={t('settings.character.movementSpeed')}
              description={t('settings.character.movementSpeedDesc')}
              value={[movementSpeed]}
              onValueChange={([v]) => updateCharacterSettings({ movementSpeed: v })}
              min={0.1}
              max={2.0}
              step={0.1}
              formatValue={(v) => `${v.toFixed(1)}x`}
            />

            <Slider
              label={t('settings.character.movementActiveness')}
              description={t('settings.character.movementActivenessDesc')}
              value={[movementActiveness]}
              onValueChange={([v]) => updateCharacterSettings({ movementActiveness: v })}
              min={0.1}
              max={1.0}
              step={0.1}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          </>
        )}
      </div>
    </div>
  );
}
