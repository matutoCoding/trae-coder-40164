import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import type { Member } from '@/types/member';

interface MemberCardProps {
  member: Member;
  onClick?: (member: Member) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  return (
    <View className={styles.card} onClick={() => onClick?.(member)}>
      <View className={styles.avatarWrap}>
        <Image
          className={styles.avatar}
          src={member.avatar}
          mode="aspectFill"
        />
        {member.voiceprintIds.length > 0 && (
          <View className={styles.badge} style={{ backgroundColor: member.color }}>
            <Text className={styles.badgeText}>{member.voiceprintIds.length}</Text>
          </View>
        )}
      </View>
      <Text className={styles.name}>{member.name}</Text>
      <Text className={styles.role}>{member.role}</Text>
      {member.voiceprintIds.length > 0 && (
        <Text className={styles.voiceprint}>已存声纹</Text>
      )}
    </View>
  );
};

export default MemberCard;
