// app/api/diaries/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // 导入我们的 Supabase 客户端
import { promises as fs } from 'fs';
import path from 'path';

// 日记条目的接口，与前端保持一致
interface DiaryEntry {
  id: number;
  date: string;
  time: string;
  duration: number;
  audioUrl: string | null;
  transcript: string;
  timestamp: number;
}

/**
 * @description 获取所有日记列表
 */
// export async function GET() {
//   const entries = await readDb();
//   // 总是返回按时间戳倒序排列的数据
//   const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
//   return NextResponse.json(sortedEntries);
// }

/**
 * @description 从 Supabase 获取所有日记列表
 */
export async function GET() {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false }); // 按创建时间倒序

  if (error) {
    console.error('Supabase GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase 返回的数据字段可能与我们的接口不完全匹配，做一个简单的转换
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

/**
 * @description 上传一个新的语音日记
 */
// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const audioBlob = formData.get('audio') as Blob | null;
//     const duration = formData.get('duration') as string | null;

//     if (!audioBlob || !duration) {
//       return NextResponse.json({ error: '缺少音频文件或时长信息' }, { status: 400 });
//     }

//     // 1. 保存音频文件到 public/uploads 目录
//     const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
//     await fs.mkdir(uploadsDir, { recursive: true }); // 确保目录存在

//     const timestamp = Date.now();
//     const fileName = `${timestamp}.webm`; // 假设文件格式为 webm
//     const filePath = path.join(uploadsDir, fileName);

//     // 将 Blob 转换为 Buffer 并写入文件
//     const buffer = Buffer.from(await audioBlob.arrayBuffer());
//     await fs.writeFile(filePath, buffer);

//     // 2. 创建新的日记条目元数据
//     const audioUrl = `/uploads/${fileName}`; // 文件可以通过这个 URL 访问

//     const newEntry: DiaryEntry = {
//       id: timestamp,
//       date: new Date(timestamp).toISOString().split('T')[0],
//       time: new Date(timestamp).toTimeString().slice(0, 5),
//       duration: parseInt(duration, 10),
//       audioUrl: audioUrl,
//       transcript: '这是刚刚录制的语音日记内容 (来自服务器)。', // 模拟转录
//       timestamp: timestamp,
//     };

//     // 3. 将新条目保存到我们的“数据库”
//     const entries = await readDb();
//     entries.push(newEntry);
//     await writeDb(entries);

//     // 4. 返回成功创建的日记条目
//     return NextResponse.json(newEntry, { status: 201 });

//   } catch (error) {
//     console.error('上传失败:', error);
//     return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
//   }
// }

/**
 * @description 上传一个新的语音日记到 Supabase
*/
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob | null;
    const duration = formData.get('duration') as string | null;

    if (!audioBlob || !duration) {
      return NextResponse.json({ error: '缺少音频文件或时长信息' }, { status: 400 });
    }

    // 1. 上传音频文件到 Supabase Storage
    const fileName = `${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from('audio-uploads') // bucket 名称
      .upload(fileName, audioBlob);

    if (uploadError) {
      console.error('Supabase Storage Error:', uploadError);
      throw new Error('文件上传到 Supabase Storage 失败');
    }

    // 2. 获取上传文件的公开 URL
    const { data: publicUrlData } = supabase.storage
      .from('audio-uploads')
      .getPublicUrl(fileName);

    const audioUrl = publicUrlData.publicUrl;

    // 3. 将日记元数据插入到 Supabase 数据库
    const newEntryData = {
      duration: parseInt(duration, 10),
      audio_url: audioUrl,
      transcript: '这是刚刚录制的语音日记内容 (来自 Supabase)。',
    };
    
    const { data: dbData, error: dbError } = await supabase
      .from('diaries')
      .insert([newEntryData])
      .select() // .select() 会返回插入的数据
      .single(); // 因为只插入一条，所以用 .single()

    if (dbError) {
      console.error('Supabase DB Error:', dbError);
      throw new Error('日记数据写入数据库失败');
    }
    
    // 4. 返回与前端接口一致的数据结构
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

  } catch (error: any) {
    console.error('上传失败:', error);
    return NextResponse.json({ error: error.message || '服务器内部错误' }, { status: 500 });
  }
}
