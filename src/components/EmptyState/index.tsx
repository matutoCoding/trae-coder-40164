import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📭', message }) => {
  return (
    <View className={styles.container}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.message}>{message}</Text>
    </View>
  );
};

export default EmptyState;
