import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import NoteCard from '@/components/NoteCard';
import EmptyState from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import type { NoteItem } from '@/types/member';

const NotesPage: React.FC = () => {
  const notes = useAppStore((s) => s.notes);
  const members = useAppStore((s) => s.members);
  const recordings = useAppStore((s) => s.recordings);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const getDynamicNoteDisplay = (note: NoteItem) => {
    const member = members.find((m) => m.voiceprintIds.includes(note.speakerId));
    const recording = recordings.find((r) => r.id === note.recordingId);
    const latestSpeakerLabel = recording?.segments.find(
      (s) => s.speakerId === note.speakerId
    )?.speakerLabel;
    return {
      displayName:
        member?.name || latestSpeakerLabel || note.memberName || note.speakerId,
      displayTitle: recording?.title || note.recordingTitle,
    };
  };

  const recordingTitles = useMemo(() => {
    const titles = notes.map((n) => getDynamicNoteDisplay(n).displayTitle);
    return ['all', ...Array.from(new Set(titles))];
  }, [notes, recordings, members]);

  const filteredNotes = useMemo(() => {
    if (!searchKeyword.trim()) {
      if (activeFilter === 'all') return notes;
      return notes.filter((n) => {
        const { displayTitle } = getDynamicNoteDisplay(n);
        return displayTitle === activeFilter;
      });
    }

    const kw = searchKeyword.trim().toLowerCase();
    return notes.filter((note) => {
      const { displayName, displayTitle } = getDynamicNoteDisplay(note);
      if (displayTitle.toLowerCase().includes(kw)) return true;
      if (displayName.toLowerCase().includes(kw)) return true;
      if (note.viewpoints.some((v) => v.toLowerCase().includes(kw))) return true;
      if (note.questions.some((q) => q.toLowerCase().includes(kw))) return true;
      if (note.quotes.some((q) => q.text.toLowerCase().includes(kw))) return true;
      return false;
    });
  }, [notes, activeFilter, searchKeyword, recordings, members]);

  const hasSearch = searchKeyword.trim().length > 0;

  const handleFilterClick = (title: string) => {
    setActiveFilter(title);
  };

  const handleNoteClick = (note: NoteItem) => {
    Taro.navigateTo({
      url: `/pages/noteDetail/index?id=${note.id}`,
    });
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
  };

  return (
    <View className={styles.container}>
      <View className={styles.topBar}>
        <Text className={styles.topTitle}>整理笔记</Text>
      </View>

      <View className={styles.searchWrap}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索录音标题、发言人、观点、问题、引用"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
            confirmType="search"
          />
          {hasSearch && (
            <Text className={styles.searchClear} onClick={handleClearSearch}>
              ✕
            </Text>
          )}
        </View>
        {hasSearch && (
          <Text className={styles.searchResultTip}>
            找到 {filteredNotes.length} 条相关笔记
          </Text>
        )}
      </View>

      {!hasSearch && recordingTitles.length > 1 && (
        <View className={styles.filterWrap}>
          <Text className={styles.filterLabel}>按录音筛选</Text>
          <ScrollView scrollX className={styles.filterList}>
            {recordingTitles.map((title) => (
              <View
                key={title}
                className={classnames(
                  styles.filterItem,
                  activeFilter === title && styles.filterItemActive
                )}
                onClick={() => handleFilterClick(title)}
              >
                <Text
                  className={classnames(
                    styles.filterText,
                    activeFilter === title && styles.filterTextActive
                  )}
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
        <EmptyState
          icon="📝"
          message={
            hasSearch
              ? '未找到相关内容'
              : '还没有笔记，完成录音后自动生成'
          }
        />
      )}
    </View>
  );
};

export default NotesPage;
