import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { NoteItem } from '@/types/member';

interface NoteCardProps {
  note: NoteItem;
  onClick?: (note: NoteItem) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  const displayName = note.memberName || note.speakerId;
  const displayColor = note.memberColor || '#86909C';

  return (
    <View className={styles.card} onClick={() => onClick?.(note)}>
      <View className={styles.header}>
        <View className={styles.avatar} style={{ backgroundColor: displayColor }}>
          <Text className={styles.avatarText}>{displayName.charAt(0)}</Text>
        </View>
        <View className={styles.headerInfo}>
          <Text className={styles.name}>{displayName}</Text>
          <Text className={styles.recording}>{note.recordingTitle}</Text>
        </View>
      </View>
      {note.viewpoints.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>观点</Text>
          {note.viewpoints.map((vp, idx) => (
            <Text key={idx} className={styles.item}>{vp}</Text>
          ))}
        </View>
      )}
      {note.questions.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>问题</Text>
          {note.questions.map((q, idx) => (
            <Text key={idx} className={styles.item}>{q}</Text>
          ))}
        </View>
      )}
      {note.quotes.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>引用</Text>
          {note.quotes.map((quote) => (
            <Text key={quote.id} className={styles.quote}>"{quote.text}"</Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default NoteCard;
