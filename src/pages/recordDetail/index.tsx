import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import AudioPlayer from '@/components/AudioPlayer';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration, getSpeakerColor } from '@/utils';
import type { Recording } from '@/types/recording';

const RecordDetailPage: React.FC = () => {
  const recordings = useAppStore((s) => s.recordings);
  const [recording, setRecording] = useState<Recording | null>(null);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) {
      const found = recordings.find((r) => r.id === params.id);
      if (found) {
        setRecording(found);
      } else {
        console.error('[RecordDetail] Recording not found:', params.id);
        Taro.showToast({ title: '录音未找到', icon: 'none' });
      }
    }
  }, [recordings]);

  if (!recording) {
    return (
      <View className={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const uniqueSpeakers = Array.from(
    new Map(recording.segments.map((s) => [s.speakerId, s])).values()
  );

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>{recording.title}</Text>
        <View className={styles.metaRow}>
          <View className={styles.metaTag}>
            <Text className={styles.metaTagText}>
              {recording.type === 'live' ? '现场录音' : '文件导入'}
            </Text>
          </View>
          <View className={styles.metaTag}>
            <Text className={styles.metaTagText}>{formatDuration(recording.duration)}</Text>
          </View>
          <View className={styles.metaTag}>
            <Text className={styles.metaTagText}>{recording.speakerCount}人发言</Text>
          </View>
          <View className={styles.metaTag}>
            <Text className={styles.metaTagText}>{recording.createdAt}</Text>
          </View>
        </View>
      </View>

      <View className={styles.playerSection}>
        <AudioPlayer duration={recording.duration} />
      </View>

      <View className={styles.speakerSection}>
        <Text className={styles.speakerTitle}>发言人</Text>
        <View className={styles.speakerList}>
          {uniqueSpeakers.map((seg, idx) => (
            <View key={seg.speakerId} className={styles.speakerItem}>
              <View
                className={styles.speakerDot}
                style={{ backgroundColor: getSpeakerColor(idx) }}
              />
              <View className={styles.speakerContent}>
                <Text className={styles.speakerLabel}>{seg.speakerLabel}</Text>
                <Text className={styles.speakerTime}>
                  {formatDuration(seg.startTime)} - {formatDuration(seg.endTime)}
                </Text>
                <Text className={styles.speakerText}>{seg.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {recording.markers.length > 0 && (
        <View className={styles.timelineSection}>
          <Text className={styles.timelineTitle}>发言标记</Text>
          <View className={styles.timeline}>
            {recording.markers.map((mk, idx) => (
              <View key={mk.id} className={styles.timelineItem}>
                <Text className={styles.timelineMarker}>🏷️</Text>
                <Text className={styles.timelineText}>
                  {mk.label} · {formatDuration(mk.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={styles.editBtn} onClick={() => Taro.showToast({ title: '编辑功能开发中', icon: 'none' })}>
          <Text className={styles.editBtnText}>编辑信息</Text>
        </View>
        <View
          className={styles.noteBtn}
          onClick={() => {
            Taro.switchTab({ url: '/pages/notes/index' });
          }}
        >
          <Text className={styles.noteBtnText}>查看笔记</Text>
        </View>
      </View>
    </View>
  );
};

export default RecordDetailPage;
