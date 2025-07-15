import Image from "next/image";
import Voiary from '@/components/Voiary';
// import VoiceDiaryLoader from '@/components/VoiceDiaryLoader';
// import dynamic from 'next/dynamic';



export default function Home() {
  return (
    <main>
      {/* <VoiceDiaryLoader /> */}
      <Voiary />
    </main>
  );
}
