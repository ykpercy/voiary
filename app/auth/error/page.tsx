import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center animate-in fade-in-0 duration-500">
        
        {/* 错误图标 */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-10 w-10 text-red-600" aria-hidden="true" />
        </div>

        {/* 标题 */}
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          认证失败
        </h1>

        {/* 描述信息 */}
        <p className="mt-4 text-base text-gray-600">
          抱歉，我们无法完成您的认证。链接可能已过期、已被使用，或存在其他问题。
        </p>

        {/* 返回主页的按钮 */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block rounded-lg bg-orange-500 px-8 py-3 text-center font-semibold text-white shadow-md transition-transform duration-300 hover:scale-105 hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            返回主页重试
          </Link>
        </div>

      </div>
    </div>
  );
}
