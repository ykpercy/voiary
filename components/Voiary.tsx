// components/Voiary.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Search, Clock, Calendar, LogOut, User} from 'lucide-react';
import { AuthModal } from './auth/AuthModal';
import { signOutAction } from '@/app/auth/action'; // 导入登出 Action
import type { Session } from '@supabase/supabase-js'; // 导入 Session 类型

// Step 1: Define an interface for the diary entry object
interface DiaryEntry {
  id: number;
  date: string;
  time: string;
  duration: number;
  // audioBlob?: Blob; // 在数据库中我们存储 Blob
  audioUrl: string | null;
  transcript: string;
  timestamp: number;
}

const VoiceDiary = ({ session }: { session: Session | null }) => {
  // Step 2: Use the interface to type the state. This fixes the error.
  const user = session?.user;
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 新增 loading 状态
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // 用于控制认证模态框的显示

  const [isRecording, setIsRecording] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  // 新增一个 state 来存储浏览器支持的 MIME 类型
  const [supportedMimeType, setSupportedMimeType] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});

  // Mock initial diary data
  useEffect(() => {
    // 按优先级排列，mp4 优先用于 iOS
    const mimeTypes = [
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
    ];
    const foundSupportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

    if (foundSupportedMimeType) {
      setSupportedMimeType(foundSupportedMimeType);
    } else {
      console.error('浏览器不支持任何可用的录音格式');
      // 在这里可以向用户显示错误提示
    }

    if (user) {
      setIsLoading(true);
      fetch('/api/diaries')
        .then(res => {
          if (res.status === 401) { // 会话过期或无效
            setDiaryEntries([]);
            return null;
          }
          if (!res.ok) throw new Error('获取日记失败');
          return res.json();
        })
        .then((data: DiaryEntry[] | null) => {
          if(data) setDiaryEntries(data);
        })
        .catch(error => {
          console.error("无法获取日记:", error);
          setDiaryEntries([]); // 出错时清空列表
        })
        .finally(() => setIsLoading(false));
    } else {
      // 如果没有用户，直接清空日记列表
      setDiaryEntries([]);
      setIsLoading(false);
    }
    
    // 从后端 API 获取数据
    // async function fetchEntries() {
    //   setIsLoading(true);
    //   try {
    //     const response = await fetch('/api/diaries'); // 直接使用相对路径
    //     if (!response.ok) {
    //       throw new Error('网络响应失败');
    //     }
    //     const entriesFromApi: DiaryEntry[] = await response.json();
    //     setDiaryEntries(entriesFromApi);
    //   } catch (error) {
    //     console.error("无法从服务器获取日记:", error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // }

    // fetchEntries();
  }, [user]); // 依赖数组中加入 user，当用户登录或登出时，此 effect 会重新运行

  // 点击录音按钮的逻辑
  const handleRecordClick = () => {
    if (user) {
      // 如果用户已登录，执行录音操作
      isRecording ? stopRecording() : startRecording();
    } else {
      // 如果用户未登录，打开认证模态框
      setIsAuthModalOpen(true);
    }
  };

  // Start recording
  const startRecording = async () => {
    // ... (rest of your code remains the same)
    if (!supportedMimeType) {
      alert('抱歉，您的浏览器不支持录音功能。');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // mediaRecorderRef.current = new MediaRecorder(stream);
      // 使用检测到的 MIME 类型初始化 MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedMimeType });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        // audioChunksRef.current.push(event.data);
        // 重要：检查数据块是否为空，防止录制出静音文件
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
      // mediaRecorderRef.current.onstop = async () => { // 注意这里是 async 函数
        // const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Recording failed:', error);
      // 向用户提供更明确的错误提示
      alert('无法开始录音。请确保您已授权麦克风权限，并且网站是通过 HTTPS 访问的。');
    }
  };

  // Stop recording
  // const stopRecording = () => {
  //   if (mediaRecorderRef.current && isRecording) {
  //     mediaRecorderRef.current.stop();
  //     setIsRecording(false);
  //     if (recordingIntervalRef.current) {
  //       clearInterval(recordingIntervalRef.current);
  //     }
  //   }
  // };
  // 改造 2: 停止录音时，将文件上传到服务器
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
        
        const formData = new FormData();
        // 'audio' 必须和后端 API Route 中 `formData.get('audio')` 的键名一致
        formData.append('audio', audioBlob, 'diary-recording.webm'); 
        formData.append('duration', String(recordingTime));

        // 停止计时器和录制状态
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setIsRecording(false);

        try {
          // 发送数据到我们的 API Route
          const response = await fetch('/api/diaries', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('文件上传失败');
          }

          const newEntryFromServer = await response.json();
          // 将服务器返回的新条目添加到列表顶部，实现即时更新
          setDiaryEntries(prev => [newEntryFromServer, ...prev]);

        } catch (error) {
          console.error("上传录音失败:", error);
          alert('抱歉，上传录音失败，请稍后重试。');
        }
      };
      
      mediaRecorderRef.current.stop();
    }
  };

  // Toggle audio playback
  const togglePlayback = (entryId: number) => {
    const audio = audioRefs.current[entryId];
    if (!audio) return;
    
    const isCurrentlyPlaying = currentlyPlaying === entryId;

    // Pause all other audio
    Object.values(audioRefs.current).forEach(a => {
        if (a && a !== audio) {
            a.pause();
        }
    });
    
    if (isCurrentlyPlaying) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      audio.currentTime = 0; // Start from the beginning
      audio.play();
      setCurrentlyPlaying(entryId);
    }
  };
  

  // ... The rest of your component logic ...
  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  // 过滤日记条目
  const filteredEntries = diaryEntries.filter(entry => 
    entry.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.date.includes(searchQuery)
  );
  
  // Attach event listeners for when audio ends
  useEffect(() => {
    const handleEnded = (id: number) => {
      if (currentlyPlaying === id) {
        setCurrentlyPlaying(null);
      }
    };

    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (audio) {
        const onEndedCallback = () => handleEnded(Number(id));
        audio.addEventListener('ended', onEndedCallback);
        
        return () => { // Cleanup function
          audio.removeEventListener('ended', onEndedCallback);
        };
      }
    });
  }, [currentlyPlaying]);

  // JSX 渲染部分保持不变，但可以增加 Loading 状态显示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <p className="text-orange-600 text-lg animate-pulse">正在加载日记...</p>
      </div>
    );
  }


  return (
    <>
      {/* 渲染您的认证模态框 */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100 px-4 py-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-orange-800">Voiary</h1>
                <p className="text-orange-600 text-sm mt-1">语音日记</p>
              </div>
              <div className="flex items-center gap-2">
                {/* 根据登录状态显示不同内容 */}
                {user ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <User className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    {/* 登出按钮是一个表单，用于调用 Server Action */}
                    <form action={signOutAction}>
                      <button type="submit" title="登出" className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors">
                        <LogOut className="h-5 w-5 text-orange-600" />
                      </button>
                    </form>
                  </>
                ) : (
                  <button onClick={() => setIsAuthModalOpen(true)} className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-100 rounded-full hover:bg-orange-200 transition-colors">
                    登录 / 注册
                  </button>
                )}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
                >
                  <Search className="h-5 w-5 text-orange-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          {/* Search Input */}
          {showSearch && (
            <div className="mb-6 animate-in slide-in-from-top-2">
              <input
                type="text"
                placeholder="搜索日记内容或日期..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-orange-200 focus:border-orange-400 focus:outline-none bg-white/80 backdrop-blur-sm"
              />
            </div>
          )}

          {/* Recording UI */}
          <div className="flex flex-col items-center justify-center my-16 mb-8">
            <div className="mb-8">
              <div className="relative">
                <button
                  onClick={handleRecordClick} // 使用新的点击处理器
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-8 w-8 text-white" />
                  ) : (
                    <Mic className="h-8 w-8 text-white" />
                  )}
                </button>
                
                {isRecording && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                      {formatTime(recordingTime)}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-orange-700 mt-6 text-lg text-center">
                {/* {isRecording ? '正在录制...' : '点击开始录制今天的日记'} */}
                {/* 根据登录状态显示不同提示 */}
                {user && (isRecording ? '正在录制...' : '点击开始录制今天的日记')}
              </p>
            </div>
          </div>

          {/* 未登录时的欢迎提示 */}
          {!user && !isLoading && (
            // 修改点 3: 调整了内边距并移除了背景色，使其与页面更融合
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-orange-800">欢迎来到Voiary语音日记</h2>
              <p className="text-orange-600 mt-2">登录后即可开始记录您的生活点滴。</p>
              <button onClick={() => setIsAuthModalOpen(true)} className="mt-6 px-6 py-3 text-white font-semibold bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transition-transform hover:scale-105">
                立即开始
              </button>
            </div>
          )}

          {/* Diary List: 只有登录后才显示 */}
          {user && (
            <div className="space-y-4">
              {isLoading && <p className="text-center text-orange-500 animate-pulse">正在加载日记...</p>}
              {!isLoading && diaryEntries.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-orange-500">还没有日记记录，开始你的第一条语音日记吧！</p>
                </div>
              )}
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-orange-600">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{formatDate(entry.date)}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span className="text-sm">{entry.time}</span>
                    </div>
                    <div className="text-sm text-orange-500">
                      {formatTime(entry.duration)}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-3">
                    {entry.transcript}
                  </p>
                  
                  {entry.audioUrl && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePlayback(entry.id)}
                        className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
                      >
                        {currentlyPlaying === entry.id ? (
                          <Pause className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Play className="h-4 w-4 text-orange-600" />
                        )}
                      </button>
                      
                      <audio
                        ref={el => {audioRefs.current[entry.id] = el}}
                        src={entry.audioUrl}
                        onEnded={() => setCurrentlyPlaying(null)}
                        className="hidden"
                      />
                      
                      <div className="flex-1 h-1 bg-orange-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-400 rounded-full"
                          style={{ width: '0%' }} // Note: A simple progress bar is complex with just CSS. This is a visual placeholder.
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 未登录时的欢迎提示
          {!user && !isLoading && (
              <div className="text-center py-20 bg-white/50 rounded-2xl">
                <h2 className="text-xl font-semibold text-orange-800">欢迎来到Voiary语音日记</h2>
                <p className="text-orange-600 mt-2">登录后即可开始记录您的生活点滴。</p>
                <button onClick={() => setIsAuthModalOpen(true)} className="mt-6 px-6 py-3 text-white font-semibold bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transition-transform hover:scale-105">
                  立即开始
                </button>
              </div>
          )} */}

          {/* {filteredEntries.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-orange-500">没有找到相关的日记记录</p>
            </div>
          )} */}

          {/* {diaryEntries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-orange-500">还没有日记记录，开始你的第一条语音日记吧！</p>
            </div>
          )} */}
        </div>
      </div>
    </>
  );
};

export default VoiceDiary;