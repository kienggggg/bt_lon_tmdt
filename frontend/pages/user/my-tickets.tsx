import { useEffect, useState, useRef } from 'react';
import api, { bookingApi } from '../../services/api';
import MainLayout from '../../components/MainLayout';
import Link from 'next/link';
// Import thư viện PDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MyTickets() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Ref để tham chiếu đến các phần tử vé
  const ticketRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    bookingApi.getMyBookings()
      .then((res: any) => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // --- HÀM TẢI PDF ---
  const handleDownloadPDF = async (index: number, bookingId: string) => {
    const ticketElement = ticketRefs.current[index];
    if (!ticketElement) return;

    try {
      // 1. Chụp ảnh thẻ div của vé
      const canvas = await html2canvas(ticketElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      // 2. Tạo file PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`ticket-${bookingId.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("Lỗi xuất PDF:", err);
      alert("Không thể tải vé. Vui lòng thử lại.");
    }
  };

  const [emailLoading, setEmailLoading] = useState<string | null>(null);

  const handleSendEmail = async (bookingId: string) => {
    if(!confirm("Gửi vé về email đăng ký của bạn?")) return;
    
    setEmailLoading(bookingId);
    try {
        await bookingApi.sendEmail(bookingId);
        alert("✅ Email đã được gửi! Vui lòng kiểm tra hộp thư (cả mục Spam nhé).");
    } catch (err: any) {
        alert("❌ Lỗi: " + (err.response?.data?.message || "Không gửi được email."));
    } finally {
        setEmailLoading(null);
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải vé...</div>;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">🎟️ Vé của tôi</h1>
        
        {bookings.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">Bạn chưa mua vé nào.</p>
            <Link href="/" className="text-blue-600 hover:underline">Khám phá sự kiện ngay</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {bookings.map((booking, index) => (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                
                {/* --- PHẦN NÀY SẼ ĐƯỢC IN RA PDF (Gán Ref vào đây) --- */}
                <div ref={(el: any) => (ticketRefs.current[index] = el)} className="bg-white">
                    {/* Header Vé */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                       <span className="text-sm text-gray-500">Mã đơn: #{booking.id.slice(0, 8).toUpperCase()}</span>
                       <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                         ĐÃ THANH TOÁN
                       </span>
                    </div>

                    {/* Chi tiết vé */}
                    <div className="p-6">
                      {booking.items.map((item: any) => (
                        <div key={item.id} className="flex flex-col md:flex-row gap-6 items-start">
                           {/* Gradient Background cho đẹp khi in */}
                           <div className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white relative overflow-hidden">
                              <h3 className="text-2xl font-bold mb-2">{item.ticket_type.event.title}</h3>
                              <p className="mb-4 opacity-90">📅 {new Date(item.ticket_type.event.start_time).toLocaleString('vi-VN')}</p>
                              
                              <div className="flex justify-between items-end border-t border-white/20 pt-4">
                                  <div>
                                      <p className="text-xs opacity-70">Loại vé</p>
                                      <p className="font-semibold">{item.ticket_type.name}</p>
                                  </div>
                                  <div>
                                      <p className="text-xs opacity-70">Số lượng</p>
                                      <p className="font-semibold">x{item.quantity}</p>
                                  </div>
                                  <div>
                                      <p className="text-xs opacity-70">Giá vé</p>
                                      <p className="font-semibold">{Number(item.price).toLocaleString()} đ</p>
                                  </div>
                              </div>
                           </div>

                           {/* QR Code */}
                           <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.id}`} 
                                alt="QR Code" 
                                className="w-32 h-32"
                              />
                           </div>
                        </div>
                      ))}
                    </div>
                </div>
                {/* --- KẾT THÚC PHẦN IN PDF --- */}

                {/* Footer Action Buttons */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-4">
                    <button 
                        onClick={() => handleDownloadPDF(index, booking.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        ⬇️ Tải PDF
                    </button>
                    <button 
        onClick={() => handleSendEmail(booking.id)}
    disabled={emailLoading === booking.id}
    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
>
    {emailLoading === booking.id ? 'Dang gửi...' : '📧 Gửi qua Email'}
</button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}