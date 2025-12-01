import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Head>
        <title>EventPass</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 cursor-pointer">
                 <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-1.5 rounded-lg shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                   </svg>
                 </span>
                 <span className="font-bold text-xl tracking-tight text-blue-900">EventPass</span>
              </Link>
            </div>

            {/* Thanh tìm kiếm */}
            <div className="flex-1 max-w-xl hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sự kiện..."
                  className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </form>
            </div>

            {/* Menu bên phải */}
            <div className="flex items-center gap-4">
              {user ? (
  <div className="flex items-center gap-4">
    {/* 👇 THÊM ĐOẠN NÀY: Chỉ hiện nút Tạo sự kiện nếu là Admin/Organizer */}
    {(user.role === 'admin' || user.role === 'organizer') && (
  <div className="flex gap-2 mr-4">
    {/* Nút Tạo sự kiện cũ */}
    <Link href="/admin/create-event">
      <button className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg font-medium hover:bg-purple-200 transition text-sm">
        <span>➕</span> Tạo sự kiện
      </button>
    </Link>

    {/* 👇 THÊM NÚT NÀY: Dẫn sang trang Dashboard */}
    <Link href="/admin/dashboard">
      <button className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium hover:bg-blue-200 transition text-sm">
        <span>📊</span> Thống kê
      </button>
    </Link>
  </div>
)}
    
    <span className="text-sm text-gray-600 hidden md:block">
                    Hi, <span className="font-semibold text-gray-900">{user.email.split('@')[0]}</span>
                  </span>
                  
                  {/* Menu Dropdown đơn giản */}
                  <div className="flex gap-2">
                    <Link href="/user/my-tickets">
                      <button className="text-sm px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition">
                         🎟️ Vé của tôi
                      </button>
                    </Link>
                    
                    <button 
                      onClick={handleLogout}
                      className="text-sm px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                // Chưa đăng nhập
                <div className="flex gap-3">
                  <Link href="/login">
                    <button className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2">
                      Đăng nhập
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition transform active:scale-95">
                      Đăng ký
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- CONTENT --- */}
      <main className="flex-1">
        {children}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-1 text-center text-sm text-gray-400">
            &copy; 2025 EventPass Project. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}