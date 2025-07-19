// 文件路径: app/auth/confirm/page.tsx

import Link from 'next/link';

// 这是一个React服务器组件，不需要 'use client'
export default function VerificationSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 text-center bg-white rounded-2xl shadow-lg">
        
        {/* 绿色对勾图标 */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          邮箱验证成功！
        </h1>

        <p className="mt-4 text-base text-gray-600">
          您的账户已经成功激活。现在，您可以返回首页进行登录。
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-block w-full max-w-xs rounded-lg bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-orange-600 transition-transform transform hover:scale-105"
          >
            返回首页登录
          </Link>
        </div>
      </div>
    </div>
  );
}