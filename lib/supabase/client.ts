import { createBrowserClient } from '@supabase/ssr'

// 这个函数用于在客户端组件中创建 Supabase 客户端
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

