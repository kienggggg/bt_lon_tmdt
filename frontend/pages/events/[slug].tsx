import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { bookingApi, eventApi } from "@/services/api";
import { Event, TicketType } from "@/types";

export default function EventDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (slug) {
      eventApi
        .getBySlug(slug as string)
        .then((res: any) => {
          setEvent(res.data);
          setLoading(false);
          
          // Load related events
          if (res.data?.id) {
            eventApi.getRelated(res.data.id, 4)
              .then((relatedRes: any) => {
                if (relatedRes.data && Array.isArray(relatedRes.data)) {
                  setRelatedEvents(relatedRes.data);
                }
              })
              .catch((err) => console.error("Lỗi tải sự kiện liên quan:", err));
          }
        })
        .catch((err) => {
          console.error("Lỗi tải sự kiện:", err);
          setLoading(false);
        });
    }
  }, [slug]);

  const handleBuyTicket = async (ticket: TicketType) => {
    const token = localStorage.getItem('access_token');
    if (!token || !user) {
      if (confirm("Bạn cần đăng nhập để mua vé. Chuyển đến trang đăng nhập ngay?")) {
        router.push("/login");
      }
      return;
    }

    const confirmMsg = `Xác nhận mua vé "${ticket.name}" với giá ${Number(ticket.price).toLocaleString("vi-VN")} đ?`;
    if (!window.confirm(confirmMsg)) return;

    setProcessingId(ticket.id);
    try {
      const res = await bookingApi.create(ticket.id, 1, false);
      alert("🎉 Đặt vé thành công! Đang chuyển sang cổng thanh toán...");
      if (res.data && res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        router.push("/user/my-tickets");
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      alert(`❌ ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500">Đang tải dữ liệu sự kiện...</div>;
  if (!event) return <div className="p-20 text-center text-red-500">Không tìm thấy sự kiện!</div>;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
              event.is_online ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
            }`}
          >
            {event.is_online ? "🟢 Online Event" : "🏢 Offline Event"}
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{event.title}</h1>

          <div className="flex flex-col md:flex-row gap-6 text-gray-600 mb-6">
            <div className="flex items-center">
              <span className="mr-2">📅</span>
              {new Date(event.start_time).toLocaleString("vi-VN")}
            </div>
            {!event.is_online && (
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                {event.location}
              </div>
            )}
          </div>

          <div className="prose max-w-none text-gray-600 border-t pt-6">
            <h3 className="font-bold text-gray-900 mb-2">Giới thiệu</h3>
            <p>{event.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center">🎟️ Chọn loại vé</h2>
            <p className="text-blue-100 mt-1 text-sm">Vui lòng chọn hạng vé phù hợp với bạn</p>
          </div>

          <div className="p-6 space-y-4">
            {event.ticket_types && event.ticket_types.length > 0 ? (
              event.ticket_types.map((ticket) => (
                <div
                  key={ticket.id}
                  className="group border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row justify-between items-center bg-white"
                >
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {ticket.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Còn lại: <b className="text-gray-800">{ticket.remaining_quantity}</b>
                      </span>
                      {ticket.initial_quantity - ticket.remaining_quantity > 5 && (
                        <span className="text-xs text-orange-500 font-medium">🔥 Đang bán chạy!</span>
                      )}
                    </div>
                    {ticket.start_sale_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        Bán từ {new Date(ticket.start_sale_date).toLocaleDateString("vi-VN")}
                        {ticket.end_sale_date ? ` - ${new Date(ticket.end_sale_date).toLocaleDateString("vi-VN")}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="block text-2xl font-extrabold text-blue-600">
                        {Number(ticket.price).toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-xs text-gray-400">đã bao gồm VAT</span>
                    </div>

                    <button
                      onClick={() => handleBuyTicket(ticket)}
                      disabled={ticket.remaining_quantity <= 0 || processingId === ticket.id}
                      className={`min-w-[140px] px-6 py-3 rounded-lg font-bold text-white shadow-lg transform transition-all active:scale-95 ${
                        ticket.remaining_quantity > 0
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          : "bg-gray-300 cursor-not-allowed shadow-none"
                      }`}
                    >
                      {processingId === ticket.id ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Xử lý...
                        </span>
                      ) : ticket.remaining_quantity > 0 ? (
                        "Mua ngay"
                      ) : (
                        "Hết vé"
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">🚫 Hiện chưa có thông tin vé cho sự kiện này.</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">✨ Có thể bạn sẽ thích</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedEvents.map((relatedEvent) => {
                const getGradient = (id: string) => {
                  const colors = [
                    'from-pink-500 to-rose-500', 'from-blue-400 to-indigo-500',
                    'from-emerald-400 to-cyan-500', 'from-orange-400 to-red-500',
                    'from-purple-500 to-violet-500',
                  ];
                  return colors[id.charCodeAt(0) % colors.length];
                };
                
                return (
                  <a
                    key={relatedEvent.id}
                    href={`/events/${relatedEvent.slug}`}
                    className="group flex flex-col h-full rounded-xl shadow-sm bg-white overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                  >
                    <div className={`h-32 bg-gradient-to-br ${getGradient(relatedEvent.id)} flex items-center justify-center relative`}>
                      <span className="text-4xl text-white opacity-20">{relatedEvent.is_online ? '🌐' : '📍'}</span>
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                        {relatedEvent.is_online ? 'ONLINE' : 'OFFLINE'}
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <p className="text-xs font-medium text-blue-600 mb-1">
                        {new Date(relatedEvent.start_time).toLocaleDateString('vi-VN')}
                      </p>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {relatedEvent.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {relatedEvent.description}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}