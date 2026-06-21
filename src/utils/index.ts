export const SPEAKER_COLORS = [
  '#0D9488',
  '#6366F1',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#10B981',
  '#EF4444',
  '#3B82F6',
];

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const getSpeakerColor = (index: number): string => {
  return SPEAKER_COLORS[index % SPEAKER_COLORS.length];
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
