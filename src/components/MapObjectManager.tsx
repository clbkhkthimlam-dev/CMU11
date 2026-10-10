import React, { useState } from 'react';
import { MapObstacle, WorldMap } from '../types/map';
import {
  Box,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Sliders,
  Move,
  Activity,
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MapObjectManagerProps {
  currentMap: WorldMap;
  selectedObstacleId: string | null;
  onSelectObstacle: (obs: MapObstacle | null) => void;
  onUpdateObstacle: (id: string, updates: Partial<MapObstacle>) => void;
  onDeleteObstacle: (id: string) => void;
  onAddObstacle: (newObs: MapObstacle) => void;
  isDarkMode: boolean;
}

export const MapObjectManager: React.FC<MapObjectManagerProps> = ({
  currentMap,
  selectedObstacleId,
  onSelectObstacle,
  onUpdateObstacle,
  onDeleteObstacle,
  onAddObstacle,
  isDarkMode,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'box' | 'circle' | 'wall' | 'door' | 'dynamic'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newType, setNewType] = useState<'box' | 'circle' | 'wall'>('box');
  const [newName, setNewName] = useState('Chướng ngại vật mới');
  const [newX, setNewX] = useState(0.0);
  const [newZ, setNewZ] = useState(0.0);
  const [newWidth, setNewWidth] = useState(0.8);
  const [newDepth, setNewDepth] = useState(0.8);
  const [newHeight, setNewHeight] = useState(0.4);

  const selectedObs = currentMap.obstacles.find(o => o.id === selectedObstacleId);

  const filteredObstacles = currentMap.obstacles.filter(obs => {
    if (filterType === 'all') return true;
    if (filterType === 'dynamic') return !!obs.isDynamic;
    return obs.type === filterType;
  });

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const created: MapObstacle = {
      id: newId,
      name: newName,
      type: newType,
      xM: newX,
      zM: newZ,
      widthM: newWidth,
      depthM: newDepth,
      radiusM: newType === 'circle' ? newWidth / 2 : undefined,
      heightM: newHeight,
      color: newType === 'circle' ? '#8B5CF6' : newType === 'wall' ? '#334155' : '#2563EB',
      enabled: true,
    };
    onAddObstacle(created);
    setIsAddingNew(false);
    onSelectObstacle(created);
  };

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-3 text-xs ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-blue-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider">
            Quản Lý Vật Cản ({currentMap.obstacles.length})
          </h4>
        </div>

        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingNew ? 'Hủy Thêm' : 'Thêm Vật Cản'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'box', label: 'Khối hộp' },
          { id: 'circle', label: 'Trụ tròn' },
          { id: 'wall', label: 'Tường' },
          { id: 'door', label: 'Cửa trượt' },
          { id: 'dynamic', label: '⚡ Động' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as typeof filterType)}
            className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap cursor-pointer transition-colors ${
              filterType === tab.id
                ? 'bg-blue-600 text-white'
                : isDarkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form: Add New Obstacle */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateNew}
          className={`p-3 rounded-lg border flex flex-col gap-2.5 ${
            isDarkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-blue-50/60 border-blue-200'
          }`}
        >
          <span className="font-bold text-xs text-blue-600 dark:text-blue-400">Tạo vật cản mới:</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Tên vật cản</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className={`w-full px-2 py-1 rounded border text-xs ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Loại hình</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as typeof newType)}
                className={`w-full px-2 py-1 rounded border text-xs ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="box">Khối hộp (Box)</option>
                <option value="circle">Trụ tròn (Circle)</option>
                <option value="wall">Tường chắn (Wall)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
            <div>
              <label className="text-[10px] text-slate-400 block">X (m)</label>
              <input
                type="number"
                step="0.1"
                value={newX}
                onChange={e => setNewX(parseFloat(e.target.value) || 0)}
                className={`w-full px-1.5 py-1 rounded border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">Z (m)</label>
              <input
                type="number"
                step="0.1"
                value={newZ}
                onChange={e => setNewZ(parseFloat(e.target.value) || 0)}
                className={`w-full px-1.5 py-1 rounded border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">Dài (m)</label>
              <input
                type="number"
                step="0.1"
                value={newWidth}
                onChange={e => setNewWidth(Math.max(0.1, parseFloat(e.target.value) || 0.5))}
                className={`w-full px-1.5 py-1 rounded border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">Rộng (m)</label>
              <input
                type="number"
                step="0.1"
                value={newDepth}
                onChange={e => setNewDepth(Math.max(0.1, parseFloat(e.target.value) || 0.5))}
                className={`w-full px-1.5 py-1 rounded border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            Lưu Vật Cản Vào Bản Đồ
          </button>
        </form>
      )}

      {/* Selected Obstacle Properties Card */}
      {selectedObs && (
        <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
          isDarkMode ? 'bg-slate-800/80 border-blue-500/60' : 'bg-blue-50/80 border-blue-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 truncate">
              <Box className="w-3.5 h-3.5" />
              {selectedObs.name || selectedObs.id}
            </span>
            <button
              onClick={() => onSelectObstacle(null)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Location sliders / inputs */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-[10px] text-slate-400 block">Tọa độ X (m):</span>
              <input
                type="number"
                step="0.1"
                value={selectedObs.xM}
                onChange={e => onUpdateObstacle(selectedObs.id, { xM: parseFloat(e.target.value) || 0 })}
                className={`w-full px-2 py-1 rounded border ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Tọa độ Z (m):</span>
              <input
                type="number"
                step="0.1"
                value={selectedObs.zM}
                onChange={e => onUpdateObstacle(selectedObs.id, { zM: parseFloat(e.target.value) || 0 })}
                className={`w-full px-2 py-1 rounded border ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Actions on selected obstacle */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            {/* Enable / Disable toggle */}
            <button
              onClick={() => onUpdateObstacle(selectedObs.id, { enabled: selectedObs.enabled === false ? true : false })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                selectedObs.enabled === false
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
              }`}
            >
              {selectedObs.enabled === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{selectedObs.enabled === false ? 'Đang Tắt Va Chạm' : 'Đang Bật Va Chạm'}</span>
            </button>

            {/* Special door toggle */}
            {selectedObs.type === 'door' && (
              <button
                onClick={() => onUpdateObstacle(selectedObs.id, { isOpen: !selectedObs.isOpen })}
                className="px-2 py-1 bg-cyan-600 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {selectedObs.isOpen ? <DoorOpen className="w-3 h-3" /> : <DoorClosed className="w-3 h-3" />}
                <span>{selectedObs.isOpen ? 'Cửa Mở' : 'Cửa Đóng'}</span>
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={() => {
                onDeleteObstacle(selectedObs.id);
                onSelectObstacle(null);
              }}
              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded cursor-pointer"
              title="Xóa vật cản"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Obstacles List */}
      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
        {filteredObstacles.map(obs => {
          const isSelected = obs.id === selectedObstacleId;
          const isEnabled = obs.enabled !== false;

          return (
            <div
              key={obs.id}
              onClick={() => onSelectObstacle(isSelected ? null : obs)}
              className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 shadow-xs'
                  : isDarkMode
                  ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: obs.color || (isEnabled ? '#3B82F6' : '#94A3B8') }}
                />
                <div className="flex flex-col truncate">
                  <span className={`font-semibold text-xs truncate ${!isEnabled ? 'line-through text-slate-400' : ''}`}>
                    {obs.name || obs.id}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({obs.xM.toFixed(1)}m, {obs.zM.toFixed(1)}m) · {obs.type} {obs.isDynamic ? '· ⚡ Tuần tra' : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onUpdateObstacle(obs.id, { enabled: !isEnabled });
                  }}
                  className={`p-1 rounded cursor-pointer ${
                    isEnabled ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'
                  }`}
                  title={isEnabled ? 'Tắt va chạm vật cản' : 'Bật va chạm vật cản'}
                >
                  {isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}

        {filteredObstacles.length === 0 && (
          <div className="p-4 text-center text-slate-400 text-xs">
            Không có vật cản nào thuộc loại đã lọc.
          </div>
        )}
      </div>
    </div>
  );
};
