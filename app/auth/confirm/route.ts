// import { createClient } from '@/lib/supabase/server';
// import { NextResponse } from 'next/server';

// // 这是一个 GET 路由处理器，因为 Supabase 的重定向是一个 GET 请求
// export async function GET(request: Request) {
//   // 从请求 URL 中获取 origin 和 code
//   const { searchParams, origin } = new URL(request.url);
//   const code = searchParams.get('code');
  
//   // 如果 URL 中有 'next' 参数，我们可以用它来决定最终重定向到哪里
//   // const next = searchParams.get('next') ?? '/';

//   if (code) {
//     const supabase = await createClient();
//     // 使用 code 与 Supabase 服务器交换，以获取用户会话
//     const { error } = await supabase.auth.exchangeCodeForSession(code);
    
//     if (!error) {
//       // 如果交换成功，重定向到用户原来的目标页面或主页
//       return NextResponse.redirect(`${origin}/auth/confirm`);
//     }
//   }

//   // 如果交换失败或没有 code，重定向到一个错误页面
//   // （您也可以创建一个专门的 /auth/error 页面）
//   console.error('Authentication callback error');
//   return NextResponse.redirect(`${origin}/auth/auth-code-error`);
// }

// app/auth/confirm/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // 根据您的实际路径调整

// 处理邮箱验证的 GET 请求
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  
  // 重定向到首页而不是 /account
  const next = '/' // 修改这里，重定向到网站首页
  
  // 创建不包含验证 token 的重定向链接
  const redirectTo = new URL(request.url)
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // 验证成功，重定向到首页
      return NextResponse.redirect(redirectTo)
    }
  }

  // 如果验证失败，重定向到错误页面或首页
  // 您可以选择重定向到首页并显示错误消息，而不是错误页面
  redirectTo.pathname = '/' // 也可以改为 '/error' 如果您有错误页面
  redirectTo.searchParams.set('error', 'verification_failed') // 可选：添加错误参数
  
  return NextResponse.redirect(redirectTo)
}