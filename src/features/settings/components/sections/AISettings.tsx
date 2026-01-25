import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Sparkles, ChevronDown, ChevronRight, Server } from 'lucide-react';
import { useAppStore } from '../../../../shared/store';
import { Input, Textarea, Slider, Select, Switch } from '../../../../shared/components';
import { cn } from '../../../../shared/utils';
import type { LLMProvider, LLMProviderConfig, LLMProviderInfo } from '../../../../shared/types';

// 기본 프로바이더 설정 (fallback)
const DEFAULT_PROVIDER_CONFIG: LLMProviderConfig = {
  apiKey: '',
  baseUrl: '',
  model: '',
  temperature: 1.0,
};

// 프로바이더 정보 정의
const PROVIDER_INFO: LLMProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    requiresApiKey: true,
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    requiresApiKey: true,
    defaultBaseUrl: 'https://api.anthropic.com',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    requiresApiKey: true,
    defaultBaseUrl: '',
    models: [
      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    requiresApiKey: false,
    defaultBaseUrl: 'http://localhost:11434/v1',
    models: [
      { value: 'qwen2.5:latest', label: 'Qwen 2.5' },
      { value: 'llama3.2:latest', label: 'Llama 3.2' },
      { value: 'mistral:latest', label: 'Mistral' },
      { value: 'gemma2:latest', label: 'Gemma 2' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    requiresApiKey: true,
    defaultBaseUrl: '',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    requiresApiKey: true,
    defaultBaseUrl: '',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'deepseek-coder', label: 'DeepSeek Coder' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    requiresApiKey: true,
    defaultBaseUrl: '',
    models: [
      { value: 'pixtral-large-latest', label: 'Pixtral Large' },
      { value: 'mistral-large-latest', label: 'Mistral Large' },
      { value: 'mistral-small-latest', label: 'Mistral Small' },
    ],
  },
  {
    id: 'openai_compatible',
    name: 'OpenAI Compatible',
    requiresApiKey: false,
    defaultBaseUrl: 'http://localhost:11434/v1',
    models: [],
  },
];

interface ProviderSectionProps {
  provider: LLMProviderInfo;
  config: LLMProviderConfig;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onConfigChange: (config: Partial<LLMProviderConfig>) => void;
}

function ProviderSection({
  provider,
  config,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onConfigChange,
}: ProviderSectionProps) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-colors',
        isSelected
          ? 'border-accent-primary bg-accent-primary/5'
          : 'border-background-tertiary'
      )}
    >
      {/* 헤더 */}
      <button
        onClick={onToggleExpand}
        className={cn(
          'w-full flex items-center gap-3 p-4 text-left transition-colors',
          'hover:bg-background-tertiary/50'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted" />
        )}
        <span className="flex-1 font-medium text-text-primary">{provider.name}</span>
        {isSelected && (
          <span className="px-2 py-0.5 text-xs font-medium bg-accent-primary text-white rounded">
            {t('settings.ai.active', 'Active')}
          </span>
        )}
        {!provider.requiresApiKey && (
          <span className="px-2 py-0.5 text-xs text-text-muted bg-background-tertiary rounded">
            {t('settings.ai.local', 'Local')}
          </span>
        )}
      </button>

      {/* 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-background-tertiary pt-4">
          {/* 선택 버튼 */}
          {!isSelected && (
            <button
              onClick={onSelect}
              className="w-full py-2 px-4 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors"
            >
              {t('settings.ai.useThisProvider', 'Use this provider')}
            </button>
          )}

          {/* API Key (필요한 경우) */}
          {provider.requiresApiKey && (
            <Input
              label={t('settings.ai.apiKey', 'API Key')}
              type="password"
              value={config.apiKey}
              onChange={(e) => onConfigChange({ apiKey: e.target.value })}
              placeholder={`${provider.name} API Key...`}
            />
          )}

          {/* Base URL (OpenAI Compatible에서만 필수 표시) */}
          {(provider.id === 'openai_compatible' || provider.id === 'ollama') && (
            <Input
              label={t('settings.ai.baseUrl', 'Base URL')}
              value={config.baseUrl}
              onChange={(e) => onConfigChange({ baseUrl: e.target.value })}
              placeholder={provider.defaultBaseUrl}
            />
          )}

          {/* 모델 선택 */}
          {provider.models.length > 0 ? (
            <Select
              label={t('settings.ai.model', 'Model')}
              value={config.model}
              onValueChange={(v) => onConfigChange({ model: v })}
              options={provider.models}
            />
          ) : (
            <Input
              label={t('settings.ai.model', 'Model')}
              value={config.model}
              onChange={(e) => onConfigChange({ model: e.target.value })}
              placeholder="model-name"
              description={t('settings.ai.modelInputDesc', 'Enter the model name manually')}
            />
          )}

          {/* 고급 설정 토글 */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            {showAdvanced ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {t('settings.ai.advanced', 'Advanced Settings')}
          </button>

          {/* 고급 설정 */}
          {showAdvanced && (
            <div className="space-y-4 pl-4 border-l-2 border-background-tertiary">
              <Slider
                label={t('settings.ai.temperature', 'Temperature')}
                description={t('settings.ai.temperatureDesc', 'Higher values make output more random')}
                value={[config.temperature]}
                onValueChange={([v]) => onConfigChange({ temperature: v })}
                min={0}
                max={2}
                step={0.1}
                formatValue={(v) => v.toFixed(1)}
              />

              {provider.id !== 'ollama' && provider.defaultBaseUrl && (
                <Input
                  label={t('settings.ai.baseUrl', 'Base URL')}
                  value={config.baseUrl}
                  onChange={(e) => onConfigChange({ baseUrl: e.target.value })}
                  placeholder={provider.defaultBaseUrl}
                  description={t('settings.ai.baseUrlDesc', 'Override the default API endpoint')}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AISettings() {
  const { t } = useTranslation();

  // Store 상태
  const currentProvider = useAppStore((state) => state.settings.ai.currentProvider);
  const providers = useAppStore((state) => state.settings.ai.providers);
  const systemPrompt = useAppStore((state) => state.settings.ai.systemPrompt);
  const maxTokens = useAppStore((state) => state.settings.ai.maxTokens);
  const streamingEnabled = useAppStore((state) => state.settings.ai.streamingEnabled);

  const updateAISettings = useAppStore((state) => state.updateAISettings);

  // 확장된 프로바이더 상태
  const [expandedProvider, setExpandedProvider] = useState<LLMProvider | null>(currentProvider);

  // 프로바이더 설정 업데이트
  const handleProviderConfigChange = (providerId: LLMProvider, config: Partial<LLMProviderConfig>) => {
    const providerInfo = PROVIDER_INFO.find((p) => p.id === providerId);
    const currentConfig = providers?.[providerId] ?? {
      ...DEFAULT_PROVIDER_CONFIG,
      baseUrl: providerInfo?.defaultBaseUrl ?? '',
      model: providerInfo?.models[0]?.value ?? '',
    };

    updateAISettings({
      providers: {
        ...providers,
        [providerId]: {
          ...currentConfig,
          ...config,
        },
      },
    });
  };

  // 프로바이더 선택
  const handleSelectProvider = (providerId: LLMProvider) => {
    updateAISettings({ currentProvider: providerId });
    setExpandedProvider(providerId);
  };

  // 프로바이더 토글
  const handleToggleExpand = (providerId: LLMProvider) => {
    setExpandedProvider(expandedProvider === providerId ? null : providerId);
  };

  return (
    <div className="space-y-6">
      {/* 프로바이더 선택 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.ai.provider', 'LLM Provider')}
          </h3>
        </div>

        <p className="text-sm text-text-muted">
          {t('settings.ai.providerDesc', 'Select and configure your AI language model provider')}
        </p>

        <div className="space-y-2">
          {PROVIDER_INFO.map((provider) => {
            // 기존 localStorage 데이터가 없을 경우를 대비한 fallback
            const providerConfig = providers?.[provider.id] ?? {
              ...DEFAULT_PROVIDER_CONFIG,
              baseUrl: provider.defaultBaseUrl,
              model: provider.models[0]?.value ?? '',
            };

            return (
              <ProviderSection
                key={provider.id}
                provider={provider}
                config={providerConfig}
                isSelected={currentProvider === provider.id}
                isExpanded={expandedProvider === provider.id}
                onToggleExpand={() => handleToggleExpand(provider.id)}
                onSelect={() => handleSelectProvider(provider.id)}
                onConfigChange={(config) => handleProviderConfigChange(provider.id, config)}
              />
            );
          })}
        </div>
      </div>

      {/* 시스템 프롬프트 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.ai.prompt', 'System Prompt')}
          </h3>
        </div>

        <Textarea
          label={t('settings.ai.systemPrompt', 'System Prompt')}
          description={t('settings.ai.systemPromptDesc', 'Define the AI personality and behavior')}
          value={systemPrompt}
          onChange={(e) => updateAISettings({ systemPrompt: e.target.value })}
          placeholder={t('settings.ai.systemPromptPlaceholder', 'You are a helpful AI assistant...')}
          rows={5}
        />
      </div>

      {/* 생성 파라미터 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.ai.parameters', 'Generation Parameters')}
          </h3>
        </div>

        <Slider
          label={t('settings.ai.maxTokens', 'Max Tokens')}
          description={t('settings.ai.maxTokensDesc', 'Maximum length of the response')}
          value={[maxTokens]}
          onValueChange={([v]) => updateAISettings({ maxTokens: v })}
          min={100}
          max={4000}
          step={100}
          formatValue={(v) => String(v)}
        />

        <Switch
          label={t('settings.ai.streaming', 'Streaming')}
          description={t('settings.ai.streamingDesc', 'Stream the response in real-time')}
          checked={streamingEnabled}
          onCheckedChange={(checked) => updateAISettings({ streamingEnabled: checked })}
        />
      </div>
    </div>
  );
}
