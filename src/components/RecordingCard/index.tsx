import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { Recording } from '@/types/recording';
import { formatDuration } from '@/utils';

interface RecordingCardProps {
  recording: Recording;
  onClick?: (id: string) => void;
}

const RecordingCard: React.FC<RecordingCardProps> = ({ recording, onClick }) => {
  return (
    <View className={styles.card} onClick={() => onClick?.(recording.id)}>
      <View className={styles.header}>
        <Text className={styles.title}>{recording.title}</Text>
        <View className={styles.typeBadge}>
          <Text className={styles.typeText}>
            {recording.type === 'live' ? '现场' : '导入'}
          </Text>
        </View>
      </View>
      <View className={styles.info}>
        <Text className={styles.meta}>{recording.createdAt}</Text>
        <Text className={styles.dot}>·</Text>
        <Text className={styles.meta}>{formatDuration(recording.duration)}</Text>
        <Text className={styles.dot}>·</Text>
        <Text className={styles.meta}>{recording.speakerCount}人发言</Text>
      </View>
      {recording.status === 'processing' && (
        <View className={styles.processing}>
          <View className={styles.processingDot} />
          <Text className={styles.processingText}>声纹分离中...</Text>
        </View>
      )}
      {recording.status === 'completed' && (
        <View className={styles.completed}>
          <Text className={styles.completedText}>已生成纪要</Text>
        </View>
      )}
    </View>
  );
};

export default RecordingCard;
