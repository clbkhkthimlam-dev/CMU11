import React from 'react';
import { RobotPose, RobotKinematics, SafetyState } from '../types/robot';
import { WorldMap } from '../types/map';
import { SimulationStatus } from '../types/simulation';
import {
  Activity,
  Shield,
  ShieldAlert,
  Compass,
  Gauge,
  Box,
  Map,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface BottomStatusBarProps {
  simTimeS: number;
  pose: RobotPose;
  kinematics: RobotKinematics;
  safety: SafetyState;
  currentMap: WorldMap;
  status: SimulationStatus;
  isDarkMode: boolean;
  isCodeRunning: boolean;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  simTimeS,
  pose,
  kinematics,
  safety,
  currentMap,
  status,
  isDarkMode,
  isCodeRunning,
}) => {
  const activeObstacles = currentMap.obstacles.filter(o => o.enabled !== false).length;

  return (
    <footer
      className={`h-9 border-t px-4 flex items-center justify-between text-[11px] font-mono shrink-0 select-none z-30 transition-colors ${
        isDarkMode
          ? 'bg-slate-950 border-slate-800 text-slate-400'
          : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}
    >
      {/* Left side: Sim clock & Clock rate */}
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            T_sim: {simTimeS.toFixed(2)}s
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>50 Hz (dt=0.02s)</span>
        </div>

        {/* Current Map */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0 truncate max-w-[200px]">
          <Map className="w-3.5 h-3.5 text-indigo-500" />
          <span className="truncate">{currentMap.name.split('(')[0]}</span>
        </div>

        {/* Obstacles Count */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          <Box className="w-3.5 h-3.5 text-amber-500" />
          <span>{activeObstacles}/{currentMap.obstacles.length} vật cản</span>
        </div>
      </div>

      {/* Right side: Robot Real-time Coordinates & Safety status */}
      <div className="flex items-center gap-4">
        {/* Robot Pose */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-500" />
          <span>
            X:{pose.xM.toFixed(2)} Z:{pose.zM.toFixed(2)}m · {(pose.yawRad * 180 / Math.PI).toFixed(0)}°
          </span>
        </div>

        {/* Speeds */}
        <div className="hidden md:flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-purple-500" />
          <span>
            v:{kinematics.linearSpeedMps.toFixed(2)}m/s · ω:{kinematics.angularSpeedRadps.toFixed(2)}rad/s
          </span>
        </div>

        {/* Safety indicator pill */}
        <div className="flex items-center gap-1.5">
          {safety.isEmergencyStopped ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-rose-600 text-white animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              <span>E-STOP</span>
            </span>
          ) : safety.isCollision ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-rose-500 text-white">
              <AlertTriangle className="w-3 h-3" />
              <span>Va chạm</span>
            </span>
          ) : safety.isOutsideLane ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white">
              <AlertTriangle className="w-3 h-3" />
              <span>Lệch làn</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>An toàn</span>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};
