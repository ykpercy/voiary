'use client';


import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, signUpAction, type AuthState } from '@/app/auth/action';
import { X } from 'lucide-react'; // 导入关闭图标

// 初始状态
const initialAuthState: AuthState = { message: '', success: false };

// Google 图标 SVG 组件
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.245,44,30.028,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

// 优雅的提交按钮
function SubmitButton({ isLoginView, disabled }: { isLoginView: boolean, disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-orange-600 transition-all duration-300 disabled:bg-orange-300 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {pending ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      ) : (
        isLoginView ? '登录' : '创建账户'
      )}
    </button>
  );
}

// 新的认证表单
function AuthForm() {
  const [isLoginView, setIsLoginView] = useState(true);
  
  const [signInState, signInFormAction] = useActionState(signInAction, initialAuthState);
  const [signUpState, signUpFormAction] = useActionState(signUpAction, initialAuthState);

  const state = isLoginView ? signInState : signUpState;
  
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          {isLoginView ? '欢迎回来' : '开启新旅程'}
        </h2>
        <p className="text-gray-500 mt-2">
          {isLoginView ? '登录以继续您的语音日记' : '只需几步，即可开始记录'}
        </p>
      </div>

      <form action={isLoginView ? signInFormAction : signUpFormAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">邮箱地址</label>
          <input
            id="email" name="email" type="email" required
            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码</label>
          <input
            id="password" name="password" type="password" required
            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
          />
        </div>

        {state.message && (
          // <p className="text-sm text-red-600 text-center">{state.message}</p>
          <p className={`text-sm text-center ${state.success ? 'text-green-600' : 'text-red-600'}`}>
            {state.message}
          </p>
        )}
        {signUpState.message && signUpState.success && (
            <p className="text-sm text-green-600 text-center">{signUpState.message}</p>
        )}
        
        <div className="pt-2">
          {/* <SubmitButton isLoginView={isLoginView} /> */}
          {/* 当注册成功后，可以考虑禁用提交按钮 */}
          <SubmitButton isLoginView={isLoginView} disabled={signUpState.success} />
        </div>
      </form>

      {/* <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">或者</span>
        </div>
      </div> */}

      {/* <div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-300"
          onClick={() => {  }}
        >
          <GoogleIcon />
          <span className="text-sm font-medium text-gray-700">使用 Google 账户登录</span>
        </button>
      </div> */}
      
      <p className="mt-8 text-center text-sm text-gray-600">
        {isLoginView ? '还没有账户？' : '已经有账户了？'}
        <button
          type="button"
          onClick={() => setIsLoginView(!isLoginView)}
          className="font-semibold text-orange-600 hover:text-orange-500 ml-1 focus:outline-none focus:underline"
        >
          {isLoginView ? '立即注册' : '直接登录'}
        </button>
      </p>
    </div>
  );
}

// 新的模态框主体
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-0 duration-300"
        onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 sm:p-10 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
        <AuthForm />
      </div>
    </div>
  );
}