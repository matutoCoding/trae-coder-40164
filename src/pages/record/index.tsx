import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordingCard from '@/components/RecordingCard';
import EmptyState from '@/components/EmptyState';
import { mockRecordings } from '@/data/recordings';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration } from '@/utils';

const RecordPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [markers, setMarkers] = useState<number[]>([]);
  const recordings = useAppStore((s) => s.recordings);
  const setRecordings = useAppStore((s) => s.setRecordings);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);

  React.useEffect(() => {
    if (!initialized.current) {
      setRecordings(mockRecordings);
      initialized.current = true;
    }
  }, []);

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
    Taro.showToast({ title: '录音已保存，正在生成声纹分离', icon: 'none', duration: 2000 });
    console.info('[Record] Recording stopped, duration:', recordingTime);
  }, [recordingTime]);

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
        Taro.showToast({ title: '文件导入成功', icon: 'success' });
        console.info('[Record] File imported successfully');
      },
      fail: (err) => {
        console.error('[Record] File import failed:', err);
        Taro.showToast({ title: '导入取消', icon: 'none' });
      },
    });
  }, []);

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
