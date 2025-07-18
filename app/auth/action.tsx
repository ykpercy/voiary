'use server';

import { createClient } from '@/lib/supabase/server'; 
import { z } from 'zod';
import { redirect } from 'next/navigation';

// 定义输入数据的结构和校验规则
const SignUpSchema = z.object({
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  password: z.string().min(6, { message: '密码长度不能少于6位' }),
});

const SignInSchema = z.object({
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  password: z.string().min(1, { message: '请输入密码' }),
});

export type AuthState = {
  message: string;
  success: boolean;
};

// --- 注册操作 ---
export async function signUpAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient(); // 使用更简洁的方式
  const validatedFields = SignUpSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    return {
      message: errorMessages.email?.[0] || errorMessages.password?.[0] || '输入无效，请检查。',
      success: false,
    };
  }
  
  const { email, password } = validatedFields.data;
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { message: `注册失败: ${error.message}`, success: false };
  }

  // 注册请求成功后，提示用户检查邮箱
  return {
    message: '注册请求成功！请检查您的邮箱以完成验证。',
    success: true,
  };
}

// --- 登录操作 ---
export async function signInAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient(); // 使用更简洁的方式
  const validatedFields = SignInSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { message: '输入无效', success: false };
  }
  
  const { email, password } = validatedFields.data;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: `登录失败: ${error.message}`, success: false };
  }
  
  // 登录成功后，重定向到首页，页面会自动刷新
  redirect('/');
}

// --- 登出操作 ---
export async function signOutAction() {
    const supabase = await createClient(); // 使用更简洁的方式
    await supabase.auth.signOut();
    redirect('/'); // 登出后也重定向到首页
}