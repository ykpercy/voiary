import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET 请求：获取当前登录用户的日记列表
export async function GET() {
  const supabase = createClient();

  // 1. 获取当前用户会话
  // const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  // 如果没有会话，则用户未登录，返回 401 未授权错误
  // if (!session) {
  //   return new NextResponse(JSON.stringify({ error: '未经授权' }), { status: 401 });
  // }
  if (!user) { // 检查 user 对象是否存在
    return new NextResponse(JSON.stringify({ error: '未经授权' }), { status: 401 });
  }

  // 2. 从数据库查询。RLS 策略会自动过滤，确保只返回该用户的日记
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // 3. 格式化并返回数据
  const entries = data.map(entry => ({
    id: entry.id,
    date: new Date(entry.created_at).toISOString().split('T')[0],
    time: new Date(entry.created_at).toTimeString().slice(0, 5),
    duration: entry.duration,
    audioUrl: entry.audio_url,
    transcript: entry.transcript,
    timestamp: new Date(entry.created_at).getTime(),
  }));

  return NextResponse.json(entries);
}

// POST 请求：为当前登录用户创建一个新的日记
export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  // 1. 同样，先检查用户会话
  // const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  // if (!session) {
  //   return new NextResponse(JSON.stringify({ error: '未经授权' }), { status: 401 });
  // }
  if (!user) { // 检查 user 对象是否存在
    return new NextResponse(JSON.stringify({ error: '未经授权' }), { status: 401 });
  }

  const formData = await request.formData();
  const audioBlob = formData.get('audio') as Blob | null;
  const duration = formData.get('duration') as string | null;

  if (!audioBlob || !duration) {
    return NextResponse.json({ error: '缺少音频文件或时长信息' }, { status: 400 });
  }

  // 2. 上传文件到 Storage，最好以用户ID作为路径前缀
  const fileName = `${user.id}/${Date.now()}.webm`;
  const { error: uploadError } = await supabase.storage
    .from('audio-uploads')
    .upload(fileName, audioBlob);

  if (uploadError) {
    // throw new Error(`Storage Error: ${uploadError.message}`);
    // 为了更好的错误处理，建议返回 JSON 格式的错误
    return NextResponse.json({ error: `Storage Error: ${uploadError.message}` }, { status: 500 });
  }
  
  // 3. 获取文件的公开 URL
  const { data: publicUrlData } = supabase.storage
    .from('audio-uploads')
    .getPublicUrl(fileName);

  // 4. 将日记元数据插入数据库。RLS 策略会自动将 session.user.id 填入 user_id 字段
  const { data: dbData, error: dbError } = await supabase
    .from('diaries')
    .insert({
      duration: parseInt(duration, 10),
      audio_url: publicUrlData.publicUrl,
      transcript: '这是新录制的日记，转录进行中...',
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database Error: ${dbError.message}`);
  }
  
  // 5. 返回与前端接口一致的数据结构
  const responseEntry = {
      id: dbData.id,
      date: new Date(dbData.created_at).toISOString().split('T')[0],
      time: new Date(dbData.created_at).toTimeString().slice(0, 5),
      duration: dbData.duration,
      audioUrl: dbData.audio_url,
      transcript: dbData.transcript,
      timestamp: new Date(dbData.created_at).getTime(),
  };

  return NextResponse.json(responseEntry, { status: 201 });
}