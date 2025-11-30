// frontend/components/EventCard.tsx
import { useAuth } from "@/context/AuthContext";

// ĐỊNH NGHĨA KIỂU DỮ LIỆU (Để sửa lỗi gạch đỏ)
interface EventProps {
  event: {
    title: string;
    is_online: boolean;
    location?: string;
    start_time: string;
    registered_count?: number;
    ticket?: {
      name: string;
      price: number;
    };
    speakers?: {
      name: string;
      avatar_url?: string;
    }[];
    agenda?: {
      time: string;
      topic: string;
    }[];
  };
}

export default function EventCard({ event }: EventProps) {
  // Lấy thông tin user từ AuthContext
  const { user } = useAuth();
  // Lấy user_type (nếu chưa đăng nhập thì là undefined)
  const userType = user?.user_type;

  return (
    <div className="border rounded-lg p-4 shadow-md bg-white mb-4">
      <h2 className="text-xl font-bold">{event.title}</h2>
      <p className="text-sm text-gray-600 mb-2">
        {event.is_online ? "🌐 Online" : `📍 ${event.location}`}
      </p>
      <p className="text-sm text-gray-600 mb-4">
        🕒 {new Date(event.start_time).toLocaleString("vi-VN")}
      </p>

      {/* --- GIAO DIỆN CHO SINH VIÊN (Ưu tiên Giá & Social Proof) --- */}
      {userType === "student" && (
        <div className="bg-green-50 p-3 rounded-md border border-green-200">
          <p className="text-green-700 font-bold">
             Giá vé: {event.ticket?.price.toLocaleString()}đ ({event.ticket?.name})
          </p>
          <p className="text-sm text-blue-600 mt-1">
             🔥 {event.registered_count} bạn sinh viên đã đăng ký!
          </p>
        </div>
      )}

      {/* --- GIAO DIỆN CHO CHUYÊN GIA (Ưu tiên Diễn giả & Agenda) --- */}
      {userType === "professional" && (
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">🎙️ Diễn giả:</span>
            <span className="text-sm font-medium">
              {event.speakers?.[0]?.name || "Đang cập nhật"}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <p className="font-semibold underline">Lịch trình:</p>
            <ul className="list-disc list-inside">
              {event.agenda?.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.time}</strong>: {item.topic}
                </li>
              )) || <li>Chi tiết đang cập nhật</li>}
            </ul>
          </div>
        </div>
      )}

      {/* --- GIAO DIỆN MẶC ĐỊNH (Chưa đăng nhập) --- */}
      {!userType && (
        <p className="text-gray-500 italic text-sm border-t pt-2 mt-2">
          👉 <span className="font-semibold">Đăng nhập</span> để xem ưu đãi dành riêng cho bạn.
        </p>
      )}

      <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
        Xem chi tiết
      </button>
    </div>
  );
}