import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET 请求：获取当前登录用户的日记列表
export async function GET() {
  const supabase = await createClient();

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
    userDisplayName: entry.user_display_name 
  }));

  return NextResponse.json(entries);
}

// POST 请求：为当前登录用户创建一个新的日记
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
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
  const is_public = formData.get('is_public') === 'true';

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
  
  // 从 user 对象中获取昵称，并提供一个后备值
  const userDisplayName = user.user_metadata?.user_display_name ?? 'vivi';

  // 准备要插入数据库的完整数据对象
  const newDiaryData = {
    user_id: user.id, // 明确提供 user_id 是一个好习惯
    duration: parseInt(duration, 10),
    audio_url: publicUrlData.publicUrl,
    transcript: '语音转文字功能正在开发中...', // 这是一个比之前更好的占位符
    is_public: is_public,
    user_display_name: userDisplayName, // 将获取到的昵称添加到这里
  };

  // 4. 将日记元数据插入数据库。RLS 策略会自动将 session.user.id 填入 user_id 字段
  const { data: dbData, error: dbError } = await supabase
    .from('diaries')
    // .insert({
    //   duration: parseInt(duration, 10),
    //   audio_url: publicUrlData.publicUrl,
    //   transcript: '这是新录制的日记',
    //   is_public: is_public,
    // })
    .insert(newDiaryData) // 使用我们准备好的数据对象
    .select()
    .single();

  if (dbError) {
    // 如果插入失败，最好也从 Storage 中删除刚刚上传的文件，以避免产生孤立文件
    await supabase.storage.from('audio-uploads').remove([fileName]);
    // throw new Error(`Database Error: ${dbError.message}`);
    return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
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
      is_public: dbData.is_public, // --> 5. 将 is_public 也返回，方便前端判断
      userDisplayName: dbData.user_display_name, // (可选)如果需要也可以返回
  };

  return NextResponse.json(responseEntry, { status: 201 });
}