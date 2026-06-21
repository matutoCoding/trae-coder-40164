import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Recording } from '@/types/recording';
import type { Member, NoteItem } from '@/types/member';

const STORAGE_KEYS = {
  recordings: 'app_recordings',
  members: 'app_members',
  notes: 'app_notes',
  initialized: 'app_initialized',
};

const loadFromStorage = <T>(key: string): T | null => {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.error('[Store] Failed to load from storage:', key, e);
  }
  return null;
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] Failed to save to storage:', key, e);
  }
};

interface AppState {
  recordings: Recording[];
  members: Member[];
  notes: NoteItem[];
  storageReady: boolean;

  initFromStorage: () => void;
  setRecordings: (recordings: Recording[]) => void;
  addRecording: (recording: Recording) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;

  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  bindVoiceprint: (memberId: string, speakerId: string) => void;
  unbindVoiceprint: (memberId: string, speakerId: string) => void;

  setNotes: (notes: NoteItem[]) => void;
  addNote: (note: NoteItem) => void;
  updateNote: (id: string, updates: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;
}

const persistState = (state: Partial<AppState>) => {
  if (state.recordings !== undefined) saveToStorage(STORAGE_KEYS.recordings, state.recordings);
  if (state.members !== undefined) saveToStorage(STORAGE_KEYS.members, state.members);
  if (state.notes !== undefined) saveToStorage(STORAGE_KEYS.notes, state.notes);
};

export const useAppStore = create<AppState>((set, get) => ({
  recordings: [],
  members: [],
  notes: [],
  storageReady: false,

  initFromStorage: () => {
    const recordings = loadFromStorage<Recording[]>(STORAGE_KEYS.recordings);
    const members = loadFromStorage<Member[]>(STORAGE_KEYS.members);
    const notes = loadFromStorage<NoteItem[]>(STORAGE_KEYS.notes);
    set({
      recordings: recordings || [],
      members: members || [],
      notes: notes || [],
      storageReady: true,
    });
    console.info('[Store] Initialized from storage:', {
      recordings: recordings?.length || 0,
      members: members?.length || 0,
      notes: notes?.length || 0,
    });
  },

  setRecordings: (recordings) => {
    set({ recordings });
    persistState({ recordings });
  },
  addRecording: (recording) => set((state) => {
    const recordings = [recording, ...state.recordings];
    persistState({ recordings });
    return { recordings };
  }),
  updateRecording: (id, updates) => set((state) => {
    const recordings = state.recordings.map((r) => (r.id === id ? { ...r, ...updates } : r));
    let notes = state.notes;
    if (updates.title) {
      notes = state.notes.map((n) =>
        n.recordingId === id ? { ...n, recordingTitle: updates.title! } : n
      );
    }
    persistState({ recordings, notes });
    return { recordings, notes };
  }),
  deleteRecording: (id) => set((state) => {
    const recordings = state.recordings.filter((r) => r.id !== id);
    persistState({ recordings });
    return { recordings };
  }),

  setMembers: (members) => {
    set({ members });
    persistState({ members });
  },
  addMember: (member) => set((state) => {
    const members = [member, ...state.members];
    persistState({ members });
    return { members };
  }),
  updateMember: (id, updates) => set((state) => {
    const members = state.members.map((m) => (m.id === id ? { ...m, ...updates } : m));
    persistState({ members });
    return { members };
  }),
  deleteMember: (id) => set((state) => {
    const members = state.members.filter((m) => m.id !== id);
    persistState({ members });
    return { members };
  }),
  bindVoiceprint: (memberId, speakerId) => set((state) => {
    const members = state.members.map((m) =>
      m.id === memberId
        ? { ...m, voiceprintIds: [...m.voiceprintIds, speakerId] }
        : m
    );
    persistState({ members });
    return { members };
  }),
  unbindVoiceprint: (memberId, speakerId) => set((state) => {
    const members = state.members.map((m) =>
      m.id === memberId
        ? { ...m, voiceprintIds: m.voiceprintIds.filter((id) => id !== speakerId) }
        : m
    );
    persistState({ members });
    return { members };
  }),

  setNotes: (notes) => {
    set({ notes });
    persistState({ notes });
  },
  addNote: (note) => set((state) => {
    const notes = [note, ...state.notes];
    persistState({ notes });
    return { notes };
  }),
  updateNote: (id, updates) => set((state) => {
    const notes = state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n));
    persistState({ notes });
    return { notes };
  }),
  deleteNote: (id) => set((state) => {
    const notes = state.notes.filter((n) => n.id !== id);
    persistState({ notes });
    return { notes };
  }),
}));
