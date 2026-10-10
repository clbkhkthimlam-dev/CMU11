import React from 'react';
import { SimulationMode, SimulationStatus } from '../types/simulation';
import {
  ShieldAlert,
  Play,
  Pause,
  Square,
  AlertOctagon,
  RefreshCw,
  Cpu,
  BookOpen,
  CheckCircle2,
  Map,
  Moon,
  Sun,
  Radio,
  Sliders,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  simulationMode: SimulationMode;
  setSimulationMode: (mode: SimulationMode) => void;
  simulationStatus: SimulationStatus;
  isEmergencyStopped: boolean;
  onEmergencyStop: () => void;
  onResetEmergencyStop: () => void;
  onOpenBridgeModal: () => void;
  onOpenMapGallery: () => void;
  onOpenMapEditor: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentMapName: string;
}

export const Header: React.FC<HeaderProps> = ({
  simulationMode,
  setSimulationMode,
  simulationStatus,
  isEmergencyStopped,
  onEmergencyStop,
  onResetEmergencyStop,
  onOpenBridgeModal,
  onOpenMapGallery,
  onOpenMapEditor,
  isDarkMode,
  onToggleDarkMode,
  currentMapName,
}) => {
  const getStatusBadge = () => {
    if (isEmergencyStopped) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse shadow-sm">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>E-STOP KHẨN CẤP</span>
        </span>
      );
    }
    switch (simulationStatus) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>ĐANG CHẠY</span>
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
            <Pause className="w-3 h-3" />
            <span>TẠM DỪNG</span>
          </span>
        );
      case 'stopped':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500 text-white">
            <Square className="w-3 h-3" />
            <span>ĐÃ DỪNG</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SẴN SÀNG</span>
          </span>
        );
    }
  };

  return (
    <header
      className={`h-16 px-4 sm:px-6 flex items-center justify-between gap-4 border-b shrink-0 z-40 select-none transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Zone 1: Brand & Active Environment */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight">CMU10 Robotics</span>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
              Vibrant STEM Lab
            </span>
          </div>
          <span className={`text-[11px] font-medium truncate max-w-[240px] sm:max-w-[340px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Sa bàn: {currentMapName.split('(')[0]}
          </span>
        </div>
      </div>

      {/* Zone 2: Simulation Status & Map Selection Quick Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Badge */}
        {getStatusBadge()}

        {/* Multi-terrain Maps Gallery Button */}
        <button
          onClick={onOpenMapGallery}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
          }`}
          title="Chọn sa bàn bản đồ thử nghiệm"
        >
          <Map className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">Đổi Sa Bàn</span>
        </button>

        {/* Map Editor Button */}
        <button
          onClick={onOpenMapEditor}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
          }`}
          title="Mở trình chỉnh sửa bản đồ & JSON Schema"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-500" />
          <span className="hidden lg:inline">Biên Tập Map</span>
        </button>

        {/* Environment / Hardware Bridge Mode */}
        <button
          onClick={onOpenBridgeModal}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
            simulationMode === 'HARDWARE'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : simulationMode === 'HARDWARE_BRIDGE'
              ? 'bg-purple-600 text-white border-purple-500'
              : isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title="Cấu hình chế độ mô phỏng hoặc cầu nối Jetson Nano"
        >
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">
            {simulationMode === 'SIMULATION' ? 'Mô Phỏng Ảo' : simulationMode === 'HARDWARE_BRIDGE' ? 'Cầu Nối Bridge' : 'Robot Thật'}
          </span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-xl cursor-pointer transition-colors border ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
          }`}
          title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối (Robotics Dark)'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* BIG EMERGENCY STOP (E-STOP) BUTTON */}
        {!isEmergencyStopped ? (
          <button
            onClick={onEmergencyStop}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-rose-500/30 active:scale-95 shrink-0"
            title="Dừng Khẩn Cấp E-STOP: Khóa toàn bộ động cơ ngay lập tức!"
          >
            <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
            <span className="tracking-wide">E-STOP</span>
          </button>
        ) : (
          <button
            onClick={onResetEmergencyStop}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-500/30 active:scale-95 shrink-0"
            title="Gỡ bỏ trạng thái dừng khẩn cấp và khôi phục hoạt động"
          >
            <RefreshCw className="w-4 h-4 text-white" />
            <span>Mở Khóa E-STOP</span>
          </button>
        )}
      </div>
    </header>
  );
};
