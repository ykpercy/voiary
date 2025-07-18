'use client';

import { useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { signInAction, AuthState } from '@/app/auth/action';

const initialState: AuthState = { message: '', success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? '登录中...' : '登录'}</button>;
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction] = useActionState(signInAction, initialState);

  useEffect(() => {
    // 只有当服务器返回的状态是 'success' 时，才执行操作
    if (state.success) {
      // 成功登录后调用回调函数 (例如关闭模态框)
      onSuccess();
    }
  },[state.success, onSuccess]);

  return (
    <form action={formAction}>
      {/* 我们只在有错误信息时显示它，因为成功后模态框会关闭，不需要显示成功消息 */}
      {state.message && !state.success && (
        <p style={{ color: 'red' }}>{state.message}</p>
      )}
      <div>
        <label htmlFor="email">邮箱</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="password">密码</label>
        <input id="password" name="password" type="password" required />
      </div>
      <SubmitButton />
    </form>
  );
}