import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import MemberCard from '@/components/MemberCard';
import SpeakerTag from '@/components/SpeakerTag';
import EmptyState from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { getSpeakerColor } from '@/utils';
import type { Member } from '@/types/member';

interface PendingSpeaker {
  speakerId: string;
  speakerLabel: string;
  recordingId: string;
  recordingTitle: string;
}

const MemberPage: React.FC = () => {
  const members = useAppStore((s) => s.members);
  const bindVoiceprint = useAppStore((s) => s.bindVoiceprint);
  const recordings = useAppStore((s) => s.recordings);
  const [pendingSpeakers, setPendingSpeakers] = useState<PendingSpeaker[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<PendingSpeaker | null>(null);

  useEffect(() => {
    const pending: PendingSpeaker[] = [];
    recordings.forEach((rec) => {
      if (rec.status === 'completed') {
        const seenSpeakers = new Set<string>();
        rec.segments.forEach((seg) => {
          if (!seenSpeakers.has(seg.speakerId)) {
            seenSpeakers.add(seg.speakerId);
            const isAssigned = members.some((m) =>
              m.voiceprintIds.includes(seg.speakerId)
            );
            if (!isAssigned) {
              pending.push({
                speakerId: seg.speakerId,
                speakerLabel: seg.speakerLabel,
                recordingId: rec.id,
                recordingTitle: rec.title,
              });
            }
          }
        });
      }
    });
    setPendingSpeakers(pending);
  }, [recordings, members]);

  const handleAddMember = () => {
    Taro.showModal({
      title: '添加成员',
      editable: true,
      placeholderText: '输入成员姓名',
      success: (res) => {
        if (res.confirm && res.content) {
          const newMember: Member = {
            id: `mem_${Date.now()}`,
            name: res.content,
            avatar: `https://picsum.photos/id/${64 + members.length}/200/200`,
            role: '成员',
            voiceprintIds: [],
            color: getSpeakerColor(members.length),
            joinDate: new Date().toISOString().split('T')[0],
          };
          useAppStore.getState().addMember(newMember);
          Taro.showToast({ title: '成员已添加', icon: 'success' });
          console.info('[Member] New member added:', res.content);
        }
      },
    });
  };

  const handleSpeakerTap = (speaker: PendingSpeaker) => {
    setSelectedSpeaker(speaker);
    console.info('[Member] Speaker selected for binding:', speaker.speakerLabel);
  };

  const handleBindMember = (member: Member) => {
    if (selectedSpeaker) {
      bindVoiceprint(member.id, selectedSpeaker.speakerId);
      Taro.showToast({
        title: `已将${selectedSpeaker.speakerLabel}分配给${member.name}`,
        icon: 'success',
      });
      setSelectedSpeaker(null);
      console.info('[Member] Voiceprint bound:', selectedSpeaker.speakerId, '->', member.name);
    }
  };

  const handleMemberClick = (member: Member) => {
    if (selectedSpeaker) {
      handleBindMember(member);
    } else {
      Taro.navigateTo({
        url: `/pages/memberDetail/index?id=${member.id}`,
      });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.topBar}>
        <Text className={styles.topTitle}>成员名片</Text>
        <View className={styles.addBtn} onClick={handleAddMember}>
          <Text className={styles.addBtnText}>+ 添加成员</Text>
        </View>
      </View>

      {pendingSpeakers.length > 0 && (
        <View className={styles.pendingSection}>
          <Text className={styles.pendingTitle}>待分配发言人</Text>
          <Text className={styles.pendingDesc}>
            点击发言人，再点击成员头像完成分配
          </Text>
          <View className={styles.pendingList}>
            {pendingSpeakers.map((spk, idx) => (
              <SpeakerTag
                key={`${spk.speakerId}_${spk.recordingId}`}
                label={spk.speakerLabel}
                color={getSpeakerColor(idx)}
                onClick={() => handleSpeakerTap(spk)}
              />
            ))}
          </View>
        </View>
      )}

      {members.length > 0 ? (
        <View className={styles.memberGrid}>
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onClick={handleMemberClick}
            />
          ))}
        </View>
      ) : (
        <EmptyState icon="👥" message="还没有成员，点击右上角添加" />
      )}

      {selectedSpeaker && (
        <View className={styles.bindModal} onClick={() => setSelectedSpeaker(null)}>
          <View className={styles.bindContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.bindHeader}>
              <Text className={styles.bindTitle}>分配声纹</Text>
              <Text className={styles.bindClose} onClick={() => setSelectedSpeaker(null)}>✕</Text>
            </View>
            <View className={styles.bindSpeaker}>
              <View
                className={styles.bindSpeakerDot}
                style={{ backgroundColor: getSpeakerColor(0) }}
              />
              <Text className={styles.bindSpeakerLabel}>
                {selectedSpeaker.speakerLabel}（{selectedSpeaker.recordingTitle}）
              </Text>
            </View>
            <Text className={styles.bindHint}>点击成员将此发言人分配给他/她</Text>
            <ScrollView scrollY className={styles.bindMemberList}>
              {members.map((member) => (
                <View
                  key={member.id}
                  className={styles.bindMemberItem}
                  onClick={() => handleBindMember(member)}
                >
                  <View
                    className={styles.bindMemberAvatar}
                    style={{ backgroundColor: member.color }}
                  >
                    <Text className={styles.bindMemberAvatarText}>
                      {member.name.charAt(0)}
                    </Text>
                  </View>
                  <View className={styles.bindMemberInfo}>
                    <Text className={styles.bindMemberName}>{member.name}</Text>
                    <Text className={styles.bindMemberRole}>{member.role}</Text>
                  </View>
                  {member.voiceprintIds.includes(selectedSpeaker.speakerId) && (
                    <Text className={styles.bindMemberCheck}>✓</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default MemberPage;
