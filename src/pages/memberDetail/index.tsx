import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration } from '@/utils';
import type { Member, NoteItem } from '@/types/member';
import type { Recording } from '@/types/recording';
import styles from './index.module.scss';

interface VoiceprintEntry {
  speakerId: string;
  speakerLabel: string;
  recordingId: string;
  recordingTitle: string;
}

interface RecordingEntry {
  recording: Recording;
  latestSpeakerLabel: string;
  notes: NoteItem[];
  totalDuration: number;
}

const MemberDetailPage: React.FC = () => {
  const members = useAppStore((s) => s.members);
  const recordings = useAppStore((s) => s.recordings);
  const notes = useAppStore((s) => s.notes);
  const deleteMember = useAppStore((s) => s.deleteMember);
  const unbindVoiceprint = useAppStore((s) => s.unbindVoiceprint);

  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) {
      const found = members.find((m) => m.id === params.id);
      if (found) {
        setMember(found);
      } else {
        Taro.showToast({ title: '成员未找到', icon: 'none' });
      }
    }
  }, [members]);

  const voiceprintEntries = useMemo<VoiceprintEntry[]>(() => {
    if (!member) return [];
    const entries: VoiceprintEntry[] = [];
    member.voiceprintIds.forEach((spk) => {
      for (const rec of recordings) {
        const seg = rec.segments.find((s) => s.speakerId === spk);
        if (seg) {
          entries.push({
            speakerId: spk,
            speakerLabel: seg.speakerLabel,
            recordingId: rec.id,
            recordingTitle: rec.title,
          });
          break;
        }
      }
    });
    return entries;
  }, [member, recordings]);

  const recordingEntries = useMemo<RecordingEntry[]>(() => {
    if (!member) return [];
    const map = new Map<string, RecordingEntry>();
    member.voiceprintIds.forEach((spk) => {
      recordings.forEach((rec) => {
        const hasSpeaker = rec.segments.some((s) => s.speakerId === spk);
        if (hasSpeaker && !map.has(rec.id)) {
          const relatedNotes = notes.filter(
            (n) =>
              n.recordingId === rec.id &&
              member!.voiceprintIds.includes(n.speakerId));
          const latestLabel =
            rec.segments.find((s) => s.speakerId === spk)?.speakerLabel || spk;
          const duration = rec.segments
            .filter((s) => member!.voiceprintIds.includes(s.speakerId))
            .reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
          map.set(rec.id, {
            recording: rec,
            latestSpeakerLabel: latestLabel,
            notes: relatedNotes,
            totalDuration: duration,
          });
        }
      });
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.recording.createdAt).getTime() - new Date(a.recording.createdAt).getTime()
    );
  }, [member, recordings, notes]);

  if (!member) {
    return (
      <View className={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: `确定删除成员「${member.name}」？已绑定的声纹将一并移除。`,
      success: (res) => {
        if (res.confirm) {
          deleteMember(member.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 600);
        }
      },
    });
  };

  const handleUnbindVoiceprint = (speakerId: string, speakerLabel: string) => {
    Taro.showModal({
      title: '解除绑定',
      content: `确定解除「${speakerLabel}」与该成员的绑定？`,
      success: (res) => {
        if (res.confirm) {
          unbindVoiceprint(member.id, speakerId);
          Taro.showToast({ title: '已解除', icon: 'success' });
        }
      },
    });
  };

  const handleOpenRecording = (id: string) => {
    Taro.navigateTo({ url: `/pages/recordDetail/index?id=${id}` });
  };

  const handleOpenNote = (noteId: string) => {
    Taro.navigateTo({ url: `/pages/noteDetail/index?id=${noteId}` });
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.avatarWrap} style={{ backgroundColor: member.color }}>
          {member.avatar ? (
            <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
          ) : (
            <Text className={styles.avatarText}>{member.name.charAt(0)}</Text>
          )}
        </View>
        <View className={styles.headerInfo}>
          <Text className={styles.name}>{member.name}</Text>
          <Text className={styles.role}>{member.role}</Text>
          <Text className={styles.joinDate}>加入时间：{member.joinDate}</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>个人声纹</Text>
            <Text className={styles.sectionCount}>{member.voiceprintIds.length} 条已识别</Text>
          </View>
          {voiceprintEntries.length > 0 ? (
            <View className={styles.voiceprintList}>
              {voiceprintEntries.map((vp) => (
                <View className={styles.voiceprintItem} key={`${vp.speakerId}_${vp.recordingId}`}>
                  <View
                  className={styles.voiceprintDot}
                  style={{ backgroundColor: member.color }}
                />
                <View className={styles.voiceprintInfo}>
                  <Text className={styles.voiceprintLabel}>{vp.speakerLabel}</Text>
                  <Text className={styles.voiceprintSource}>
                    来源：{vp.recordingTitle}</Text>
                  </View>
                </View>
              </View>
              {member.voiceprintIds.length > voiceprintEntries.length && (
                <Text className={styles.voiceprintNote}>
                  * 部分声纹暂无录音记录</Text>
              )}
            </View>
          ) : (
            <View className={styles.emptyBlock}>
              <Text className={styles.emptyText}>还没有声纹，请在成员页分配发言人</Text>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>参与录音</Text>
            <Text className={styles.sectionCount}>{recordingEntries.length} 条记录</Text>
          </View>
          {recordingEntries.length > 0 ? (
            <View className={styles.recordingList}>
              {recordingEntries.map((entry) => (
                <View
                  className={styles.recordingCard}
                  key={entry.recording.id}
                  onClick={() => handleOpenRecording(entry.recording.id)}
                >
                  <View className={styles.recordingTop}>
                    <Text className={styles.recordingTitle}>
                      {entry.recording.title}
                    </Text>
                    <View
                      className={styles.recordingTag}
                      style={{
                        backgroundColor:
                        entry.recording.type === 'live'
                          ? 'rgba(13, 148, 136, 0.08)'
                          : 'rgba(99, 102, 241, 0.08)',
                        color:
                          entry.recording.type === 'live' ? '#0D9488' : '#6366F1',
                      }}
                    >
                      <Text className={styles.recordingTagText}>
                        {entry.recording.type === 'live' ? '现场录音' : '文件导入'}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.recordingMeta}>
                    <Text className={styles.recordingMetaText}>
                      发言时长：{formatDuration(entry.totalDuration)}</Text>
                      <Text className={styles.recordingMetaText}>
                      {entry.recording.createdAt}
                    </Text>
                  </View>
                  {entry.latestSpeakerLabel && (
                    <Text className={styles.recordingSpeaker}>
                      发言人：{entry.latestSpeakerLabel}
                    </Text>
                  )}
                  <View className={styles.recordingActions}>
                    <View
                      className={styles.recordingActionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRecording(entry.recording.id);
                      }}
                    >
                      <Text className={styles.recordingActionText}>查看录音</Text>
                    </View>
                    {entry.notes.length > 0 && (
                      <View
                        className={styles.recordingActionBtnPrimary}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (entry.notes[0] && handleOpenNote(entry.notes[0].id));
                        }}
                      >
                        <Text className={styles.recordingActionTextPrimary}>
                          查看笔记 ({entry.notes.length})
                        </Text>
                      </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className={styles.emptyBlock}>
              <Text className={styles.emptyText}>暂无参与的录音</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.deleteBtn} onClick={handleDelete}>
          <Text className={styles.deleteBtnText}>删除成员</Text>
        </View>
      </View>
    </View>
  );
};

export default MemberDetailPage;
