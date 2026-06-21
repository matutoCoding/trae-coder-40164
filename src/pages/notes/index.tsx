import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import NoteCard from '@/components/NoteCard';
import EmptyState from '@/components/EmptyState';
import { mockNotes } from '@/data/notes';
import { useAppStore } from '@/store/useAppStore';
import type { NoteItem } from '@/types/member';

const NotesPage: React.FC = () => {
  const notes = useAppStore((s) => s.notes);
  const setNotes = useAppStore((s) => s.setNotes);
  const [activeFilter, setActiveFilter] = useState('all');
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setNotes(mockNotes);
      initialized.current = true;
    }
  }, []);

  const recordingTitles = ['all', ...Array.from(new Set(notes.map((n) => n.recordingTitle)))];

  const filteredNotes =
    activeFilter === 'all'
      ? notes
      : notes.filter((n) => n.recordingTitle === activeFilter);

  const handleFilterClick = (title: string) => {
    setActiveFilter(title);
    console.info('[Notes] Filter changed:', title);
  };

  const handleNoteClick = (note: NoteItem) => {
    Taro.navigateTo({
      url: `/pages/noteDetail/index?id=${note.id}`,
    });
  };

  return (
    <View className={styles.container}>
      <View className={styles.topBar}>
        <Text className={styles.topTitle}>整理笔记</Text>
      </View>

      {recordingTitles.length > 1 && (
        <View className={styles.filterWrap}>
          <Text className={styles.filterLabel}>按录音筛选</Text>
          <ScrollView scrollX className={styles.filterList}>
            {recordingTitles.map((title) => (
              <View
                key={title}
                className={classnames(styles.filterItem, activeFilter === title && styles.filterItemActive)}
                onClick={() => handleFilterClick(title)}
              >
                <Text
                  className={classnames(styles.filterText, activeFilter === title && styles.filterTextActive)}
                >
                  {title === 'all' ? '全部' : title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {filteredNotes.length > 0 ? (
        <ScrollView scrollY className={styles.noteList}>
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} onClick={handleNoteClick} />
          ))}
        </ScrollView>
      ) : (
        <EmptyState icon="📝" message="还没有笔记，完成录音后自动生成" />
      )}
    </View>
  );
};

export default NotesPage;
