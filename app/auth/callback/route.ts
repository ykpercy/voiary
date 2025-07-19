import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 这是一个 GET 路由处理器，因为 Supabase 的重定向是一个 GET 请求
export async function GET(request: Request) {
  // 从请求 URL 中获取 origin 和 code
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // 如果 URL 中有 'next' 参数，我们可以用它来决定最终重定向到哪里
  // const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    // 使用 code 与 Supabase 服务器交换，以获取用户会话
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 如果交换成功，重定向到用户原来的目标页面或主页
      return NextResponse.redirect(`${origin}/auth/confirm`);
    }
  }

  // 如果交换失败或没有 code，重定向到一个错误页面
  // （您也可以创建一个专门的 /auth/error 页面）
  console.error('Authentication callback error');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}