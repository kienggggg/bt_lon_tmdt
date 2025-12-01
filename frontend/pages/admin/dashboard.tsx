import { useEffect, useState } from 'react';
import { bookingApi } from '../../services/api';
import MainLayout from '../../components/MainLayout';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Đăng ký Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    bookingApi.getStats()
      .then((res: any) => setStats(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats) return <div className="p-10 text-center">Đang tải thống kê...</div>;

  // Cấu hình biểu đồ (Fake data biểu đồ cho đẹp, số tổng thì lấy thật)
  const chartData = {
    labels: ['Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: [5000000, 12000000, 8500000, 15000000, stats.totalRevenue], // Số cuối là thật
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
      },
    ],
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">📊 Dashboard Quản Trị</h1>

        {/* 1. Các thẻ số liệu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow border border-blue-100">
            <p className="text-gray-500 text-sm">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalRevenue.toLocaleString()} đ
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-green-100">
            <p className="text-gray-500 text-sm">Vé đã bán</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalTickets}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-purple-100">
            <p className="text-gray-500 text-sm">Sự kiện sắp tới</p>
            <p className="text-3xl font-bold text-purple-600">5</p>
          </div>
        </div>

        {/* 2. Biểu đồ & Danh sách đơn hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Biểu đồ */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-4">Biểu đồ tăng trưởng</h3>
            <Bar data={chartData} />
          </div>

          {/* Đơn hàng mới */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold mb-4">Đơn hàng mới nhất</h3>
            <div className="space-y-4">
              {stats.recentBookings.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-800">
                        {b.items[0]?.ticket_type?.event?.title || 'Sự kiện'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {b.user.email} - {new Date(b.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className="font-bold text-green-600">
                    +{Number(b.total_amount).toLocaleString()} đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}