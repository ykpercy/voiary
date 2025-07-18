// 文件路径: /components/auth/SignUpForm.tsx
'use client'; // <-- 关键指令，声明这是客户端组件

import { useEffect } from 'react'; // 1. 导入 useEffect Hook
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { signUpAction, AuthState } from '@/app/auth/action';

interface SignUpFormProps {
  onSuccess: () => void;
}

const initialState: AuthState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus(); // 获取表单提交状态
  return (
    <button type="submit" aria-disabled={pending}>
      {pending ? '注册中...' : '注册'}
    </button>
  );
}

// export function SignUpForm() {
//   const [state, formAction] = useFormState(signUpAction, initialState);

//   return (
//     <form action={formAction}>
//       <h2>创建账户</h2>
//       {state.message && (
//         <p style={{ color: state.success ? 'green' : 'red' }}>
//           {state.message}
//         </p>
//       )}
//       <div>
//         <label htmlFor="email">邮箱</label>
//         <input type="email" id="email" name="email" required />
//       </div>
//       <div>
//         <label htmlFor="password">密码</label>
//         <input type="password" id="password" name="password" required />
//       </div>
//       <SubmitButton />
//     </form>
//   );
// }

// 3. 让组件接收 props，并解构出 onSuccess
export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [state, formAction] = useActionState(signUpAction, initialState);

  // 4. 使用 useEffect 来监听 state 的变化
  // 这是在客户端组件中对 Server Action 的结果做出反应的最佳方式
  useEffect(() => {
    // 当服务器返回的状态表明成功时
    if (state.success) {
      // 调用从父组件传入的 onSuccess 函数
      onSuccess();
    }
  }, [state, onSuccess]); // 依赖项数组确保 effect 只在 state 或 onSuccess 变化时运行

  return (
    <form action={formAction}>
      {/* 
        当 state.success 为 true 时，我们不显示消息，
        因为 onSuccess 会被调用，模态框即将关闭。
        我们只在有错误消息时显示它。
      */}
      {state.message && !state.success && (
        <p style={{ color: 'red' }}>
          {state.message}
        </p>
      )}
      
      {/* 表单的其余部分保持不变 */}
      <h2>创建账户</h2>
      <div>
        <label htmlFor="email">邮箱</label>
        <input type="email" id="email" name="email" required />
      </div>
      <div>
        <label htmlFor="password">密码</label>
        <input type="password" id="password" name="password" required />
      </div>
      <SubmitButton />
    </form>
  );
}