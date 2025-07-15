import Image from "next/image";
import Voiary from '@/components/Voiary';
import VoiceDiaryLoader from '@/components/VoiceDiaryLoader';
// import dynamic from 'next/dynamic';

// const VoiceDiary = dynamic(() => import('@/components/Voiary'), { 
//   ssr: false,
//   // 可选：添加一个加载状态，提升用户体验
//   loading: () => <p>正在加载语音日记本...</p> 
// });

export default function Home() {
  return (
    <main>
      <VoiceDiaryLoader />
      {/* <Voiary /> */}
    </main>
  );
}
