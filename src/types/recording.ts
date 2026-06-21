export type RecordingType = 'live' | 'import';
export type RecordingStatus = 'recording' | 'processing' | 'completed';

export interface SpeakerSegment {
  id: string;
  speakerId: string;
  speakerLabel: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SpeakerMarker {
  id: string;
  timestamp: number;
  label: string;
}

export interface Recording {
  id: string;
  title: string;
  duration: number;
  createdAt: string;
  type: RecordingType;
  status: RecordingStatus;
  speakerCount: number;
  segments: SpeakerSegment[];
  markers: SpeakerMarker[];
}
