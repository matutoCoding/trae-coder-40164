import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import AudioPlayer from '@/components/AudioPlayer';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration, getSpeakerColor } from '@/utils';
import type { Recording } from '@/types/recording';
import type { Member } from '@/types/member';

const RecordDetailPage: React.FC = () => {
  const recordings = useAppStore((s) => s.recordings);
  const members = useAppStore((s) => s.members);
  const notes = useAppStore((s) => s.notes);
  const updateRecording = useAppStore((s) => s.updateRecording);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [speakerNameValue, setSpeakerNameValue] = useState('');
  const [activeSpeakerFilter, setActiveSpeakerFilter] = useState<string>('all');

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

  const getMemberForSpeaker = (speakerId: string): Member | undefined => {
    return members.find((m) => m.voiceprintIds.includes(speakerId));
  };

  const getSpeakerDisplayName = (speakerId: string, speakerLabel: string): string => {
    const member = getMemberForSpeaker(speakerId);
    return member ? `${member.name}（${speakerLabel}）` : speakerLabel;
  };

  const getSpeakerShortName = (speakerId: string, speakerLabel: string): string => {
    const member = getMemberForSpeaker(speakerId);
    return member?.name || speakerLabel;
  };

  const handleEditTitle = () => {
    if (recording) {
      setTitleValue(recording.title);
      setEditingTitle(true);
    }
  };

  const saveTitle = () => {
    if (recording && titleValue.trim()) {
      updateRecording(recording.id, { title: titleValue.trim() });
      setEditingTitle(false);
      Taro.showToast({ title: '标题已更新', icon: 'success' });
      console.info('[RecordDetail] Title updated:', titleValue.trim());
    }
  };

  const handleEditSpeaker = (speakerId: string, currentLabel: string) => {
    setEditingSpeakerId(speakerId);
    setSpeakerNameValue(currentLabel);
  };

  const saveSpeakerName = () => {
    if (recording && editingSpeakerId && speakerNameValue.trim()) {
      const updatedSegments = recording.segments.map((seg) =>
        seg.speakerId === editingSpeakerId
          ? { ...seg, speakerLabel: speakerNameValue.trim() }
          : seg
      );
      updateRecording(recording.id, { segments: updatedSegments });
      setEditingSpeakerId(null);
      Taro.showToast({ title: '发言人名称已更新', icon: 'success' });
      console.info('[RecordDetail] Speaker label updated:', editingSpeakerId, '->', speakerNameValue.trim());
    }
  };

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

  const filteredSegments =
    activeSpeakerFilter === 'all'
      ? recording.segments
      : recording.segments.filter((s) => s.speakerId === activeSpeakerFilter);

  const filteredMarkers =
    activeSpeakerFilter === 'all'
      ? recording.markers
      : recording.markers.filter((mk) => {
          const activeSegment = recording.segments.find(
            (s) =>
              s.speakerId === activeSpeakerFilter &&
              mk.timestamp >= s.startTime &&
              mk.timestamp <= s.endTime
          );
          return !!activeSegment;
        });

  const handleSpeakerFilterClick = (speakerId: string) => {
    setActiveSpeakerFilter(activeSpeakerFilter === speakerId ? 'all' : speakerId);
    console.info('[RecordDetail] Speaker filter changed:', activeSpeakerFilter === speakerId ? 'all' : speakerId);
  };

  const recordingNotes = useMemo(
    () => notes.filter((n) => n.recordingId === recording?.id),
    [notes, recording?.id]
  );

  const summaryItems = useMemo(() => {
    if (!recording) return [];
    return uniqueSpeakers.map((seg, idx) => {
      const member = getMemberForSpeaker(seg.speakerId);
      const note = recordingNotes.find((n) => n.speakerId === seg.speakerId);
      const alias = seg.speakerLabel;
      const displayName = member ? `${member.name}（${alias}）` : alias;
      const color = member?.color || getSpeakerColor(idx);
      const viewpointCount = note?.viewpoints.length || 0;
      const questionCount = note?.questions.length || 0;
      const quoteCount = note?.quotes.length || 0;
      return {
        speakerId: seg.speakerId,
        displayName,
        color,
        noteId: note?.id,
        viewpointCount,
        questionCount,
        quoteCount,
      };
    });
  }, [uniqueSpeakers, recordingNotes, recording, members]);

  const handleOpenNote = (noteId?: string) => {
    if (noteId) {
      Taro.navigateTo({ url: `/pages/noteDetail/index?id=${noteId}` });
    } else {
      Taro.showToast({ title: '暂无对应笔记', icon: 'none' });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        {editingTitle ? (
          <View className={styles.titleEditWrap}>
            <Input
              className={styles.titleInput}
              value={titleValue}
              onInput={(e) => setTitleValue(e.detail.value)}
              onBlur={saveTitle}
              onConfirm={saveTitle}
              autoFocus
            />
          </View>
        ) : (
          <Text className={styles.title} onClick={handleEditTitle}>{recording.title}</Text>
        )}
        {!editingTitle && (
          <Text className={styles.editHint}>点击标题可编辑</Text>
        )}
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

      {recording.status === 'processing' && (
        <View className={styles.processingCard}>
          <View className={styles.processingDot} />
          <Text className={styles.processingText}>声纹分离中，请稍候...</Text>
        </View>
      )}

      {recording.status === 'completed' && (
        <View className={styles.summarySection}>
          <Text className={styles.summaryTitle}>纪要总览</Text>
          <View className={styles.summaryList}>
            {summaryItems.map((item) => (
              <View
                key={item.speakerId}
                className={styles.summaryItem}
                onClick={() => handleOpenNote(item.noteId)}
              >
                <View
                  className={styles.summaryDot}
                  style={{ backgroundColor: item.color }}
                />
                <View className={styles.summaryInfo}>
                  <Text className={styles.summaryName} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                  <View className={styles.summaryStats}>
                    <View className={styles.summaryStat}>
                      <Text className={styles.summaryStatNum}>
                        {item.viewpointCount}
                      </Text>
                      <Text className={styles.summaryStatLabel}>观点</Text>
                    </View>
                    <View className={styles.summaryStat}>
                      <Text className={styles.summaryStatNum}>
                        {item.questionCount}
                      </Text>
                      <Text className={styles.summaryStatLabel}>问题</Text>
                    </View>
                    <View className={styles.summaryStat}>
                      <Text className={styles.summaryStatNum}>
                        {item.quoteCount}
                      </Text>
                      <Text className={styles.summaryStatLabel}>引用</Text>
                    </View>
                  </View>
                </View>
                <Text className={styles.summaryArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {recording.status === 'completed' && (
        <View className={styles.speakerSection}>
          <Text className={styles.speakerTitle}>发言人</Text>
          {uniqueSpeakers.length > 1 && (
            <ScrollView scrollX className={styles.speakerFilterList}>
              <View
                className={classnames(
                  styles.speakerFilterItem,
                  activeSpeakerFilter === 'all' && styles.speakerFilterItemActive
                )}
                onClick={() => handleSpeakerFilterClick('all')}
              >
                <Text
                  className={classnames(
                    styles.speakerFilterText,
                    activeSpeakerFilter === 'all' && styles.speakerFilterTextActive
                  )}
                >
                  全部
                </Text>
              </View>
              {uniqueSpeakers.map((seg, idx) => {
                const member = getMemberForSpeaker(seg.speakerId);
                const isActive = activeSpeakerFilter === seg.speakerId;
                return (
                  <View
                    key={seg.speakerId}
                    className={classnames(
                      styles.speakerFilterItem,
                      isActive && styles.speakerFilterItemActive
                    )}
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(135deg, ${member?.color || getSpeakerColor(idx)}, ${member?.color || getSpeakerColor(idx)}dd)`,
                          }
                        : undefined
                    }
                    onClick={() => handleSpeakerFilterClick(seg.speakerId)}
                  >
                    <View
                      className={styles.speakerFilterDot}
                      style={{
                        backgroundColor: member?.color || getSpeakerColor(idx),
                      }}
                    />
                    <Text
                      className={classnames(
                        styles.speakerFilterText,
                        isActive && styles.speakerFilterTextActive
                      )}
                    >
                      {getSpeakerShortName(seg.speakerId, seg.speakerLabel)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
          <View className={styles.speakerList}>
            {filteredSegments.map((seg, idx) => {
              const member = getMemberForSpeaker(seg.speakerId);
              const isEditing = editingSpeakerId === seg.speakerId;
              const colorIdx = uniqueSpeakers.findIndex((u) => u.speakerId === seg.speakerId);
              return (
                <View key={seg.id} className={styles.speakerItem}>
                  <View
                    className={styles.speakerDot}
                    style={{ backgroundColor: member?.color || getSpeakerColor(colorIdx) }}
                  />
                  <View className={styles.speakerContent}>
                    {isEditing ? (
                      <View className={styles.speakerNameEdit}>
                        <Input
                          className={styles.speakerNameInput}
                          value={speakerNameValue}
                          onInput={(e) => setSpeakerNameValue(e.detail.value)}
                          onBlur={saveSpeakerName}
                          onConfirm={saveSpeakerName}
                          autoFocus
                        />
                      </View>
                    ) : (
                      <Text
                        className={styles.speakerLabel}
                        onClick={() => handleEditSpeaker(seg.speakerId, seg.speakerLabel)}
                      >
                        {getSpeakerDisplayName(seg.speakerId, seg.speakerLabel)}
                      </Text>
                    )}
                    <Text className={styles.speakerTime}>
                      {formatDuration(seg.startTime)} - {formatDuration(seg.endTime)}
                    </Text>
                    <Text className={styles.speakerText}>{seg.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {filteredMarkers.length > 0 && (
        <View className={styles.timelineSection}>
          <Text className={styles.timelineTitle}>发言标记</Text>
          <View className={styles.timeline}>
            {filteredMarkers.map((mk, idx) => (
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
        <View className={styles.editBtn} onClick={handleEditTitle}>
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
