// components/Voiary.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Search, Shuffle, Clock, Calendar } from 'lucide-react';
import { openDB, DBSchema } from 'idb';

// 步骤 2: 定义数据库的结构（Schema），这有助于 TypeScript 类型检查
interface DiaryDB extends DBSchema {
  'diary-entries': {
    key: number;
    value: DiaryEntry;
  };
}

// 步骤 3: 在组件外部，初始化数据库连接。
// 这会返回一个 Promise，我们可以在组件内部 await 它。
const dbPromise = openDB<DiaryDB>('voiary-database', 1, {
  upgrade(db) {
    // 当数据库首次创建或版本升级时，这个函数会被调用
    db.createObjectStore('diary-entries', {
      keyPath: 'id', // 使用日记的 id 作为主键
    });
  },
});


// Step 1: Define an interface for the diary entry object
interface DiaryEntry {
  id: number;
  date: string;
  time: string;
  duration: number;
  audioBlob?: Blob; // 在数据库中我们存储 Blob
  audioUrl: string | null;
  transcript: string;
  timestamp: number;
}

const VoiceDiary = () => {
  // Step 2: Use the interface to type the state. This fixes the error.
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

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

    const mockEntries: DiaryEntry[] = [
      {
        id: 1,
        date: '2024-07-10',
        time: '23:30',
        duration: 120,
        audioUrl: null,
        transcript: '今天工作很充实，完成了一个重要的项目。晚上和朋友聊天很开心。',
        timestamp: new Date('2024-07-10 23:30').getTime()
      },
      {
        id: 2,
        date: '2024-07-09',
        time: '22:45',
        duration: 95,
        audioUrl: null,
        transcript: '今天天气很好，下午去公园散步了。看到很多人在锻炼，感觉很有活力。',
        timestamp: new Date('2024-07-09 22:45').getTime()
      },
      {
        id: 3,
        date: '2024-07-08',
        time: '23:15',
        duration: 180,
        audioUrl: null,
        transcript: '周末在家里整理房间，发现了很多有趣的老照片。回忆满满。',
        timestamp: new Date('2024-07-08 23:15').getTime()
      }
    ];
    setDiaryEntries(mockEntries);
  }, []);

  // 步骤 4: 组件首次加载时，从 IndexedDB 读取历史数据
  useEffect(() => {
    async function loadEntriesFromDB() {
      const db = await dbPromise;
      const entriesFromDb = await db.getAll('diary-entries');
      
      // 将从数据库读出的 Blob 转换为可播放的 URL
      const entriesWithUrl = entriesFromDb.map(entry => ({
        ...entry,
        audioUrl: entry.audioBlob ? URL.createObjectURL(entry.audioBlob) : null,
      }));

      // 按时间倒序排序
      setDiaryEntries(entriesWithUrl.sort((a, b) => b.timestamp - a.timestamp));
    }

    loadEntriesFromDB();
  }, []);

  // 步骤 5: 组件卸载时，清理所有创建的 Object URL 以防止内存泄漏
  useEffect(() => {
    return () => {
      diaryEntries.forEach(entry => {
        if (entry.audioUrl) {
          URL.revokeObjectURL(entry.audioUrl);
        }
      });
    };
  }, [diaryEntries]);

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
      
      // mediaRecorderRef.current.onstop = () => {
      mediaRecorderRef.current.onstop = async () => { // 注意这里是 async 函数
        // const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // 使用与录制时相同的 MIME 类型创建 Blob
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        const newId = Date.now();
        
        const newEntry: DiaryEntry = {
          id: newId,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          duration: recordingTime,
          audioBlob: audioBlob, // 直接保存 Blob 对象
          audioUrl: audioUrl,
          transcript: '正在转录中...',
          timestamp: Date.now()
        };

        // 存入 IndexedDB
        const db = await dbPromise;
        await db.put('diary-entries', newEntry);

        // 为了在界面上立即显示并播放，我们创建一个临时 URL
        const entryForState = {
          ...newEntry,
          audioUrl: URL.createObjectURL(newEntry.audioBlob!),
        };
        
        // setDiaryEntries(prev => [newEntry, ...prev]);
        // 更新组件状态，新日记会显示在列表顶部
        setDiaryEntries(prev => [entryForState, ...prev]);
        
        // Simulate speech-to-text
        // setTimeout(() => {
        //   setDiaryEntries(prev => prev.map(entry => 
        //     entry.id === newEntry.id 
        //       ? { ...entry, transcript: '这是刚刚录制的语音日记内容。' }
        //       : entry
        //   ));
        // }, 2000);

        // 模拟语音转文字（在真实应用中，这部分也应更新到数据库）
        setTimeout(async () => {
          const updatedTranscript = '这是刚刚录制的语音日记内容。';
          // 更新数据库中的转录
          await db.put('diary-entries', { ...newEntry, transcript: updatedTranscript });
          // 更新界面上的转录
          setDiaryEntries(prev => prev.map(entry => 
            entry.id === newId ? { ...entry, transcript: updatedTranscript } : entry
          ));
        }, 2000);
        
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
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
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
  // (No other changes are needed for this specific error)
    // 随机播放
  const randomPlay = () => {
    const playableEntries = diaryEntries.filter(entry => entry.audioUrl);
    if (playableEntries.length === 0) return;
    
    const randomEntry = playableEntries[Math.floor(Math.random() * playableEntries.length)];
    togglePlayback(randomEntry.id);
  };

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-orange-800">语音日记</h1>
              <p className="text-orange-600 text-sm mt-1">记录每一天的美好时光</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
              >
                <Search className="h-5 w-5 text-orange-600" />
              </button>
              <button
                onClick={randomPlay}
                className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
              >
                <Shuffle className="h-5 w-5 text-orange-600" />
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
        <div className="mb-8 text-center">
          <div className="relative">
            <button
              onClick={isRecording ? stopRecording : startRecording}
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
          
          <p className="text-orange-700 mt-6 text-lg">
            {isRecording ? '正在录制...' : '点击开始录制今天的日记'}
          </p>
        </div>

        {/* Diary List */}
        <div className="space-y-4">
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

        {filteredEntries.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-orange-500">没有找到相关的日记记录</p>
          </div>
        )}

        {diaryEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-orange-500">还没有日记记录，开始你的第一条语音日记吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceDiary;