import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration, generateId } from '@/utils';
import type { NoteItem } from '@/types/member';
import type { Member } from '@/types/member';

const NoteDetailPage: React.FC = () => {
  const notes = useAppStore((s) => s.notes);
  const members = useAppStore((s) => s.members);
  const recordings = useAppStore((s) => s.recordings);
  const updateNote = useAppStore((s) => s.updateNote);
  const [note, setNote] = useState<NoteItem | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addingField, setAddingField] = useState<string | null>(null);
  const [addValue, setAddValue] = useState('');

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

  const getMemberForSpeaker = (speakerId: string): Member | undefined => {
    return members.find((m) => m.voiceprintIds.includes(speakerId));
  };

  if (!note) {
    return (
      <View className={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const recording = recordings.find((r) => r.id === note.recordingId);
  const member = getMemberForSpeaker(note.speakerId);
  const latestSpeakerLabel = recording?.segments.find((s) => s.speakerId === note.speakerId)?.speakerLabel;
  const alias = latestSpeakerLabel || note.memberName || note.speakerId;
  const displayName = member ? `${member.name}（${alias}）` : alias;
  const displayColor = member?.color || note.memberColor || '#86909C';
  const displayRecordingTitle = recording?.title || note.recordingTitle;

  const handleCopy = () => {
    let content = `${displayName} - ${displayRecordingTitle}\n\n`;
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
      success: () => Taro.showToast({ title: '已复制当前发言人', icon: 'success' }),
    });
    console.info('[NoteDetail] Note copied:', displayName);
  };

  const handleExportAll = () => {
    const relatedNotes = notes.filter((n) => n.recordingId === note.recordingId);
    const rec = recordings.find((r) => r.id === note.recordingId);
    const finalTitle = rec?.title || note.recordingTitle;

    let content = `《${finalTitle}》— 会议纪要\n`;
    content += `生成时间：${new Date().toLocaleString('zh-CN')}\n`;
    content += `发言人：${relatedNotes.length} 人\n\n`;
    content += '='.repeat(30) + '\n\n';

    relatedNotes.forEach((n, i) => {
      const m = members.find((mm) => mm.voiceprintIds.includes(n.speakerId));
      const segSpeakerLabel = rec?.segments.find((s) => s.speakerId === n.speakerId)?.speakerLabel;
      const name = m?.name || segSpeakerLabel || n.memberName || n.speakerId;

      content += `【${i + 1}. ${name}】\n\n`;
      if (n.viewpoints.length > 0) {
        content += '· 观点\n';
        n.viewpoints.forEach((v) => (content += `  · ${v}\n`));
        content += '\n';
      }
      if (n.questions.length > 0) {
        content += '· 问题\n';
        n.questions.forEach((q) => (content += `  · ${q}\n`));
        content += '\n';
      }
      if (n.quotes.length > 0) {
        content += '· 引用原句\n';
        n.quotes.forEach((q) => (content += `  "${q.text}" (${formatDuration(q.timestamp)})\n`));
        content += '\n';
      }
      if (
        n.viewpoints.length === 0 &&
        n.questions.length === 0 &&
        n.quotes.length === 0
      ) {
        content += '  暂无记录\n\n';
      }
      content += '-'.repeat(30) + '\n\n';
    });

    Taro.setClipboardData({
      data: content,
      success: () =>
        Taro.showToast({
          title: `已复制${relatedNotes.length}人纪要`,
          icon: 'success',
        }),
    });
    console.info('[NoteDetail] Full summary copied, total speakers:', relatedNotes.length);
  };

  const handleEditItem = (field: string, index: number, currentValue: string) => {
    setEditingField(`${field}_${index}`);
    setEditValue(currentValue);
  };

  const saveEditItem = () => {
    if (!editingField || !editValue.trim()) {
      setEditingField(null);
      return;
    }
    const [field, idxStr] = editingField.split('_');
    const idx = parseInt(idxStr, 10);
    const updated = { ...note };

    if (field === 'viewpoint' && idx < updated.viewpoints.length) {
      updated.viewpoints = [...updated.viewpoints];
      updated.viewpoints[idx] = editValue.trim();
    } else if (field === 'question' && idx < updated.questions.length) {
      updated.questions = [...updated.questions];
      updated.questions[idx] = editValue.trim();
    } else if (field === 'quote' && idx < updated.quotes.length) {
      updated.quotes = [...updated.quotes];
      updated.quotes[idx] = { ...updated.quotes[idx], text: editValue.trim() };
    }

    updateNote(note.id, updated);
    setEditingField(null);
    Taro.showToast({ title: '已保存', icon: 'success' });
    console.info('[NoteDetail] Item edited:', editingField);
  };

  const handleAddItem = (field: string) => {
    setAddingField(field);
    setAddValue('');
  };

  const saveAddItem = () => {
    if (!addingField || !addValue.trim()) {
      setAddingField(null);
      return;
    }
    const updated = { ...note };

    if (addingField === 'viewpoint') {
      updated.viewpoints = [...updated.viewpoints, addValue.trim()];
    } else if (addingField === 'question') {
      updated.questions = [...updated.questions, addValue.trim()];
    } else if (addingField === 'quote') {
      updated.quotes = [...updated.quotes, { id: generateId(), text: addValue.trim(), timestamp: 0 }];
    }

    updateNote(note.id, updated);
    setAddingField(null);
    Taro.showToast({ title: '已添加', icon: 'success' });
    console.info('[NoteDetail] Item added:', addingField);
  };

  const handleDeleteItem = (field: string, index: number) => {
    const updated = { ...note };
    if (field === 'viewpoint') {
      updated.viewpoints = updated.viewpoints.filter((_, i) => i !== index);
    } else if (field === 'question') {
      updated.questions = updated.questions.filter((_, i) => i !== index);
    } else if (field === 'quote') {
      updated.quotes = updated.quotes.filter((_, i) => i !== index);
    }
    updateNote(note.id, updated);
    Taro.showToast({ title: '已删除', icon: 'none' });
    console.info('[NoteDetail] Item deleted:', field, index);
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.avatar} style={{ backgroundColor: displayColor }}>
          <Text className={styles.avatarText}>{displayName.charAt(0)}</Text>
        </View>
        <View className={styles.headerInfo}>
          <Text className={styles.name}>{displayName}</Text>
          <Text className={styles.recording}>{displayRecordingTitle}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>观点</Text>
            <View className={styles.sectionActions}>
              <Text className={styles.sectionCount}>{note.viewpoints.length}条</Text>
              <Text className={styles.addBtn} onClick={() => handleAddItem('viewpoint')}>+ 添加</Text>
            </View>
          </View>
          {note.viewpoints.length > 0 ? (
            note.viewpoints.map((vp, idx) => (
              <View key={idx} className={styles.itemRow}>
                <View className={styles.itemDot} style={{ backgroundColor: displayColor }} />
                {editingField === `viewpoint_${idx}` ? (
                  <Input
                    className={styles.itemInput}
                    value={editValue}
                    onInput={(e) => setEditValue(e.detail.value)}
                    onBlur={saveEditItem}
                    onConfirm={saveEditItem}
                    autoFocus
                  />
                ) : (
                  <Text className={styles.itemText} onClick={() => handleEditItem('viewpoint', idx, vp)}>{vp}</Text>
                )}
                <Text className={styles.deleteBtn} onClick={() => handleDeleteItem('viewpoint', idx)}>✕</Text>
              </View>
            ))
          ) : (
            <View className={styles.emptySection}>
              <Text className={styles.emptyText}>暂无观点记录</Text>
            </View>
          )}
          {addingField === 'viewpoint' && (
            <View className={styles.addRow}>
              <Input
                className={styles.addInput}
                placeholder="输入新观点..."
                value={addValue}
                onInput={(e) => setAddValue(e.detail.value)}
                onConfirm={saveAddItem}
                autoFocus
              />
              <Text className={styles.confirmBtn} onClick={saveAddItem}>确认</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>问题</Text>
            <View className={styles.sectionActions}>
              <Text className={styles.sectionCount}>{note.questions.length}条</Text>
              <Text className={styles.addBtn} onClick={() => handleAddItem('question')}>+ 添加</Text>
            </View>
          </View>
          {note.questions.length > 0 ? (
            note.questions.map((q, idx) => (
              <View key={idx} className={styles.itemRow}>
                <View className={styles.itemDot} style={{ backgroundColor: '#F59E0B' }} />
                {editingField === `question_${idx}` ? (
                  <Input
                    className={styles.itemInput}
                    value={editValue}
                    onInput={(e) => setEditValue(e.detail.value)}
                    onBlur={saveEditItem}
                    onConfirm={saveEditItem}
                    autoFocus
                  />
                ) : (
                  <Text className={styles.itemText} onClick={() => handleEditItem('question', idx, q)}>{q}</Text>
                )}
                <Text className={styles.deleteBtn} onClick={() => handleDeleteItem('question', idx)}>✕</Text>
              </View>
            ))
          ) : (
            <View className={styles.emptySection}>
              <Text className={styles.emptyText}>暂无问题记录</Text>
            </View>
          )}
          {addingField === 'question' && (
            <View className={styles.addRow}>
              <Input
                className={styles.addInput}
                placeholder="输入新问题..."
                value={addValue}
                onInput={(e) => setAddValue(e.detail.value)}
                onConfirm={saveAddItem}
                autoFocus
              />
              <Text className={styles.confirmBtn} onClick={saveAddItem}>确认</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>引用原句</Text>
            <View className={styles.sectionActions}>
              <Text className={styles.sectionCount}>{note.quotes.length}条</Text>
              <Text className={styles.addBtn} onClick={() => handleAddItem('quote')}>+ 添加</Text>
            </View>
          </View>
          {note.quotes.length > 0 ? (
            note.quotes.map((quote, idx) => (
              <View key={quote.id} className={styles.quoteCard}>
                {editingField === `quote_${idx}` ? (
                  <Input
                    className={styles.itemInput}
                    value={editValue}
                    onInput={(e) => setEditValue(e.detail.value)}
                    onBlur={saveEditItem}
                    onConfirm={saveEditItem}
                    autoFocus
                  />
                ) : (
                  <Text className={styles.quoteText} onClick={() => handleEditItem('quote', idx, quote.text)}>"{quote.text}"</Text>
                )}
                <View className={styles.quoteFooter}>
                  <Text className={styles.quoteTime}>{formatDuration(quote.timestamp)}</Text>
                  <Text className={styles.deleteBtn} onClick={() => handleDeleteItem('quote', idx)}>✕</Text>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptySection}>
              <Text className={styles.emptyText}>暂无引用记录</Text>
            </View>
          )}
          {addingField === 'quote' && (
            <View className={styles.addRow}>
              <Input
                className={styles.addInput}
                placeholder="输入引用原句..."
                value={addValue}
                onInput={(e) => setAddValue(e.detail.value)}
                onConfirm={saveAddItem}
                autoFocus
              />
              <Text className={styles.confirmBtn} onClick={saveAddItem}>确认</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.copyBtn} onClick={handleCopy}>
          <Text className={styles.copyBtnText}>复制当前</Text>
        </View>
        <View className={styles.exportBtn} onClick={handleExportAll}>
          <Text className={styles.exportBtnText}>导出纪要</Text>
        </View>
        <View
          className={styles.editBtn}
          onClick={() => handleAddItem('viewpoint')}
        >
          <Text className={styles.editBtnText}>编辑笔记</Text>
        </View>
      </View>
    </View>
  );
};

export default NoteDetailPage;
