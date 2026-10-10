import React from 'react';
import { WorldMap } from '../types/map';
import { BUILT_IN_MAPS } from '../data/mapsData';
import {
  Map,
  CheckCircle2,
  X,
  Compass,
  Box,
  Layers,
  Flag,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface MapGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMapId: string;
  onSelectMap: (map: WorldMap) => void;
  isDarkMode: boolean;
}

export const MapGalleryModal: React.FC<MapGalleryModalProps> = ({
  isOpen,
  onClose,
  currentMapId,
  onSelectMap,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const getThemeTag = (theme: string) => {
    switch (theme) {
      case 'stem_lab':
        return { label: 'Phòng Lab STEM', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
      case 'corridor':
        return { label: 'Hành Lang Văn Phòng', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' };
      case 'track':
        return { label: 'Đường Chạy Thể Thao', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' };
      case 'maze':
        return { label: 'Mê Cung Thử Thách', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' };
      case 'warehouse':
        return { label: 'Kho Hàng Logistics', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300' };
      case 'intersection':
        return { label: 'Giao Lộ Đô Thị', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300' };
      default:
        return { label: 'Thử Nghiệm Ngoài Trời', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Thư Viện Bản Đồ Nhiều Địa Hình (Multi-Terrain Maps)
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Lựa chọn sa bàn mô phỏng thực tế phù hợp với bài học STEM và thử nghiệm cảm biến
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl cursor-pointer transition-colors ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Map Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {BUILT_IN_MAPS.map(map => {
            const isCurrent = map.id === currentMapId;
            const tag = getThemeTag(map.backgroundTheme);
            const widthM = map.bounds.maxX - map.bounds.minX;
            const depthM = map.bounds.maxZ - map.bounds.minZ;
            const numDynamic = map.obstacles.filter(o => o.isDynamic).length;

            return (
              <div
                key={map.id}
                className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? isDarkMode
                      ? 'bg-blue-900/20 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-blue-50/70 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                    : isDarkMode
                    ? 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Active Map Ribbon */}
                {isCurrent && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full shadow-xs border border-blue-200 dark:border-blue-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đang nạp</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${tag.color}`}>
                      {tag.label}
                    </span>
                    {numDynamic > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
                        ⚡ {numDynamic} Vật cản động
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm mb-1">{map.name}</h3>
                  <p className={`text-xs mb-3 line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {map.description}
                  </p>

                  {/* Quick specs */}
                  <div className={`grid grid-cols-3 gap-2 p-2 rounded-lg text-[11px] font-mono mb-4 ${
                    isDarkMode ? 'bg-slate-900/80 border border-slate-700/60' : 'bg-slate-100/80 border border-slate-200'
                  }`}>
                    <div>
                      <span className="block text-[9px] uppercase font-sans text-slate-400">Kích thước:</span>
                      <span className="font-semibold">{widthM.toFixed(0)}m × {depthM.toFixed(0)}m</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-sans text-slate-400">Vật cản:</span>
                      <span className="font-semibold">{map.obstacles.length} chướng ngại</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-sans text-slate-400">AprilTags:</span>
                      <span className="font-semibold">{map.markers.length} bia mốc</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Spawn: ({map.spawn.xM.toFixed(1)}m, {map.spawn.zM.toFixed(1)}m)
                  </span>

                  <button
                    onClick={() => {
                      onSelectMap(map);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                        : isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                    }`}
                  >
                    <span>{isCurrent ? 'Tiếp tục mô phỏng' : 'Nạp bản đồ này'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
          <span>Đã xác thực 7 bản đồ mô phỏng theo chuẩn CMU Robotics Lớp 10 & 11</span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg font-medium cursor-pointer ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
