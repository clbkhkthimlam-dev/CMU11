import React from 'react';
import { RobotPose, RobotKinematics, SensorData, DeviceState, SafetyState } from '../types/robot';
import { EventLogItem } from '../types/simulation';
import {
  Compass,
  Gauge,
  Radio,
  Radar,
  Shield,
  Activity,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Navigation,
  MapPin,
  Grid,
  Layers,
  Crosshair,
  Ban,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { FrontRangeChart } from './FrontRangeChart';
import { OdometryState } from '../simulation/localization';
import { AutonomousNavState } from '../simulation/autonomousNavigation';

interface TelemetryDashboardProps {
  pose: RobotPose;
  kinematics: RobotKinematics;
  sensors: SensorData;
  deviceState: DeviceState;
  safety: SafetyState;
  simTimeS: number;
  eventLog: EventLogItem[];
  odometry?: OdometryState;
  autoNavState?: AutonomousNavState;
  showOccupancyGrid?: boolean;
  onToggleOccupancyGrid?: () => void;
  isPickingGoal?: boolean;
  onTogglePickGoal?: () => void;
  onCancelNav?: () => void;
  onAcknowledgeSensorFault?: () => void;
  onOpenPracticeReport?: () => void;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  pose,
  kinematics,
  sensors,
  deviceState,
  safety,
  simTimeS,
  eventLog,
  odometry,
  autoNavState,
  showOccupancyGrid,
  onToggleOccupancyGrid,
  isPickingGoal,
  onTogglePickGoal,
  onCancelNav,
  onAcknowledgeSensorFault,
  onOpenPracticeReport,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Bảng Dữ Liệu Đo Đạc (Real-Time Telemetry)
          </h3>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-500">
          Sim Clock: {simTimeS.toFixed(2)}s
        </span>
      </div>

      {/* Grid of Key Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Pose & Heading */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Tọa Độ (Pose)</span>
            <Compass className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="font-mono text-xs font-bold text-slate-800">
            X: {pose.xM.toFixed(2)}m · Z: {pose.zM.toFixed(2)}m
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Yaw: {(pose.yawRad * 180 / Math.PI).toFixed(1)}° ({pose.yawRad.toFixed(2)} rad)
          </div>
        </div>

        {/* Card 2: Track Velocities */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Vận Tốc 2 Xích</span>
            <Gauge className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="font-mono text-xs font-bold text-slate-800">
            L: {kinematics.vLeftMps.toFixed(2)} · R: {kinematics.vRightMps.toFixed(2)} m/s
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            v: {kinematics.linearSpeedMps.toFixed(2)} m/s · ω: {kinematics.angularSpeedRadps.toFixed(2)} rad/s
          </div>
        </div>

        {/* Card 3: Distance & LIDAR */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Cảm Biến Khoảng Cách</span>
            <Radar className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="font-mono text-xs font-bold text-slate-800">
            Trước mặt: {sensors.frontRangeM.toFixed(2)} m
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            LIDAR: 360° ({sensors.lidarScan.length} tia quét)
          </div>
        </div>

        {/* Card 4: Lane Error & Safety */}
        <div
          className={`p-3 rounded-lg border flex flex-col gap-1 ${
            safety.isOutsideLane
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Hành Lang Làn (Lane)</span>
            <Shield className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="font-mono text-xs font-bold">
            Sai số ngang: {safety.crossTrackErrorM.toFixed(3)} m
          </div>
          <div className="text-[11px] font-bold">
            {safety.isOutsideLane ? (
              <span className="text-amber-700">⚠️ LỆCH LÀN (&gt;0.35m)</span>
            ) : (
              <span className="text-emerald-700 font-medium">✓ Trong làn an toàn</span>
            )}
          </div>
        </div>
      </div>

      {/* Real-time D3.js Line Chart of frontRangeM over 10s */}
      <FrontRangeChart
        currentRangeM={sensors.frontRangeM}
        simTimeS={simTimeS}
        timeWindowSeconds={10}
      />

      {/* Hardware Devices & AprilTag Perception Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Hardware Status */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">Thiết Bị Ngoại Vi:</span>
          <div className="flex items-center gap-3 font-mono">
            <div className="flex items-center gap-1.5">
              <span>LED:</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  deviceState.statusLED === 'green'
                    ? 'bg-emerald-500'
                    : deviceState.statusLED === 'amber'
                    ? 'bg-amber-500'
                    : deviceState.statusLED === 'red'
                    ? 'bg-red-500'
                    : 'bg-slate-300'
                }`}
              />
              <span className="capitalize">{deviceState.statusLED}</span>
            </div>
            <div>
              Gimbal: {(deviceState.servoPanRad * 180 / Math.PI).toFixed(0)}°
            </div>
          </div>
        </div>

        {/* AprilTag Perception State */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">AprilTag Perception:</span>
          <div className="font-mono text-slate-600">
            {sensors.detectedTags.length > 0 ? (
              <span className="text-emerald-700 font-semibold">
                TAG {sensors.detectedTags.map(t => `#${t.id} (${t.distanceM.toFixed(2)}m)`).join(', ')}
              </span>
            ) : (
              <span className="text-slate-400">Không có tag trong FOV</span>
            )}
          </div>
        </div>
      </div>

      {/* Autonomous Navigation & Localization Section */}
      <div className="bg-slate-900 text-white rounded-xl p-3 flex flex-col gap-2.5 border border-slate-800">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              Điều Hướng Tự Hành & Định Vị (Auto-Nav & SLAM / Grid)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {autoNavState && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  autoNavState.status === 'TRACKING'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 animate-pulse'
                    : autoNavState.status === 'GOAL_REACHED'
                    ? 'bg-blue-950 text-blue-400 border border-blue-700'
                    : autoNavState.status === 'OBSTACLE_BLOCKED'
                    ? 'bg-amber-950 text-amber-400 border border-amber-700'
                    : autoNavState.status === 'SENSOR_FAULT'
                    ? 'bg-purple-950 text-purple-400 border border-purple-700'
                    : autoNavState.status === 'ESTOP'
                    ? 'bg-red-950 text-red-400 border border-red-700'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {autoNavState.status}
              </span>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Active Goal */}
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400">Điểm Đích (Target Goal):</span>
            <span className="font-mono font-semibold text-emerald-400">
              {autoNavState?.activeGoal
                ? `(${autoNavState.activeGoal.xM.toFixed(2)}, ${autoNavState.activeGoal.zM.toFixed(2)})m`
                : 'Chưa đặt mục tiêu'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {autoNavState?.activeGoal ? `Còn: ${autoNavState.distanceToGoalM.toFixed(2)}m` : 'Nhấp chuột trên map'}
            </span>
          </div>

          {/* Odometry vs Ground Truth */}
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400">Định Vị Odometry:</span>
            <span className="font-mono font-semibold text-sky-400">
              {odometry
                ? `(${odometry.xM.toFixed(2)}, ${odometry.zM.toFixed(2)})m`
                : `(${pose.xM.toFixed(2)}, ${pose.zM.toFixed(2)})m`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Độ trôi: {odometry ? `${(odometry.driftErrorM * 100).toFixed(1)}cm` : '0.0cm'}
            </span>
          </div>

          {/* Path & Cross Track */}
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400">Lập Tuyến Đường A*:</span>
            <span className="font-mono font-semibold text-purple-400">
              {autoNavState?.plannedPath
                ? `${autoNavState.plannedPath.waypoints.length} điểm (${autoNavState.plannedPath.totalLengthM.toFixed(2)}m)`
                : 'Sẵn sàng'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Lệch tim: {autoNavState?.crossTrackErrorM ? `${(autoNavState.crossTrackErrorM * 100).toFixed(1)}cm` : '0.0cm'}
            </span>
          </div>

          {/* SLAM / Occupancy Grid Status */}
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400">Bản Đồ Lưới (Grid):</span>
            <span className="font-mono font-semibold text-teal-400">
              {showOccupancyGrid ? 'Đang hiển thị' : 'Đang ẩn'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Log-Odds 2D LiDAR
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800 flex-wrap">
          <button
            onClick={onTogglePickGoal}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              isPickingGoal
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isPickingGoal ? 'Đang Chờ Nhấp Map... (Nhấp để hủy)' : 'Đặt Đích (Click Map / Shift+Click)'}</span>
          </button>

          <button
            onClick={onToggleOccupancyGrid}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              showOccupancyGrid
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{showOccupancyGrid ? 'Ẩn Lưới Occupancy' : 'Hiện Lưới Occupancy'}</span>
          </button>

          {autoNavState?.status === 'TRACKING' && (
            <button
              onClick={onCancelNav}
              className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Dừng Điều Hướng</span>
            </button>
          )}

          {autoNavState?.status === 'SENSOR_FAULT' && onAcknowledgeSensorFault && (
            <button
              onClick={onAcknowledgeSensorFault}
              className="px-2.5 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer animate-pulse"
              title="Xác nhận khôi phục sau khi cảm biến đã an toàn"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
              <span>Xóa Lỗi Cảm Biến</span>
            </button>
          )}

          {onOpenPracticeReport && (
            <button
              onClick={onOpenPracticeReport}
              className="px-2.5 py-1 bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer"
              title="Tạo và xuất báo cáo kết quả thực hành để nộp bài hoặc chấm điểm"
            >
              <FileText className="w-3.5 h-3.5 text-teal-300" />
              <span>Xuất Báo Cáo</span>
            </button>
          )}
        </div>
      </div>

      {/* Event Timeline Log */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">Nhật Ký Sự Kiện Mô Phỏng (Event Timeline):</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {eventLog.length} sự kiện đã ghi nhận
          </span>
        </div>

        <div className="max-h-[100px] overflow-y-auto flex flex-col gap-1 font-mono text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
          {eventLog.length === 0 ? (
            <span className="text-slate-400 italic">Chưa có sự kiện nào được ghi nhận...</span>
          ) : (
            eventLog.slice(0, 8).map(ev => (
              <div key={ev.id} className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">[{ev.simTimeS.toFixed(2)}s]</span>
                <span
                  className={`px-1 rounded text-[10px] font-bold ${
                    ev.status === 'error'
                      ? 'bg-red-100 text-red-700'
                      : ev.status === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {ev.type}
                </span>
                <span className="truncate">{ev.payload}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
