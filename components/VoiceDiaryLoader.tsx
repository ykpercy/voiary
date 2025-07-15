// components/VoiceDiaryLoader.tsx

'use client'; // 声明这是一个客户端组件

import dynamic from 'next/dynamic';

const VoiceDiary = dynamic(() => import('@/components/Voiary'), {
  ssr: false,
  loading: () => <p>正在加载语音日记本...</p>,
});

// 这个组件的唯一作用就是作为客户端边界来加载真正的日记组件
export default function VoiceDiaryLoader() {
  return <VoiceDiary />;
}