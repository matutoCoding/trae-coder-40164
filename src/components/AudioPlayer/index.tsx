import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { formatDuration } from '@/utils';

interface AudioPlayerProps {
  duration: number;
  currentTime?: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ duration, currentTime = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(duration > 0 ? currentTime / duration : 0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      console.info('[AudioPlayer] Start playback simulation');
    }
  };

  const handleProgressClick = (e: any) => {
    const rect = e.currentTarget ? 1 : 1;
    const newProgress = Math.min(Math.max(progress + 0.05, 0), 1);
    setProgress(newProgress);
  };

  return (
    <View className={styles.container}>
      <View className={styles.playBtn} onClick={togglePlay}>
        <Text className={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </View>
      <View className={styles.progressWrap} onClick={handleProgressClick}>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
          <View className={styles.progressThumb} style={{ left: `${progress * 100}%` }} />
        </View>
        <View className={styles.timeRow}>
          <Text className={styles.time}>{formatDuration(Math.floor(progress * duration))}</Text>
          <Text className={styles.time}>{formatDuration(duration)}</Text>
        </View>
      </View>
    </View>
  );
};

export default AudioPlayer;
