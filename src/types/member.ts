export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
  voiceprintIds: string[];
  color: string;
  joinDate: string;
}

export interface QuoteItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface NoteItem {
  id: string;
  recordingId: string;
  recordingTitle: string;
  speakerId: string;
  memberId?: string;
  memberName?: string;
  memberColor?: string;
  viewpoints: string[];
  questions: string[];
  quotes: QuoteItem[];
}
