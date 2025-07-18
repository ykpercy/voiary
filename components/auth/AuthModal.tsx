'use client';

import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm'; // 确保你的 SignUpForm 也接受 onSuccess
import './AuthModal.css'; // 我们将为模态框添加一些样式

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLoginView, setIsLoginView] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-tabs">
          <button onClick={() => setIsLoginView(true)} className={isLoginView ? 'active' : ''}>登录</button>
          <button onClick={() => setIsLoginView(false)} className={!isLoginView ? 'active' : ''}>注册</button>
        </div>

        {isLoginView ? (
          <LoginForm onSuccess={onClose} />
        ) : (
          <SignUpForm onSuccess={onClose} />
        )}
      </div>
    </div>
  );
}