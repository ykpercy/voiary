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
      .select('id, created_at, duration, audio_url, transcript, user_display_name')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20); // 限制返回数量，防止过载

    if (error) {
      // 如果查询本身就出错了，直接抛出
      console.error("Supabase query error:", error);
      throw error;
    }

    if (!publicDiaries) {
      // 如果没有数据，返回一个空数组
      return NextResponse.json([]);
    }

    // 步骤 2: 在服务器端格式化数据
    // 将从数据库获取的数据映射成前端需要的格式。
    const formattedPublicDiaries = publicDiaries.map((entry) => {
      const timestamp = new Date(entry.created_at);

      // 从 timestamp 中提取日期 (YYYY-MM-DD)
      const date = timestamp.toISOString().split('T')[0];
      
      // 从 timestamp 中提取时间 (HH:MM:SS)
      const time = timestamp.toTimeString().split(' ')[0];

      return {
        id: entry.id,
        date: date,       // 格式化后的日期字符串
        time: time,       // 格式化后的时间字符串
        duration: entry.duration,
        audioUrl: entry.audio_url, // 注意：前端期望的是 camelCase (audioUrl)
        transcript: entry.transcript,
        // 如果前端的 DiaryEntry 接口需要 timestamp，也可以加上
        // timestamp: timestamp.getTime() 
      };
    });
    
    // 步骤 3: 返回格式化后的数据
    // 现在返回的数据结构与前端的 DiaryEntry 接口完全匹配。
    return NextResponse.json(formattedPublicDiaries);
  } catch (error: any) {
    console.error("Error in /api/public-diaries:", error);
    return new NextResponse(
      JSON.stringify({ error: '获取公开日记失败', details: error.message }),
      { status: 500 }
    );
  }
}