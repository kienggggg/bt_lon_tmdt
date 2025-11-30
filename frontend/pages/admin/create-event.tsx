import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { eventApi } from '../../services/api';
import MainLayout from '../../components/MainLayout';
import { useRouter } from 'next/router';

export default function CreateEvent() {
  const router = useRouter();
  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      location: '',
      start_time: '',
      end_time: '',
      is_online: false,
      tickets: [{ name: 'Vé Thường', price: 0, quantity: 100 }] // Mặc định 1 loại vé
    }
  });

  // Quản lý danh sách vé động (Thêm/Xóa loại vé)
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tickets"
  });

  const onSubmit = async (data: any) => {
    try {
      // Tự động tạo slug nếu rỗng
      if (!data.slug) {
        data.slug = data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now();
      }
      
      await eventApi.create(data);
      alert('✅ Tạo sự kiện thành công!');
      router.push('/');
    } catch (error: any) {
      alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không tạo được sự kiện'));
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Tạo sự kiện mới</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
          
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên sự kiện</label>
              <input {...register("title", { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="Ví dụ: Workshop AI..." />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea {...register("description")} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Bắt đầu</label>
                 <input type="datetime-local" {...register("start_time", { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Kết thúc</label>
                 <input type="datetime-local" {...register("end_time", { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
               </div>
            </div>

            <div className="flex items-center gap-4">
                <label className="flex items-center">
                    <input type="checkbox" {...register("is_online")} className="h-4 w-4 text-blue-600" />
                    <span className="ml-2 text-sm text-gray-700">Sự kiện Online</span>
                </label>
            </div>

            {!watch("is_online") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Địa điểm</label>
                  <input {...register("location")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="Hà Nội, TP.HCM..." />
                </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Quản lý vé */}
          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Các loại vé</h3>
                <button type="button" onClick={() => append({ name: '', price: 0, quantity: 0 })} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
                    + Thêm loại vé
                </button>
            </div>
            
            <div className="space-y-3">
                {fields.map((item, index) => (
                    <div key={item.id} className="flex gap-4 items-end border p-3 rounded-lg bg-gray-50">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500">Tên vé</label>
                            <input {...register(`tickets.${index}.name` as const)} className="block w-full border rounded p-1" placeholder="VIP..." />
                        </div>
                        <div className="w-32">
                            <label className="text-xs text-gray-500">Giá (VNĐ)</label>
                            <input type="number" {...register(`tickets.${index}.price` as const)} className="block w-full border rounded p-1" />
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-gray-500">Số lượng</label>
                            <input type="number" {...register(`tickets.${index}.quantity` as const)} className="block w-full border rounded p-1" />
                        </div>
                        <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-2">🗑️</button>
                    </div>
                ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg">
            Tạo sự kiện ngay
          </button>

        </form>
      </div>
    </MainLayout>
  );
}