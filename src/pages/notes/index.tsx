import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import NoteCard from '@/components/NoteCard';
import EmptyState from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import type { NoteItem } from '@/types/member';

interface NoteWithMeta {
  memberName: string | null;
  alias: string;
  displayName: string;
  displayTitle: string;
  memberColor: string | null;
  hitTypes: string[];
}

const NotesPage: React.FC = () => {
  const notes = useAppStore((s) => s.notes);
  const members = useAppStore((s) => s.members);
  const recordings = useAppStore((s) => s.recordings);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const getNoteMeta = (note: NoteItem): NoteWithMeta => {
    const member = members.find((m) => m.voiceprintIds.includes(note.speakerId));
    const recording = recordings.find((r) => r.id === note.recordingId);
    const latestSpeakerLabel = recording?.segments.find(
      (s) => s.speakerId === note.speakerId
    )?.speakerLabel;
    const alias = latestSpeakerLabel || note.memberName || note.speakerId;
    return {
      memberName: member?.name || null,
      alias,
      displayName: member ? `${member.name}（${alias}）` : alias,
      displayTitle: recording?.title || note.recordingTitle,
      memberColor: member?.color || note.memberColor || null,
      hitTypes: [],
    };
  };

  const recordingTitles = useMemo(() => {
    const titles = notes.map((n) => getNoteMeta(n).displayTitle);
    return ['all', ...Array.from(new Set(titles))];
  }, [notes, recordings, members]);

  const getHitTypes = (note: NoteItem, kw: string): string[] => {
    const meta = getNoteMeta(note);
    const types: string[] = [];
    if (meta.displayTitle.toLowerCase().includes(kw)) types.push('标题');
    if (
      meta.memberName?.toLowerCase().includes(kw) ||
      meta.alias.toLowerCase().includes(kw)
    )
      types.push('发言人');
    if (note.viewpoints.some((v) => v.toLowerCase().includes(kw)))
      types.push('观点');
    if (note.questions.some((q) => q.toLowerCase().includes(kw)))
      types.push('问题');
    if (note.quotes.some((q) => q.text.toLowerCase().includes(kw)))
      types.push('引用');
    return types;
  };

  const filteredNotes = useMemo(() => {
    if (!searchKeyword.trim()) {
      if (activeFilter === 'all') return notes;
      return notes.filter((n) => {
        const meta = getNoteMeta(n);
        return meta.displayTitle === activeFilter;
      });
    }

    const kw = searchKeyword.trim().toLowerCase();
    return notes.filter((note) => {
      const meta = getNoteMeta(note);
      if (meta.displayTitle.toLowerCase().includes(kw)) return true;
      if (meta.memberName?.toLowerCase().includes(kw)) return true;
      if (meta.alias.toLowerCase().includes(kw)) return true;
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

  const renderHitTags = (note: NoteItem) => {
    if (!hasSearch) return null;
    const kw = searchKeyword.trim().toLowerCase();
    const hitTypes = getHitTypes(note, kw);
    if (hitTypes.length === 0) return null;
    return (
      <View className={styles.hitTags}>
        {hitTypes.map((t) => (
          <View key={t} className={styles.hitTag}>
            <Text className={styles.hitTagText}>{t}</Text>
          </View>
        ))}
      </View>
    );
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
            <View key={note.id}>
              {renderHitTags(note)}
              <NoteCard note={note} onClick={handleNoteClick} />
            </View>
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
