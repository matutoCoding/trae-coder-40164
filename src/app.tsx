import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { mockRecordings } from '@/data/recordings';
import { mockMembers } from '@/data/members';
import { mockNotes } from '@/data/notes';
import './app.scss';

function App(props) {
  const initFromStorage = useAppStore((s) => s.initFromStorage);
  const storageReady = useAppStore((s) => s.storageReady);
  const recordings = useAppStore((s) => s.recordings);
  const members = useAppStore((s) => s.members);
  const notes = useAppStore((s) => s.notes);
  const setRecordings = useAppStore((s) => s.setRecordings);
  const setMembers = useAppStore((s) => s.setMembers);
  const setNotes = useAppStore((s) => s.setNotes);

  useEffect(() => {
    initFromStorage();
  }, []);

  useEffect(() => {
    if (storageReady) {
      if (recordings.length === 0 && members.length === 0 && notes.length === 0) {
        setRecordings(mockRecordings);
        setMembers(mockMembers);
        setNotes(mockNotes);
        console.info('[App] Loaded mock data (first launch)');
      }
    }
  }, [storageReady]);

  useDidShow(() => {});
  useDidHide(() => {});

  return props.children;
}

export default App;
