import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { eventApi } from '../services/api';
import { Event } from '../types';
import MainLayout from '../components/MainLayout';

export default function SearchPage() {
  const router = useRouter();
  const { q, location, is_online, start_date } = router.query;
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState((q as string) || '');
  const [filters, setFilters] = useState({
    location: (location as string) || '',
    is_online: (is_online as string) || '',
    start_date: (start_date as string) || '',
  });

  useEffect(() => {
    // Sync từ URL query params vào state khi component mount hoặc URL thay đổi
    if (q && typeof q === 'string') setSearchQuery(q);
    if (location && typeof location === 'string') setFilters(prev => ({ ...prev, location }));
    if (is_online && typeof is_online === 'string') setFilters(prev => ({ ...prev, is_online }));
    if (start_date && typeof start_date === 'string') setFilters(prev => ({ ...prev, start_date }));
  }, [q, location, is_online, start_date]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params: any = {};
        const queryValue = searchQuery || (typeof q === 'string' ? q : '');
        const locationValue = filters.location || (typeof location === 'string' ? location : '');
        const isOnlineValue = filters.is_online || (typeof is_online === 'string' ? is_online : '');
        const startDateValue = filters.start_date || (typeof start_date === 'string' ? start_date : '');

        if (queryValue) params.q = queryValue;
        if (locationValue) params.location = locationValue;
        if (isOnlineValue) params.is_online = isOnlineValue;
        if (startDateValue) params.start_date = startDateValue;

        const res: any = await eventApi.search(params);
        if (res.data && Array.isArray(res.data)) {
          setEvents(res.data);
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [q, location, is_online, start_date]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push({
      pathname: '/search',
      query: {
        q: searchQuery,
        ...filters,
      },
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

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
        <title>Tìm kiếm sự kiện - EventPass</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Tìm kiếm sự kiện</h1>
          
          {/* Thanh tìm kiếm */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4 flex-col md:flex-row">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên sự kiện..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Bộ lọc */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Bộ lọc nâng cao</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lọc theo địa điểm */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Thành phố</label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Tất cả</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              {/* Lọc Online/Offline */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hình thức</label>
                <select
                  value={filters.is_online}
                  onChange={(e) => handleFilterChange('is_online', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Tất cả</option>
                  <option value="true">Online</option>
                  <option value="false">Offline</option>
                </select>
              </div>

              {/* Lọc theo thời gian */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Thời gian</label>
                <select
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Tất cả</option>
                  <option value={new Date().toISOString().split('T')[0]}>Hôm nay</option>
                  <option value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Tuần này</option>
                  <option value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Tháng này</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Kết quả */}
        <div>
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Đang tìm kiếm...</p>
            </div>
          ) : events.length > 0 ? (
            <>
              <p className="text-gray-600 mb-6">
                Tìm thấy <span className="font-bold text-blue-600">{events.length}</span> sự kiện
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <Link href={`/events/${event.slug}`} key={event.id} className="group">
                    <div className="flex flex-col h-full rounded-2xl shadow-sm bg-white overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                      <div className={`h-48 bg-gradient-to-br ${getGradient(event.id)} flex items-center justify-center relative`}>
                        <span className="text-6xl text-white opacity-20">{event.is_online ? '🌐' : '📍'}</span>
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          {event.is_online ? 'ONLINE' : 'OFFLINE'}
                        </div>
                      </div>
                      <div className="flex-1 p-6">
                        <p className="text-sm font-medium text-blue-600 mb-2">
                          {new Date(event.start_time).toLocaleDateString('vi-VN')}
                        </p>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                          {event.description}
                        </p>
                        <span className="text-blue-600 font-medium text-sm flex items-center">
                          Chi tiết <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">Không tìm thấy sự kiện nào.</p>
              <Link href="/" className="text-blue-600 hover:underline">
                Xem tất cả sự kiện
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

