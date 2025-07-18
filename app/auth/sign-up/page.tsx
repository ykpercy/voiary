// 文件路径: /app/auth/sign-up/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  const router = useRouter();
  // 这里的 onSuccess 函数是用来做页面跳转的
  
  const handleSuccess = () => {
    router.push('/dashboard'); // 注册成功后跳转到仪表盘
  };

  return (
    <div>
      <SignUpForm onSuccess={handleSuccess}/>
    </div>
  );
}