// app/api/public-diaries/route.ts

import { createClient } from '@/lib/supabase/server'
// import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 确保每次都是动态请求

export async function GET() {
//   const supabase = createRouteHandlerClient({ cookies });
  const supabase = await createClient();

  try {
    // 查询所有 is_public 为 true 的日记
    // 为了保护隐私，可以考虑不返回 user_id，或者后续连接用户表返回昵称
    // 按创建时间倒序排序，最新的在前面
    const { data: publicDiaries, error } = await supabase
      .from('diaries')
      .select('id, date, time, duration, audio_url, transcript') // 注意：这里没有选择 user_id
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20); // 限制返回数量，防止过载

    if (error) {
      throw error;
    }

    return NextResponse.json(publicDiaries);
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: '获取公开日记失败', details: error.message }),
      { status: 500 }
    );
  }
}