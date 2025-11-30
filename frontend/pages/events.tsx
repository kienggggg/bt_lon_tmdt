import { useEffect, useState } from "react";
import axios from "axios";
import EventCard from "@/components/EventCard";
import { useAuth } from "@/context/AuthContext";

// Định nghĩa kiểu dữ liệu cho Event
interface Event {
  id: string;
  title: string;
  slug: string;
  is_online: boolean;
  location?: string;
  start_time: string;
  registered_count: number;
  ticket: { name: string; price: number };
  speakers?: { name: string; avatar_url?: string }[];
  agenda?: { time: string; topic: string }[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const { user } = useAuth(); // Lấy thông tin user để hiển thị lời chào

  useEffect(() => {
    // Gọi API Backend thật
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/v1/events");
        setEvents(res.data);
      } catch (error) {
        console.error("Lỗi tải sự kiện:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🎉 Sự kiện nổi bật</h1>
        {user ? (
          <p className="text-blue-600">
            Gợi ý dành riêng cho: <span className="font-bold">{user.user_type === 'student' ? 'Sinh viên' : 'Chuyên gia'}</span>
          </p>
        ) : (
          <p className="text-gray-500">Đăng nhập để xem nội dung được cá nhân hóa cho bạn.</p>
        )}
      </div>

      <div className="grid gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))
        ) : (
          <p className="text-center text-gray-500">Đang tải danh sách sự kiện...</p>
        )}
      </div>
    </div>
  );
}