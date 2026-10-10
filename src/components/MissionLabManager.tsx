import React, { useState } from 'react';
import {
  MissionConfig,
  MissionWaypoint,
  MissionRunMetrics,
  MissionStatus,
  LabAssignment,
  LabGradingResult,
} from '../types/mission';
import { WorldMap } from '../types/map';
import {
  Flag,
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Navigation,
  Compass,
  Award,
  Download,
  Upload,
  FileText,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Target,
  Sparkles,
  BarChart3,
  X,
  Layers,
} from 'lucide-react';

interface MissionLabManagerProps {
  currentMap: WorldMap;
  activeMission: MissionConfig | null;
  missionStatus: MissionStatus;
  currentWaypointIdx: number;
  missionMetrics: MissionRunMetrics | null;
  onStartMission: (config: MissionConfig) => void;
  onPauseMission: () => void;
  onResumeMission: () => void;
  onStopMission: () => void;
  onResetMission: () => void;
  onUpdateMissionConfig: (config: MissionConfig) => void;
  labAssignments: LabAssignment[];
  currentAssignment: LabAssignment | null;
  onSelectAssignment: (assignment: LabAssignment) => void;
  latestGradingResult: LabGradingResult | null;
  onExportReport: () => void;
  onOpenReportModal: () => void;
  isDarkMode?: boolean;
}

export const MissionLabManager: React.FC<MissionLabManagerProps> = ({
  currentMap,
  activeMission,
  missionStatus,
  currentWaypointIdx,
  missionMetrics,
  onStartMission,
  onPauseMission,
  onResumeMission,
  onStopMission,
  onResetMission,
  onUpdateMissionConfig,
  labAssignments,
  currentAssignment,
  onSelectAssignment,
  latestGradingResult,
  onExportReport,
  onOpenReportModal,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'mission_control' | 'waypoints_editor' | 'lab_assignments' | 'grading_audit'>('mission_control');
  const [studentName, setStudentName] = useState('Học Viên CMU');
  const [studentGroup, setStudentGroup] = useState('Nhóm Robotics');

  // Waypoint creation local inputs
  const [newWpName, setNewWpName] = useState('');
  const [newWpX, setNewWpX] = useState('0.0');
  const [newWpZ, setNewWpZ] = useState('0.0');
  const [newWpTol, setNewWpTol] = useState('0.12');

  const waypoints = activeMission?.waypoints || [];
  const currentWp = waypoints[currentWaypointIdx];
  const nextWp = waypoints[currentWaypointIdx + 1];

  const handleAddWaypoint = () => {
    if (!activeMission) return;
    const xM = parseFloat(newWpX) || 0;
    const zM = parseFloat(newWpZ) || 0;
    const tolM = parseFloat(newWpTol) || 0.12;

    const newWp: MissionWaypoint = {
      id: `wp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      order: waypoints.length + 1,
      name: newWpName.trim() || `Điểm ${waypoints.length + 1}`,
      xM,
      zM,
      toleranceM: tolM,
      status: 'PENDING',
    };

    onUpdateMissionConfig({
      ...activeMission,
      waypoints: [...waypoints, newWp],
      updatedAt: new Date().toISOString(),
    });

    setNewWpName('');
  };

  const handleRemoveWaypoint = (id: string) => {
    if (!activeMission) return;
    const updated = waypoints
      .filter(w => w.id !== id)
      .map((w, idx) => ({ ...w, order: idx + 1 }));
    onUpdateMissionConfig({
      ...activeMission,
      waypoints: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleExportMissionJSON = () => {
    if (!activeMission) return;
    const dataStr = JSON.stringify(activeMission, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeMission.id}_mission_config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportMissionJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as MissionConfig;
        if (parsed.id && Array.isArray(parsed.waypoints)) {
          onUpdateMissionConfig(parsed);
        } else {
          alert('Cấu trúc file JSON nhiệm vụ không hợp lệ.');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON nhiệm vụ.');
      }
    };
    reader.readAsText(file);
  };

  const getStatusBadge = () => {
    switch (missionStatus) {
      case 'RUNNING':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white animate-pulse">ĐANG CHẠY</span>;
      case 'PAUSED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white">TẠM DỪNG</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white">HOÀN THÀNH 100%</span>;
      case 'ESTOP_ABORTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white">HỦY DO E-STOP</span>;
      case 'FAILED_OBSTACLE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white">CHẶN VẬT CẢN</span>;
      case 'SENSOR_FAULT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-600 text-white">LỖI CẢM BIẾN</span>;
      case 'MAP_ABORTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-600 text-white">ĐÃ HỦY (ĐỔI MAP)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-600 text-white">SẴN SÀNG</span>;
    }
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm flex flex-col gap-4 text-xs transition-colors ${
      isDarkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Flag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Mission Manager & Robotics Lab</span>
              {getStatusBadge()}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeMission ? `Nhiệm vụ: ${activeMission.title} (${waypoints.length} waypoints)` : 'Chưa chọn nhiệm vụ'}
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab('mission_control')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'mission_control' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Điều Khiển
          </button>
          <button
            onClick={() => setActiveTab('waypoints_editor')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'waypoints_editor' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Waypoints ({waypoints.length})
          </button>
          <button
            onClick={() => setActiveTab('lab_assignments')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'lab_assignments' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Bài Thực Hành
          </button>
          <button
            onClick={() => setActiveTab('grading_audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'grading_audit' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Chấm Điểm & Báo Cáo
          </button>
        </div>
      </div>

      {/* TAB 1: MISSION CONTROL */}
      {activeTab === 'mission_control' && (
        <div className="flex flex-col gap-3">
          {/* Main Action Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {missionStatus !== 'RUNNING' ? (
                <button
                  onClick={() => activeMission && onStartMission(activeMission)}
                  disabled={!activeMission || waypoints.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Bắt Đầu Nhiệm Vụ</span>
                </button>
              ) : (
                <button
                  onClick={onPauseMission}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Tạm Dừng</span>
                </button>
              )}

              {missionStatus === 'PAUSED' && (
                <button
                  onClick={onResumeMission}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Tiếp Tục</span>
                </button>
              )}

              <button
                onClick={onStopMission}
                disabled={missionStatus === 'READY' || missionStatus === 'DRAFT'}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Dừng Lại</span>
              </button>

              <button
                onClick={onResetMission}
                className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt Lại Ban Đầu</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportMissionJSON}
                disabled={!activeMission}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium flex items-center gap-1 cursor-pointer"
                title="Xuất cấu hình nhiệm vụ ra file JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất JSON</span>
              </button>

              <label className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập JSON</span>
                <input type="file" accept=".json" onChange={handleImportMissionJSON} className="hidden" />
              </label>
            </div>
          </div>

          {/* Progress & Current Waypoint HUD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Current Waypoint */}
            <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Waypoint Hiện Tại
              </span>
              {currentWp ? (
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    #{currentWp.order}: {currentWp.name}
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Tọa độ: ({currentWp.xM.toFixed(2)}m, {currentWp.zM.toFixed(2)}m) | Sai số: {currentWp.toleranceM}m
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 italic">Chưa kích hoạt hoặc đã đến đích cuối</span>
              )}
            </div>

            {/* Next Waypoint */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                Waypoint Kế Tiếp
              </span>
              {nextWp ? (
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    #{nextWp.order}: {nextWp.name}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                    Tọa độ: ({nextWp.xM.toFixed(2)}m, {nextWp.zM.toFixed(2)}m)
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 italic">Không có (Đây là điểm cuối cùng)</span>
              )}
            </div>

            {/* Overall Progress Metrics */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Tiến Độ Tuyến Đường:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {waypoints.length > 0
                    ? `${Math.min(100, Math.round(((currentWaypointIdx + (missionStatus === 'COMPLETED' ? 1 : 0)) / waypoints.length) * 100))}%`
                    : '0%'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden my-1">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${waypoints.length > 0 ? ((currentWaypointIdx + (missionStatus === 'COMPLETED' ? 1 : 0)) / waypoints.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Đã qua: {currentWaypointIdx} / {waypoints.length}</span>
                <span>Va chạm: {missionMetrics?.collisionCount || 0}</span>
                <span>Thời gian: {(missionMetrics?.elapsedSimTimeS || 0).toFixed(1)}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WAYPOINTS EDITOR */}
      {activeTab === 'waypoints_editor' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Danh Sách Waypoints Có Thứ Tự ({waypoints.length} Điểm)
            </span>
            <span className="text-[11px] text-slate-500">
              Robot sẽ tự động lập tuyến A* & Pure Pursuit lần lượt qua từng điểm
            </span>
          </div>

          {/* Waypoints Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-2.5 w-12 text-center">#</th>
                  <th className="p-2.5">Tên Trạm / Waypoint</th>
                  <th className="p-2.5">Tọa Độ X (m)</th>
                  <th className="p-2.5">Tọa Độ Z (m)</th>
                  <th className="p-2.5">Dung Sai</th>
                  <th className="p-2.5">Trạng Thái</th>
                  <th className="p-2.5 w-12 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {waypoints.map((wp, idx) => {
                  const isCurrent = idx === currentWaypointIdx;
                  return (
                    <tr
                      key={wp.id}
                      className={isCurrent ? 'bg-blue-50/60 dark:bg-blue-950/30 font-semibold' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
                    >
                      <td className="p-2.5 text-center text-slate-500">{wp.order}</td>
                      <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />}
                        {wp.name}
                      </td>
                      <td className="p-2.5">{wp.xM.toFixed(2)}</td>
                      <td className="p-2.5">{wp.zM.toFixed(2)}</td>
                      <td className="p-2.5">±{wp.toleranceM.toFixed(2)}m</td>
                      <td className="p-2.5">
                        {wp.status === 'REACHED' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã Đến
                          </span>
                        ) : isCurrent ? (
                          <span className="text-blue-600 dark:text-blue-400 font-sans font-bold">Đang Hướng Tới</span>
                        ) : (
                          <span className="text-slate-400 font-sans">Chờ</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleRemoveWaypoint(wp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {waypoints.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-sans italic">
                      Chưa có waypoint nào. Hãy thêm waypoint bằng form bên dưới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Waypoint Form */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Tên Waypoint (vd: Trạm 1)"
              value={newWpName}
              onChange={e => setNewWpName(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex-1 min-w-[120px]"
            />
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">X:</span>
              <input
                type="number"
                step="0.1"
                value={newWpX}
                onChange={e => setNewWpX(e.target.value)}
                className="w-16 px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Z:</span>
              <input
                type="number"
                step="0.1"
                value={newWpZ}
                onChange={e => setNewWpZ(e.target.value)}
                className="w-16 px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Dung sai:</span>
              <input
                type="number"
                step="0.02"
                value={newWpTol}
                onChange={e => setNewWpTol(e.target.value)}
                className="w-16 px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <button
              onClick={handleAddWaypoint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Waypoint</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: LAB ASSIGNMENTS */}
      {activeTab === 'lab_assignments' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Các Bài Thực Hành Phòng Lab Chuẩn Hóa
            </span>
            <span className="text-[11px] text-slate-500">
              Chọn bài thực hành để nạp cấu hình sa bàn, nhiệm vụ và tiêu chí chấm điểm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {labAssignments.map(assignment => {
              const isSelected = currentAssignment?.id === assignment.id;
              return (
                <div
                  key={assignment.id}
                  onClick={() => onSelectAssignment(assignment)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                        {assignment.id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        {assignment.level}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {assignment.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {assignment.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{assignment.missionConfig.waypoints.length} Waypoints</span>
                    <span>Max: {assignment.missionConfig.timeoutS}s</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {isSelected ? 'Đang Chọn' : 'Chọn Bài'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: GRADING AUDIT */}
      {activeTab === 'grading_audit' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Học viên:</span>
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Nhóm:</span>
                <input
                  type="text"
                  value={studentGroup}
                  onChange={e => setStudentGroup(e.target.value)}
                  className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenReportModal}
                disabled={!latestGradingResult}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Xem Báo Cáo Chi Tiết</span>
              </button>
            </div>
          </div>

          {/* Real-time Evaluation Summary */}
          {latestGradingResult ? (
            <div className="flex flex-col gap-3">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                latestGradingResult.passed
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold font-mono ${
                    latestGradingResult.passed ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {latestGradingResult.totalScore.toFixed(1)}
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold">
                      Xếp Loại: {latestGradingResult.gradeTier}
                    </span>
                    <p className="text-[11px] mt-0.5 opacity-90">{latestGradingResult.summaryFeedback}</p>
                  </div>
                </div>

                <span className="font-mono text-[11px] bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  {latestGradingResult.evaluationId}
                </span>
              </div>

              {/* Rubric Items Breakdown Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">Tiêu Chí Chấm Điểm</th>
                      <th className="p-2.5">Trọng Số</th>
                      <th className="p-2.5">Quy Chuẩn</th>
                      <th className="p-2.5">Dữ Liệu Đo Thực Tế</th>
                      <th className="p-2.5">Điểm (Thang 10)</th>
                      <th className="p-2.5">Đánh Giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {latestGradingResult.scoreItems.map(item => (
                      <tr key={item.rubricId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-white">{item.name}</td>
                        <td className="p-2.5">{item.weightPercent}%</td>
                        <td className="p-2.5 font-sans text-slate-500">{item.targetRule}</td>
                        <td className="p-2.5 text-blue-600 dark:text-blue-400">{item.measuredValue}</td>
                        <td className="p-2.5 font-bold">{item.score.toFixed(1)}</td>
                        <td className="p-2.5 font-sans">
                          {item.passed ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đạt
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Chưa Đạt
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Chưa có dữ liệu chấm điểm. Hãy chạy một lượt nhiệm vụ để hệ thống thu thập thông số đo đạc thực tế.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
