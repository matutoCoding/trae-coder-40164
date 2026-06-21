import { create } from 'zustand';
import type { Recording } from '@/types/recording';
import type { Member, NoteItem } from '@/types/member';

interface AppState {
  recordings: Recording[];
  members: Member[];
  notes: NoteItem[];

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

export const useAppStore = create<AppState>((set) => ({
  recordings: [],
  members: [],
  notes: [],

  setRecordings: (recordings) => set({ recordings }),
  addRecording: (recording) => set((state) => ({
    recordings: [recording, ...state.recordings],
  })),
  updateRecording: (id, updates) => set((state) => ({
    recordings: state.recordings.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  })),
  deleteRecording: (id) => set((state) => ({
    recordings: state.recordings.filter((r) => r.id !== id),
  })),

  setMembers: (members) => set({ members }),
  addMember: (member) => set((state) => ({
    members: [member, ...state.members],
  })),
  updateMember: (id, updates) => set((state) => ({
    members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
  })),
  deleteMember: (id) => set((state) => ({
    members: state.members.filter((m) => m.id !== id),
  })),
  bindVoiceprint: (memberId, speakerId) => set((state) => ({
    members: state.members.map((m) =>
      m.id === memberId
        ? { ...m, voiceprintIds: [...m.voiceprintIds, speakerId] }
        : m
    ),
  })),
  unbindVoiceprint: (memberId, speakerId) => set((state) => ({
    members: state.members.map((m) =>
      m.id === memberId
        ? { ...m, voiceprintIds: m.voiceprintIds.filter((id) => id !== speakerId) }
        : m
    ),
  })),

  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({
    notes: [note, ...state.notes],
  })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
  })),
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id),
  })),
}));
