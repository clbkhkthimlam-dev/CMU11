import React from 'react';
import { SimulationMode } from '../types/simulation';
import { Network, Server, Wifi, Shield, X, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface HardwareBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: SimulationMode;
  onSelectMode: (mode: SimulationMode) => void;
}

export const HardwareBridgeModal: React.FC<HardwareBridgeModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chế Độ Môi Trường & Hardware Bridge
              </h3>
              <p className="text-xs text-slate-500">
                Phân định rạch ròi giữa Mô phỏng thuần túy (SIMULATION) và Phần cứng vật lý.
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

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 gap-3">
            {/* Mode 1: SIMULATION */}
            <div
              onClick={() => onSelectMode('SIMULATION')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                currentMode === 'SIMULATION'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  1. SIMULATION (Khuyến nghị cho học tập)
                </span>
                {currentMode === 'SIMULATION' && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Đang Hoạt Động
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">
                Mô phỏng 100% độc lập trong trình duyệt: giải động học vi sai 50Hz, raycasting bản đồ, cảm biến khoảng cách, LIDAR, và camera POV 3D. An toàn, không đòi hỏi phần cứng.
              </p>
            </div>

            {/* Mode 2: HARDWARE_BRIDGE */}
            <div
              onClick={() => onSelectMode('HARDWARE_BRIDGE')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                currentMode === 'HARDWARE_BRIDGE'
                  ? 'border-amber-500 bg-amber-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  2. HARDWARE_BRIDGE (Cầu nối trung gian)
                </span>
                {currentMode === 'HARDWARE_BRIDGE' && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Đang Hoạt Động
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">
                Kết nối với daemon trung gian cục bộ (rosbridge_websocket qua cổng 9090) để truyền lệnh `/cmd_vel` và nhận topic `/scan`, `/odom` từ Jetson Nano trên mạng LAN.
              </p>
            </div>

            {/* Mode 3: HARDWARE */}
            <div
              onClick={() => onSelectMode('HARDWARE')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                currentMode === 'HARDWARE'
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  3. HARDWARE (Thiết bị thực tế)
                </span>
                {currentMode === 'HARDWARE' && (
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Đang Hoạt Động
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">
                Chạy trực tiếp trên bo mạch Jetson Nano với cổng GPIO phần cứng thật, camera CSI MIPI và động cơ DC thật. Yêu cầu môi trường Linux/Ubuntu 18.04 và quyền root.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
