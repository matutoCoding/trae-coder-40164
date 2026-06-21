import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import AudioPlayer from '@/components/AudioPlayer';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration } from '@/utils';
import type { NoteItem } from '@/types/member';

const NoteDetailPage: React.FC = () => {
  const notes = useAppStore((s) => s.notes);
  const [note, setNote] = useState<NoteItem | null>(null);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) {
      const found = notes.find((n) => n.id === params.id);
      if (found) {
        setNote(found);
      } else {
        console.error('[NoteDetail] Note not found:', params.id);
        Taro.showToast({ title: '笔记未找到', icon: 'none' });
      }
    }
  }, [notes]);

  if (!note) {
    return (
      <View className={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const displayName = note.memberName || note.speakerId;
  const displayColor = note.memberColor || '#86909C';

  const handleCopy = () => {
    let content = `${displayName} - ${note.recordingTitle}\n\n`;
    if (note.viewpoints.length > 0) {
      content += '【观点】\n';
      note.viewpoints.forEach((v) => (content += `· ${v}\n`));
      content += '\n';
    }
    if (note.questions.length > 0) {
      content += '【问题】\n';
      note.questions.forEach((q) => (content += `· ${q}\n`));
      content += '\n';
    }
    if (note.quotes.length > 0) {
      content += '【引用】\n';
      note.quotes.forEach((q) => (content += `"${q.text}" (${formatDuration(q.timestamp)})\n`));
    }
    Taro.setClipboardData({
      data: content,
      success: () => Taro.showToast({ title: '已复制到剪贴板', icon: 'success' }),
    });
    console.info('[NoteDetail] Note copied');
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.avatar} style={{ backgroundColor: displayColor }}>
          <Text className={styles.avatarText}>{displayName.charAt(0)}</Text>
        </View>
        <View className={styles.headerInfo}>
          <Text className={styles.name}>{displayName}</Text>
          <Text className={styles.recording}>{note.recordingTitle}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>观点</Text>
            <Text className={styles.sectionCount}>{note.viewpoints.length}条</Text>
          </View>
          {note.viewpoints.length > 0 ? (
            note.viewpoints.map((vp, idx) => (
              <View key={idx} className={styles.itemRow}>
                <View className={styles.itemDot} style={{ backgroundColor: displayColor }} />
                <Text className={styles.itemText}>{vp}</Text>
              </View>
            ))
          ) : (
            <View className={styles.emptySection}>
              <Text className={styles.emptyText}>暂无观点记录</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>问题</Text>
            <Text className={styles.sectionCount}>{note.questions.length}条</Text>
          </View>
          {note.questions.length > 0 ? (
            note.questions.map((q, idx) => (
              <View key={idx} className={styles.itemRow}>
                <View className={styles.itemDot} style={{ backgroundColor: '#F59E0B' }} />
                <Text className={styles.itemText}>{q}</Text>
              </View>
            ))
          ) : (
            <View className={styles.emptySection}>
              <Text className={styles.emptyText}>暂无问题记录</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>引用原句</Text>
            <Text className={styles.sectionCount}>{note.quotes.length}条</Text>
          </View>
          {note.quotes.length > 0 ? (
            note.quotes.map((quote) => (
              <View key={quote.id} className={styles.quoteCard}>
                <Text className={styles.quoteText}>"{quote.text}"</Text>
                <Text className={styles.quoteTime}>{formatDuration(quote.timestamp)}</Text>
              </View>
            ))
          ) : (
            <View className={styles.emptySection}>
              <Text className={styles.emptyText}>暂无引用记录</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.copyBtn} onClick={handleCopy}>
          <Text className={styles.copyBtnText}>复制全部</Text>
        </View>
        <View
          className={styles.editBtn}
          onClick={() => Taro.showToast({ title: '编辑功能开发中', icon: 'none' })}
        >
          <Text className={styles.editBtnText}>编辑笔记</Text>
        </View>
      </View>
    </View>
  );
};

export default NoteDetailPage;
