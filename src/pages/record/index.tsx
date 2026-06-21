import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordingCard from '@/components/RecordingCard';
import EmptyState from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration, generateId } from '@/utils';
import type { Recording, SpeakerSegment, SpeakerMarker } from '@/types/recording';
import type { NoteItem } from '@/types/member';

const MOCK_SEGMENT_TEXTS = [
  '大家好，今天我们开始讨论这个课题的核心问题。',
  '我同意前面的观点，但需要补充一些数据支撑。',
  '关于这个问题，我认为可以从两个维度来分析。',
  '我想提出一个不同的视角，也许可以换个思路。',
  '总结一下，我们达成了以下几点共识。',
];

const buildMockSegments = (duration: number, speakerCount: number, baseSpkIdx: number): SpeakerSegment[] => {
  const segments: SpeakerSegment[] = [];
  const segLen = Math.floor(duration / (speakerCount + 1));
  for (let i = 0; i <= speakerCount; i++) {
    const start = i * segLen + Math.floor(Math.random() * 10);
    const end = Math.min(start + segLen - 5, duration);
    if (start < duration && end > start) {
      segments.push({
        id: generateId(),
        speakerId: `spk_new_${baseSpkIdx + i}`,
        speakerLabel: `发言人${i + 1}`,
        startTime: start,
        endTime: end,
        text: MOCK_SEGMENT_TEXTS[i % MOCK_SEGMENT_TEXTS.length],
      });
    }
  }
  return segments;
};

const buildMockNotes = (recordingId: string, recordingTitle: string, segments: SpeakerSegment[]): NoteItem[] => {
  return segments.map((seg, idx) => ({
    id: generateId(),
    recordingId,
    recordingTitle,
    speakerId: seg.speakerId,
    viewpoints: idx % 2 === 0 ? [seg.text] : [],
    questions: idx % 3 === 0 ? ['需要进一步讨论'] : [],
    quotes: [{ id: generateId(), text: seg.text, timestamp: seg.startTime }],
  }));
};

const RecordPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [markers, setMarkers] = useState<number[]>([]);
  const recordings = useAppStore((s) => s.recordings);
  const addRecording = useAppStore((s) => s.addRecording);
  const updateRecording = useAppStore((s) => s.updateRecording);
  const addNote = useAppStore((s) => s.addNote);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finalizeRecording = useCallback((recId: string, recTitle: string, duration: number, recType: 'live' | 'import', markerTimestamps: number[]) => {
    const speakerCount = Math.max(markerTimestamps.length, 1);
    const existingSpkCount = useAppStore.getState().recordings.reduce(
      (acc, r) => acc + r.segments.length, 0
    );
    const segments = buildMockSegments(duration, speakerCount, existingSpkCount);

    const speakerMarkers: SpeakerMarker[] = markerTimestamps.map((ts, i) => ({
      id: generateId(),
      timestamp: ts,
      label: `新同学${i + 1}`,
    }));

    updateRecording(recId, {
      status: 'completed',
      speakerCount: segments.length,
      segments,
      markers: speakerMarkers,
    });

    const newNotes = buildMockNotes(recId, recTitle, segments);
    newNotes.forEach((n) => addNote(n));

    console.info('[Record] Voiceprint separation completed for:', recId);
  }, [updateRecording, addNote]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTime(0);
    setMarkers([]);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    console.info('[Record] Recording started');
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const duration = recordingTime > 0 ? recordingTime : 30;
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const recId = generateId();
    const recTitle = `现场录音 ${now.getMonth() + 1}月${now.getDate()}日`;

    const newRec: Recording = {
      id: recId,
      title: recTitle,
      duration,
      createdAt,
      type: 'live',
      status: 'processing',
      speakerCount: 0,
      segments: [],
      markers: [],
    };
    addRecording(newRec);

    Taro.showToast({ title: '录音已保存，声纹分离中...', icon: 'none', duration: 2000 });
    console.info('[Record] Recording stopped, duration:', duration);

    const capturedMarkers = [...markers];
    setTimeout(() => {
      finalizeRecording(recId, recTitle, duration, 'live', capturedMarkers);
    }, 3000);
  }, [recordingTime, markers, addRecording, finalizeRecording]);

  const addMarker = useCallback(() => {
    setMarkers((prev) => [...prev, recordingTime]);
    Taro.showToast({ title: '已标记新同学发言', icon: 'none', duration: 1000 });
    console.info('[Record] Speaker marker added at:', recordingTime);
  }, [recordingTime]);

  const handleImport = useCallback(() => {
    Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['mp3', 'wav', 'm4a', 'aac'],
      success: () => {
        const duration = 180 + Math.floor(Math.random() * 600);
        const now = new Date();
        const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const recId = generateId();
        const recTitle = `导入录音 ${now.getMonth() + 1}月${now.getDate()}日`;

        const newRec: Recording = {
          id: recId,
          title: recTitle,
          duration,
          createdAt,
          type: 'import',
          status: 'processing',
          speakerCount: 0,
          segments: [],
          markers: [],
        };
        addRecording(newRec);

        Taro.showToast({ title: '文件导入成功，声纹分离中...', icon: 'none', duration: 2000 });
        console.info('[Record] File imported, starting voiceprint separation');

        setTimeout(() => {
          finalizeRecording(recId, recTitle, duration, 'import', []);
        }, 3000);
      },
      fail: (err) => {
        console.error('[Record] File import failed:', err);
        Taro.showToast({ title: '导入取消', icon: 'none' });
      },
    });
  }, [addRecording, finalizeRecording]);

  const handleRecordingClick = useCallback((id: string) => {
    Taro.navigateTo({ url: `/pages/recordDetail/index?id=${id}` });
  }, []);

  return (
    <View className={styles.container}>
      {!isRecording ? (
        <View className={styles.actionArea}>
          <View className={styles.actionCard} onClick={startRecording}>
            <Text className={styles.actionIcon}>🎙️</Text>
            <Text className={styles.actionTitle}>现场录音</Text>
            <Text className={styles.actionDesc}>打开麦克风开始录制</Text>
          </View>
          <View className={styles.actionCard} onClick={handleImport}>
            <Text className={styles.actionIcon}>📁</Text>
            <Text className={styles.actionTitle}>导入文件</Text>
            <Text className={styles.actionDesc}>选择本地音频文件</Text>
          </View>
        </View>
      ) : (
        <View className={styles.recordingArea}>
          <View className={styles.timerWrap}>
            <Text className={styles.timer}>{formatDuration(recordingTime)}</Text>
            <View className={styles.waveform}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  className={styles.waveBar}
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </View>
          </View>
          <View className={styles.markerArea}>
            <View className={styles.markerBtn} onClick={addMarker}>
              <Text className={styles.markerIcon}>🏷️</Text>
              <Text className={styles.markerText}>新同学发言</Text>
            </View>
            {markers.length > 0 && (
              <View className={styles.markers}>
                {markers.map((t, i) => (
                  <View key={i} className={styles.markerChip}>
                    <Text className={styles.markerChipText}>
                      标记{i + 1} {formatDuration(t)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View className={styles.stopBtn} onClick={stopRecording}>
            <Text className={styles.stopIcon}>⏹</Text>
            <Text className={styles.stopText}>停止录音</Text>
          </View>
        </View>
      )}

      <View className={styles.listSection}>
        <Text className={styles.sectionTitle}>最近录音</Text>
        {recordings.length > 0 ? (
          <ScrollView scrollY className={styles.list}>
            {recordings.map((rec) => (
              <RecordingCard key={rec.id} recording={rec} onClick={handleRecordingClick} />
            ))}
          </ScrollView>
        ) : (
          <EmptyState icon="🎙️" message="还没有录音，开始你的第一次录音吧" />
        )}
      </View>
    </View>
  );
};

export default RecordPage;
