import { createClient } from '@/lib/supabase/server';
import VoiceDiary from '@/components/Voiary'; // 确保路径正确
import type { Session } from '@supabase/supabase-js';

// 这是一个服务器组件，它只在服务器上运行
export default async function HomePage() {
  const supabase = createClient();

  // 在服务器端获取初始的会话信息
  const { data: { session } } = await supabase.auth.getSession();
  
  // 将 session (包含 user 信息) 作为 prop 传递给客户端组件
  return <VoiceDiary session={session} />;
}
