import React, { useState } from 'react';
import { WorldMap, MapObstacle, MapWaypoint, MapMarker } from '../types/map';
import { BUILT_IN_MAPS } from '../data/mapsData';
import { Map, Download, Upload, Plus, Trash2, X, Check, AlertCircle } from 'lucide-react';

interface MapEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMap: WorldMap;
  onSelectMap: (map: WorldMap) => void;
  onUpdateMap: (map: WorldMap) => void;
}

export const MapEditorModal: React.FC<MapEditorModalProps> = ({
  isOpen,
  onClose,
  currentMap,
  onSelectMap,
  onUpdateMap,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentMap, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentMap.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.id || !parsed.bounds || !Array.isArray(parsed.obstacles)) {
        throw new Error('Dữ liệu JSON thiếu trường bắt buộc (id, bounds, obstacles).');
      }
      if (parsed.bounds.minX >= parsed.bounds.maxX || parsed.bounds.minZ >= parsed.bounds.maxZ) {
        throw new Error('Tọa độ bounds không hợp lệ (min >= max).');
      }
      onUpdateMap(parsed);
      setSuccessMessage('Đã nạp bản đồ thành công!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Cú pháp JSON không hợp lệ.');
    }
  };

  const handleAddBoxObstacle = () => {
    const newObs: MapObstacle = {
      id: `box_${Date.now()}`,
      type: 'box',
      xM: 0,
      zM: 0,
      widthM: 0.8,
      depthM: 0.8,
      heightM: 0.4,
      color: '#F97316',
      name: 'Khối hộp mới',
    };
    const updated = {
      ...currentMap,
      obstacles: [...currentMap.obstacles, newObs],
    };
    onUpdateMap(updated);
  };

  const handleDeleteObstacle = (id: string) => {
    const updated = {
      ...currentMap,
      obstacles: currentMap.obstacles.filter(o => o.id !== id),
    };
    onUpdateMap(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Trình Quản Lý & Biên Tập Bản Đồ (World Editor)
              </h3>
              <p className="text-xs text-slate-500">
                Chọn bản đồ mẫu, thêm vật cản hoặc xuất/nhập tệp JSON schema.
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
        <div className="p-6 overflow-y-auto max-h-[65vh] flex flex-col gap-5 text-xs">
          {/* Preset Maps Selection */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-800">Chọn Bản Đồ Mẫu Có Sẵn:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BUILT_IN_MAPS.map(m => (
                <button
                  key={m.id}
                  onClick={() => onSelectMap(m)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    m.id === currentMap.id
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-slate-900">{m.name}</span>
                  <span className="text-[11px] text-slate-500 line-clamp-2">{m.description}</span>
                  <span className="text-[10px] text-blue-600 font-mono mt-1">
                    {m.bounds.maxX - m.bounds.minX}m × {m.bounds.maxZ - m.bounds.minZ}m · {m.obstacles.length} vật cản
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Obstacle List & Quick Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Danh Sách Vật Cản Hiện Tại ({currentMap.obstacles.length}):
              </span>
              <button
                onClick={handleAddBoxObstacle}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Khối Hộp (0.8m)</span>
              </button>
            </div>

            <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50">
              {currentMap.obstacles.map(o => (
                <div
                  key={o.id}
                  className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-slate-200 text-[11px]"
                >
                  <span className="font-mono font-medium text-slate-800">
                    {o.id} ({o.type}) · x={o.xM}m, z={o.zM}m, {o.widthM}m × {o.depthM}m
                  </span>
                  <button
                    onClick={() => handleDeleteObstacle(o.id)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    title="Xóa vật cản"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Export & Import */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Xuất / Nhập JSON Schema:</span>
              <button
                onClick={handleExportJson}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Về JSON ({currentMap.id}.json)</span>
              </button>
            </div>

            <textarea
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              placeholder='Dán nội dung JSON bản đồ vào đây để nhập...'
              className="w-full h-24 p-2.5 bg-slate-950 text-slate-100 font-mono text-[11px] rounded-lg border border-slate-800 outline-none resize-none"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={handleImportJson}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập Bản Đồ Từ JSON</span>
              </button>

              {errorMessage && (
                <span className="text-red-600 text-xs font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errorMessage}
                </span>
              )}
              {successMessage && (
                <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {successMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
