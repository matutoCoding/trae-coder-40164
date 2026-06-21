import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SpeakerTagProps {
  label: string;
  color: string;
  assigned?: boolean;
  memberName?: string;
  onClick?: () => void;
}

const SpeakerTag: React.FC<SpeakerTagProps> = ({
  label,
  color,
  assigned,
  memberName,
  onClick,
}) => {
  return (
    <View className={styles.tag} onClick={onClick}>
      <View className={styles.dot} style={{ backgroundColor: color }} />
      <Text className={styles.label}>{label}</Text>
      {assigned && memberName && (
        <Text className={styles.name}>→ {memberName}</Text>
      )}
    </View>
  );
};

export default SpeakerTag;
