// 文件路径: /hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // 确保路径正确
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 立即获取当前会话
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    }

    getSession();

    // 监听认证状态的变化 (例如登录、登出)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // 组件卸载时，清除监听器
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}