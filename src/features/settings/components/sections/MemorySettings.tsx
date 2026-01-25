import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  User,
  Users,
  Heart,
  Clock,
  Plus,
  X,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Tag,
  Search,
  ChevronRight,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../../../../shared/store';
import { Input, Slider, Switch, Button, Select } from '../../../../shared/components';
import { cn } from '../../../../shared/utils';

// 플랫폼 타입
type Platform = 'all' | 'discord' | 'youtube' | 'bilibili' | 'chzzk' | 'twitch' | 'direct';

// 플랫폼 정보
const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'all', label: '전체', color: 'bg-gray-500' },
  { value: 'discord', label: 'Discord', color: 'bg-indigo-500' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-500' },
  { value: 'chzzk', label: '치지직', color: 'bg-green-500' },
  { value: 'twitch', label: 'Twitch', color: 'bg-purple-500' },
  { value: 'bilibili', label: 'Bilibili', color: 'bg-blue-400' },
  { value: 'direct', label: '직접 접속', color: 'bg-gray-400' },
];

// 방문자 프로필 타입
interface VisitorProfile {
  identifier: string;
  platform: string;
  first_visit: string;
  last_visit: string;
  visit_count: number;
  total_messages: number;
  affinity_score: number;
  known_facts: string[];
  preferences: {
    likes: string[];
    dislikes: string[];
  };
  tags: string[];
  notes: string;
}

// 사용자(호스트) 프로필 타입
interface UserProfile {
  name: string;
  known_facts: string[];
  preferences: {
    likes: string[];
    dislikes: string[];
  };
  personality_traits: string[];
}

// 태그 리스트 컴포넌트
interface TagListProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  emptyText: string;
  compact?: boolean;
}

function TagList({ title, icon, items, onAdd, onRemove, placeholder, emptyText, compact }: TagListProps) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn('space-y-2', compact && 'space-y-1')}>
      <div className="flex items-center gap-2">
        {icon}
        <span className={cn('font-medium text-text-primary', compact ? 'text-xs' : 'text-sm')}>{title}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {items.length === 0 ? (
          <span className="text-xs text-text-muted italic">{emptyText}</span>
        ) : (
          items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-background-tertiary text-text-primary text-xs rounded-full"
            >
              {item}
              <button onClick={() => onRemove(index)} className="hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-2 py-1 text-xs bg-background-primary border border-background-tertiary rounded-lg focus:outline-none focus:border-accent-primary text-text-primary placeholder:text-text-muted"
        />
        <Button variant="ghost" size="sm" onClick={handleAdd} disabled={!newItem.trim()}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// 시청자 프로필 카드 (목록용)
interface VisitorCardProps {
  profile: VisitorProfile;
  onClick: () => void;
}

function VisitorCard({ profile, onClick }: VisitorCardProps) {
  const platformInfo = PLATFORMS.find((p) => p.value === profile.platform) || PLATFORMS[6];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-background-tertiary/50 rounded-lg hover:bg-background-tertiary transition-colors text-left"
    >
      {/* 플랫폼 뱃지 */}
      <div className={cn('w-2 h-10 rounded-full', platformInfo.color)} />

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary truncate">{profile.identifier}</span>
          <span className="text-xs text-text-muted px-1.5 py-0.5 bg-background-tertiary rounded">
            {platformInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {profile.total_messages}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {profile.affinity_score.toFixed(0)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(profile.last_visit)}
          </span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-text-muted" />
    </button>
  );
}

// 시청자 상세 프로필 모달
interface VisitorDetailProps {
  profile: VisitorProfile;
  onClose: () => void;
  onUpdate: (updates: Partial<VisitorProfile>) => void;
  onDelete: () => void;
}

function VisitorDetail({ profile, onClose, onUpdate, onDelete }: VisitorDetailProps) {
  const { t } = useTranslation();
  const platformInfo = PLATFORMS.find((p) => p.value === profile.platform) || PLATFORMS[6];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const [localFacts, setLocalFacts] = useState(profile.known_facts || []);
  const [localLikes, setLocalLikes] = useState(profile.preferences?.likes || []);
  const [localDislikes, setLocalDislikes] = useState(profile.preferences?.dislikes || []);

  const handleAddFact = (fact: string) => {
    const newFacts = [...localFacts, fact];
    setLocalFacts(newFacts);
    onUpdate({ known_facts: newFacts });
  };

  const handleRemoveFact = (index: number) => {
    const newFacts = localFacts.filter((_, i) => i !== index);
    setLocalFacts(newFacts);
    onUpdate({ known_facts: newFacts });
  };

  const handleAddPreference = (category: 'likes' | 'dislikes', value: string) => {
    if (category === 'likes') {
      const newLikes = [...localLikes, value];
      setLocalLikes(newLikes);
      onUpdate({ preferences: { likes: newLikes, dislikes: localDislikes } });
    } else {
      const newDislikes = [...localDislikes, value];
      setLocalDislikes(newDislikes);
      onUpdate({ preferences: { likes: localLikes, dislikes: newDislikes } });
    }
  };

  const handleRemovePreference = (category: 'likes' | 'dislikes', index: number) => {
    if (category === 'likes') {
      const newLikes = localLikes.filter((_, i) => i !== index);
      setLocalLikes(newLikes);
      onUpdate({ preferences: { likes: newLikes, dislikes: localDislikes } });
    } else {
      const newDislikes = localDislikes.filter((_, i) => i !== index);
      setLocalDislikes(newDislikes);
      onUpdate({ preferences: { likes: localLikes, dislikes: newDislikes } });
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-sm">목록으로</span>
        </button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* 프로필 헤더 */}
      <div className="flex items-center gap-3 p-4 bg-background-tertiary/50 rounded-lg">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold', platformInfo.color)}>
          {profile.identifier.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 className="font-semibold text-text-primary text-lg">{profile.identifier}</h4>
          <span className="text-sm text-text-muted">{platformInfo.label}</span>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-background-tertiary/30 rounded-lg">
          <div className="text-xs text-text-muted">{t('settings.memory.firstVisit', '첫 방문')}</div>
          <div className="text-sm font-medium text-text-primary">{formatDate(profile.first_visit)}</div>
        </div>
        <div className="p-3 bg-background-tertiary/30 rounded-lg">
          <div className="text-xs text-text-muted">{t('settings.memory.lastVisit', '마지막 방문')}</div>
          <div className="text-sm font-medium text-text-primary">{formatDate(profile.last_visit)}</div>
        </div>
        <div className="p-3 bg-background-tertiary/30 rounded-lg">
          <div className="text-xs text-text-muted">{t('settings.memory.visitCount', '방문 횟수')}</div>
          <div className="text-lg font-bold text-accent-primary">{profile.visit_count}회</div>
        </div>
        <div className="p-3 bg-background-tertiary/30 rounded-lg">
          <div className="text-xs text-text-muted">{t('settings.memory.totalMessages', '총 메시지')}</div>
          <div className="text-lg font-bold text-accent-primary">{profile.total_messages}개</div>
        </div>
      </div>

      {/* 친밀도 */}
      <div className="p-3 bg-background-tertiary/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-sm text-text-primary">{t('settings.memory.affinity', '친밀도')}</span>
          </div>
          <span className="text-sm font-medium text-accent-primary">{profile.affinity_score.toFixed(0)}/100</span>
        </div>
        <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-400 to-pink-500 transition-all duration-300"
            style={{ width: `${profile.affinity_score}%` }}
          />
        </div>
      </div>

      {/* 알려진 사실 */}
      <TagList
        title={t('settings.memory.knownFacts', '알려진 사실')}
        icon={<Tag className="w-4 h-4 text-blue-400" />}
        items={localFacts}
        onAdd={handleAddFact}
        onRemove={handleRemoveFact}
        placeholder={t('settings.memory.addFactPlaceholder', '새로운 사실 입력...')}
        emptyText={t('settings.memory.noFacts', '아직 등록된 사실이 없습니다')}
        compact
      />

      {/* 좋아하는 것 */}
      <TagList
        title={t('settings.memory.likes', '좋아하는 것')}
        icon={<ThumbsUp className="w-4 h-4 text-green-400" />}
        items={localLikes}
        onAdd={(v) => handleAddPreference('likes', v)}
        onRemove={(i) => handleRemovePreference('likes', i)}
        placeholder={t('settings.memory.addLikePlaceholder', '좋아하는 것 입력...')}
        emptyText={t('settings.memory.noLikes', '아직 등록된 항목이 없습니다')}
        compact
      />

      {/* 싫어하는 것 */}
      <TagList
        title={t('settings.memory.dislikes', '싫어하는 것')}
        icon={<ThumbsDown className="w-4 h-4 text-red-400" />}
        items={localDislikes}
        onAdd={(v) => handleAddPreference('dislikes', v)}
        onRemove={(i) => handleRemovePreference('dislikes', i)}
        placeholder={t('settings.memory.addDislikePlaceholder', '싫어하는 것 입력...')}
        emptyText={t('settings.memory.noDislikes', '아직 등록된 항목이 없습니다')}
        compact
      />
    </div>
  );
}

export function MemorySettings() {
  const { t } = useTranslation();

  // AI 설정에서 메모리 관련 상태 가져오기
  const memoryEnabled = useAppStore((state) => state.settings.ai.memoryEnabled);
  const memoryLength = useAppStore((state) => state.settings.ai.memoryLength);
  const updateAISettings = useAppStore((state) => state.updateAISettings);

  // 사용자 프로필 상태 (로컬 스토리지에 저장)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('vtuber_user_profile');
    return saved
      ? JSON.parse(saved)
      : {
          name: '',
          known_facts: [],
          preferences: { likes: [], dislikes: [] },
          personality_traits: [],
        };
  });

  // 시청자 프로필 상태
  const [visitors, setVisitors] = useState<VisitorProfile[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorProfile | null>(null);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<Platform>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 사용자 프로필 저장
  useEffect(() => {
    localStorage.setItem('vtuber_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // 시청자 목록 로드
  const loadVisitors = () => {
    setIsLoadingVisitors(true);
    try {
      const ws = (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'list-visitor-profiles',
            platform: platformFilter === 'all' ? null : platformFilter,
          })
        );
      }
    } catch (error) {
      console.error('Failed to load visitors:', error);
    } finally {
      setIsLoadingVisitors(false);
    }
  };

  // WebSocket 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'visitor-profiles-list' && data.profiles) {
          setVisitors(data.profiles);
        }
      } catch {
        // 무시
      }
    };

    const ws = (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket;
    if (ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, []);

  // 필터 변경 시 새로고침
  useEffect(() => {
    loadVisitors();
  }, [platformFilter]);

  // 시청자 프로필 업데이트
  const handleUpdateVisitor = (updates: Partial<VisitorProfile>) => {
    if (!selectedVisitor) return;

    const ws = (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'update-visitor-profile',
          identifier: selectedVisitor.identifier,
          platform: selectedVisitor.platform,
          updates,
        })
      );
    }

    // 로컬 상태 업데이트
    setSelectedVisitor({ ...selectedVisitor, ...updates });
    setVisitors(visitors.map((v) => (v.identifier === selectedVisitor.identifier && v.platform === selectedVisitor.platform ? { ...v, ...updates } : v)));
  };

  // 시청자 프로필 삭제
  const handleDeleteVisitor = () => {
    if (!selectedVisitor) return;

    const ws = (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'delete-visitor-profile',
          identifier: selectedVisitor.identifier,
          platform: selectedVisitor.platform,
        })
      );
    }

    // 로컬 상태 업데이트
    setVisitors(visitors.filter((v) => !(v.identifier === selectedVisitor.identifier && v.platform === selectedVisitor.platform)));
    setSelectedVisitor(null);
  };

  // 검색 및 필터 적용된 시청자 목록
  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch = v.identifier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || v.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  // 사용자 프로필 업데이트 핸들러
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-8">
      {/* 1. 대화 메모리 설정 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">{t('settings.memory.conversationMemory', '대화 메모리')}</h3>
        </div>

        <p className="text-sm text-text-muted">{t('settings.memory.conversationMemoryDesc', 'AI가 이전 대화 내용을 기억하는 설정입니다')}</p>

        <Switch
          label={t('settings.memory.enableMemory', '메모리 활성화')}
          description={t('settings.memory.enableMemoryDesc', '이전 메시지를 대화 컨텍스트에 포함합니다')}
          checked={memoryEnabled}
          onCheckedChange={(checked) => updateAISettings({ memoryEnabled: checked })}
        />

        {memoryEnabled && (
          <Slider
            label={t('settings.memory.memoryLength', '메모리 길이')}
            description={t('settings.memory.memoryLengthDesc', '기억할 메시지 수')}
            value={[memoryLength]}
            onValueChange={([v]) => updateAISettings({ memoryLength: v })}
            min={5}
            max={50}
            step={5}
            formatValue={(v) => `${v} ${t('settings.memory.messages', '메시지')}`}
          />
        )}
      </div>

      {/* 구분선 */}
      <hr className="border-background-tertiary" />

      {/* 2. 사용자(호스트) 프로필 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">{t('settings.memory.userProfile', '사용자 프로필')}</h3>
        </div>

        <p className="text-sm text-text-muted">{t('settings.memory.userProfileDesc', 'AI가 알고 있는 당신(호스트)에 대한 정보입니다')}</p>

        <Input
          label={t('settings.memory.userName', '이름/닉네임')}
          value={userProfile.name}
          onChange={(e) => updateUserProfile({ name: e.target.value })}
          placeholder={t('settings.memory.userNamePlaceholder', '호스트 이름 입력...')}
        />

        <TagList
          title={t('settings.memory.knownFacts', '알려진 사실')}
          icon={<Tag className="w-4 h-4 text-blue-400" />}
          items={userProfile.known_facts}
          onAdd={(fact) => updateUserProfile({ known_facts: [...userProfile.known_facts, fact] })}
          onRemove={(index) => updateUserProfile({ known_facts: userProfile.known_facts.filter((_, i) => i !== index) })}
          placeholder={t('settings.memory.addFactPlaceholder', '새로운 사실 입력...')}
          emptyText={t('settings.memory.noFacts', '아직 등록된 사실이 없습니다')}
        />

        <TagList
          title={t('settings.memory.likes', '좋아하는 것')}
          icon={<ThumbsUp className="w-4 h-4 text-green-400" />}
          items={userProfile.preferences.likes}
          onAdd={(like) => updateUserProfile({ preferences: { ...userProfile.preferences, likes: [...userProfile.preferences.likes, like] } })}
          onRemove={(index) =>
            updateUserProfile({ preferences: { ...userProfile.preferences, likes: userProfile.preferences.likes.filter((_, i) => i !== index) } })
          }
          placeholder={t('settings.memory.addLikePlaceholder', '좋아하는 것 입력...')}
          emptyText={t('settings.memory.noLikes', '아직 등록된 항목이 없습니다')}
        />

        <TagList
          title={t('settings.memory.dislikes', '싫어하는 것')}
          icon={<ThumbsDown className="w-4 h-4 text-red-400" />}
          items={userProfile.preferences.dislikes}
          onAdd={(dislike) =>
            updateUserProfile({ preferences: { ...userProfile.preferences, dislikes: [...userProfile.preferences.dislikes, dislike] } })
          }
          onRemove={(index) =>
            updateUserProfile({ preferences: { ...userProfile.preferences, dislikes: userProfile.preferences.dislikes.filter((_, i) => i !== index) } })
          }
          placeholder={t('settings.memory.addDislikePlaceholder', '싫어하는 것 입력...')}
          emptyText={t('settings.memory.noDislikes', '아직 등록된 항목이 없습니다')}
        />
      </div>

      {/* 구분선 */}
      <hr className="border-background-tertiary" />

      {/* 3. 시청자 프로필 관리 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-primary" />
            <h3 className="text-base font-medium text-text-primary">{t('settings.memory.visitorProfiles', '시청자 프로필')}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={loadVisitors} disabled={isLoadingVisitors} className="gap-1">
            <RefreshCw className={cn('w-4 h-4', isLoadingVisitors && 'animate-spin')} />
            {t('settings.memory.refresh', '새로고침')}
          </Button>
        </div>

        <p className="text-sm text-text-muted">{t('settings.memory.visitorProfilesDesc', '라이브 채팅 시청자들의 프로필을 관리합니다')}</p>

        {selectedVisitor ? (
          // 시청자 상세 보기
          <VisitorDetail
            profile={selectedVisitor}
            onClose={() => setSelectedVisitor(null)}
            onUpdate={handleUpdateVisitor}
            onDelete={handleDeleteVisitor}
          />
        ) : (
          // 시청자 목록
          <>
            {/* 필터 및 검색 */}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('settings.memory.searchVisitors', '시청자 검색...')}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-background-primary border border-background-tertiary rounded-lg focus:outline-none focus:border-accent-primary text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>
              <Select
                value={platformFilter}
                onValueChange={(v) => setPlatformFilter(v as Platform)}
                options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
              />
            </div>

            {/* 시청자 목록 */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredVisitors.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  {visitors.length === 0
                    ? t('settings.memory.noVisitors', '아직 기록된 시청자가 없습니다')
                    : t('settings.memory.noMatchingVisitors', '검색 결과가 없습니다')}
                </div>
              ) : (
                filteredVisitors.map((visitor) => (
                  <VisitorCard key={`${visitor.platform}:${visitor.identifier}`} profile={visitor} onClick={() => setSelectedVisitor(visitor)} />
                ))
              )}
            </div>

            {/* 통계 */}
            {visitors.length > 0 && (
              <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-background-tertiary">
                <span>
                  총 {visitors.length}명의 시청자
                  {platformFilter !== 'all' && ` (${PLATFORMS.find((p) => p.value === platformFilter)?.label} ${filteredVisitors.length}명)`}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
