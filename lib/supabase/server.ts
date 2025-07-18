import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 这是一个在服务器端（Server Components, Route Handlers, Server Actions）
// 创建 Supabase 客户端的函数。
export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 当在 Server Actions 或 Route Handlers 中设置 cookie 时，
            // Next.js 会抛出错误，因为请求已经结束。这是预期行为，可以安全地忽略。
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // 同上
          }
        },
      },
    }
  )
}