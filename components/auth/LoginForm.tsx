'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signInAction, AuthState } from '@/app/auth/action';

const initialState: AuthState = { message: '', success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? '登录中...' : '登录'}</button>;
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction] = useFormState(signInAction, initialState);

  if (state.success) {
    // 成功登录后调用回调函数 (例如关闭模态框)
    onSuccess();
  }

  return (
    <form action={formAction}>
      {state.message && <p style={{ color: 'red' }}>{state.message}</p>}
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