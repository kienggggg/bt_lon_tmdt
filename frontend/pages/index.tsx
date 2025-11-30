import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { eventApi } from '../services/api';
import { Event } from '../types';
import MainLayout from '../components/MainLayout';
import { useAuth } from '@/context/AuthContext'; // Import Auth

export default function Home() {
  const { user } = useAuth(); // Lấy thông tin user
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res: any = await eventApi.getAll();
        if (res.data && Array.isArray(res.data)) {
          setEvents(res.data);
        }
      } catch (err) {
        console.error("Lỗi tải sự kiện:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getGradient = (id: string) => {
    const colors = [
      'from-pink-500 to-rose-500', 'from-blue-400 to-indigo-500',
      'from-emerald-400 to-cyan-500', 'from-orange-400 to-red-500',
      'from-purple-500 to-violet-500',
    ];
    return colors[id.charCodeAt(0) % colors.length];
  };

  return (
    <MainLayout>
      <Head>
        <title>EventPass - Thế giới sự kiện trong tầm tay</title>
      </Head>

      {/* --- PHẦN HERO BANNER (Thay đổi tùy theo trạng thái đăng nhập) --- */}
      <div className="relative bg-white overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          
          {user ? (
            // 1. GIAO DIỆN KHI ĐÃ ĐĂNG NHẬP (Chào mừng & Gợi ý)
            <div className="text-center md:text-left">
              <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-4">
                👋 Chào mừng trở lại, {user.email.split('@')[0]}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Hôm nay bạn muốn <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  tham gia sự kiện gì?
                </span>
              </h1>
              {/* Hiển thị Gợi ý theo Role */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg inline-block border border-gray-200">
                 <p className="text-gray-600">
                    🎯 Gợi ý dành riêng cho: <span className="font-bold text-blue-600 capitalize">
                      {user.role === 'student' ? 'Sinh viên/Cá nhân' : 
                       user.role === 'professional' ? 'Chuyên gia' : 
                       user.role === 'organizer' ? 'Người tổ chức' : 
                       user.role || 'Người dùng'}
                    </span>
                 </p>
              </div>
            </div>
          ) : (
            // 2. GIAO DIỆN KHI CHƯA ĐĂNG NHẬP (Banner Quảng cáo cũ)
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Săn vé sự kiện</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  đẳng cấp & dễ dàng
                </span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Khám phá hàng ngàn workshop, talkshow công nghệ. Đặt vé chỉ trong 30 giây.
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                 <div className="rounded-md shadow">
                  <a href="#events-list" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                    Khám phá ngay
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- DANH SÁCH SỰ KIỆN (Giữ nguyên giao diện đẹp) --- */}
      <div id="events-list" className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
               <h2 className="text-2xl font-bold text-gray-900">Sự kiện nổi bật</h2>
               <p className="text-gray-500 mt-1">Được tuyển chọn kỹ lưỡng dành cho bạn</p>
            </div>
            {/* Bộ lọc nhanh (UI Only) */}
            <div className="hidden md:flex gap-2">
                <button className="px-4 py-2 bg-white border rounded-full text-sm font-medium shadow-sm hover:bg-gray-50">Tất cả</button>
                <button className="px-4 py-2 bg-white border rounded-full text-sm font-medium shadow-sm hover:bg-gray-50">Online</button>
                <button className="px-4 py-2 bg-white border rounded-full text-sm font-medium shadow-sm hover:bg-gray-50">Offline</button>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
               [1, 2, 3].map((n) => (
                 <div key={n} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse h-96"></div>
               ))
            ) : events.length > 0 ? (
              events.map((event) => (
                <Link href={`/events/${event.slug}`} key={event.id} className="group h-full">
                  <div className="flex flex-col h-full rounded-2xl shadow-sm bg-white overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                    

                    <div className={`h-48 bg-gradient-to-br ${getGradient(event.id)} flex items-center justify-center relative`}>
                        <span className="text-6xl text-white opacity-20">{event.is_online ? '🌐' : '📍'}</span>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                             {event.is_online ? 'ONLINE' : 'OFFLINE'}
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-2">
                           {new Date(event.start_time).toLocaleDateString('vi-VN')}
                        </p>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {event.title}
                        </h3>
                        <p className="mt-3 text-sm text-gray-500 line-clamp-3">
                          {event.description}
                        </p>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t flex items-center justify-between">
                         <div className="flex items-center text-sm text-gray-500">
                            <span>👥 Ban Tổ Chức</span>
                         </div>
                         <span className="text-blue-600 font-medium text-sm flex items-center">
                            Chi tiết <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                         </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
                <p className="col-span-3 text-center text-gray-500">Chưa có sự kiện nào.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
