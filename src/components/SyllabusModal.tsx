import React, { useState } from 'react';
import { SYLLABUS_DATA, CLOS_DATA } from '../data/modulesData';
import { BookOpen, GraduationCap, X, Award, CheckCircle2 } from 'lucide-react';

interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyllabusModal: React.FC<SyllabusModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'schedule' | 'clo' | 'grading' | 'guide'>('schedule');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chương Trình Robotics Lớp 11 (Syllabus CMU 2026–2027)
              </h3>
              <p className="text-xs text-slate-500">
                Phê duyệt theo Quyết định 499/QĐ-ĐHFPT · 35 Tiết học · Nhóm hoạt động trải nghiệm SMART
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center gap-3 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setTab('schedule')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'schedule' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Phân Bố 35 Tiết Học (Schedule)
          </button>
          <button
            onClick={() => setTab('clo')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'clo' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Chuẩn Đầu Ra (LO 1 – LO 30)
          </button>
          <button
            onClick={() => setTab('grading')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'grading' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cấu Trúc Đánh Giá Điểm Số
          </button>
          <button
            onClick={() => setTab('guide')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'guide' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Hướng Dẫn Giảng Dạy & Học Tập
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[62vh]">
          {tab === 'schedule' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3 w-14">Tiết</th>
                    <th className="py-2.5 px-3">Chủ Đề / Tên Bài Học</th>
                    <th className="py-2.5 px-3">Mục Tiêu (LO)</th>
                    <th className="py-2.5 px-3">Ghi Chú Trọng Tâm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SYLLABUS_DATA.map(s => (
                    <tr key={s.sessionNo} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-purple-700">#{s.sessionNo}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{s.topic}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-purple-600">{s.learningOutcomes}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{s.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'clo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CLOS_DATA.map(clo => (
                <div key={clo.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-700 text-xs">{clo.id}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {clo.mapping}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{clo.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{clo.description}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'grading' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex flex-col gap-1">
                  <span className="font-bold text-blue-900">ĐGTX 1 (Hàng tuần)</span>
                  <span className="text-2xl font-bold font-mono text-blue-700">5.0</span>
                  <p className="text-[11px] text-blue-800">Ý thức học tập, mức độ chuyên cần và tích cực tham gia các hoạt động.</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex flex-col gap-1">
                  <span className="font-bold text-indigo-900">ĐGTX 2 (Hàng tuần)</span>
                  <span className="text-2xl font-bold font-mono text-indigo-700">5.0</span>
                  <p className="text-[11px] text-indigo-800">Mức độ hoàn thành các nhiệm vụ học tập theo yêu cầu của GV.</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col gap-1">
                  <span className="font-bold text-amber-900">Đánh Giá Giữa Kỳ</span>
                  <span className="text-2xl font-bold font-mono text-amber-700">20%</span>
                  <p className="text-[11px] text-amber-800">Báo cáo dự án GPIO / Bài kiểm tra thực hành giữa kỳ.</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col gap-1">
                  <span className="font-bold text-emerald-900">Đánh Giá Cuối Kỳ</span>
                  <span className="text-2xl font-bold font-mono text-emerald-700">30%</span>
                  <p className="text-[11px] text-emerald-800">Chấm sản phẩm dự án Mê Cung AprilTag và Báo cáo thuyết minh.</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'guide' && (
            <div className="flex flex-col gap-5 text-xs text-slate-700">
              {/* Teacher's Guide */}
              <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 flex flex-col gap-2.5">
                <h4 className="font-bold text-sm text-purple-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-700" />
                  Hướng Dẫn Dành Cho Giáo Viên (Teacher's Guide)
                </h4>
                <div className="space-y-2 text-slate-700 leading-relaxed">
                  <p>
                    <strong>1. Tổ chức bài học theo phân phối 35 tiết:</strong> Sử dụng 16 mô-đun bài học tương ứng với 5 cụm năng lực: GPIO cơ bản (Tiết 1-12), Động cơ & Cảm biến (Tiết 13-18), Robot di động ROS (Tiết 19-24), Thị giác máy tính AprilTag (Tiết 25-30), và Dự án mê cung tự hành cuối kỳ (Tiết 31-35).
                  </p>
                  <p>
                    <strong>2. Thiết lập kịch bản thực hành:</strong> Giáo viên có thể chọn bản đồ tương ứng (Phòng Thí Nghiệm Cơ Bản, Trường Đua, Mê Cung AprilTag, Kho Logistics), bố trí chướng ngại vật tĩnh/động, quy định điểm xuất phát và tọa độ đích để học sinh lập trình bám tuyến.
                  </p>
                  <p>
                    <strong>3. Chấm điểm tự động và định lượng:</strong> Hướng dẫn học sinh sử dụng tính năng <em>"Xuất Báo Cáo Thực Hành"</em> từ thanh Telemetry. Tệp báo cáo JSON/Văn bản ghi nhận chính xác thời gian hoàn thành, quãng đường, số lần va chạm, độ trôi odometry và sai số tiệm cận đích để làm minh chứng đánh giá chuẩn đầu ra (LO).
                  </p>
                </div>
              </div>

              {/* Student's Guide */}
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col gap-2.5">
                <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  Hướng Dẫn Dành Cho Học Sinh (Student's Guide)
                </h4>
                <div className="space-y-2 text-slate-700 leading-relaxed">
                  <p>
                    <strong>1. Quy trình thực hành chuẩn 4 bước:</strong>
                    <br />• <em>Bước 1:</em> Đọc kỹ mục tiêu và sơ đồ nối dây trong tab Mô-đun Bài Học.
                    <br />• <em>Bước 2:</em> Nạp code mẫu hoặc viết script Python vào khung soạn thảo.
                    <br />• <em>Bước 3:</em> Đặt điểm đích (Auto-Nav Goal) bằng cách nhấp chuột trên bản đồ 2D hoặc chạy kịch bản lệnh.
                    <br />• <em>Bước 4:</em> Theo dõi góc nhìn Camera POV, dữ liệu cảm biến LiDAR và nhấp <em>"Xuất Báo Cáo"</em> khi hoàn thành.
                  </p>
                  <p>
                    <strong>2. Vận hành an toàn và xử lý sự cố:</strong>
                    <br />• Luôn chú ý đèn trạng thái: Xanh (Đang chạy), Vàng (Cảnh báo lệch làn), Đỏ (Va chạm / E-STOP).
                    <br />• Nhấn nút <em>Dừng Khẩn Cấp (E-STOP)</em> nếu robot có nguy cơ đâm vào tường.
                    <br />• Nếu hệ thống báo <code>SENSOR_FAULT</code>, kiểm tra xem LiDAR có bị che khuất không và nhấn nút <em>Xác nhận cảm biến</em> để tiếp tục.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
