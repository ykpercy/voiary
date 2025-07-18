// 文件路径: /components/RecordButton.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './auth/AuthModal';

export function RecordButton() {
  const { user, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startRecording = () => {
    // 这里是你的实际录音逻辑
    console.log(`用户 ${user?.email} 开始录音...`);
    alert('开始录音!');
  };

  const handleRecordClick = () => {
    if (loading) {
      // 正在检查认证状态时，按钮可能禁用或显示加载中
      return;
    }

    if (user) {
      // 如果用户已登录，直接开始录音
      startRecording();
    } else {
      // 如果用户未登录，打开认证模态框
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button onClick={handleRecordClick} disabled={loading}>
        {loading ? '...' : '开始录音'}
      </button>

      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}