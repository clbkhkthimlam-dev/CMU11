import React, { useState, useEffect } from 'react';
import { SimulationStatus } from '../types/simulation';
import {
  Play,
  Pause,
  Square,
  AlertOctagon,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Compass,
  Gauge,
  Keyboard,
  SkipForward,
  Shield,
  Radar,
} from 'lucide-react';

interface ControlDeckProps {
  status: SimulationStatus;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onEmergencyStop: () => void;
  isEmergencyStopped: boolean;
  onManualDrive: (leftMps: number, rightMps: number, durationS?: number) => void;
  linearSpeedMps: number;
  angularSpeedRadps: number;
  onStepForward?: () => void;
  frontRangeM?: number;
  isCollision?: boolean;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  status,
  onPlay,
  onPause,
  onStop,
  onReset,
  onEmergencyStop,
  isEmergencyStopped,
  onManualDrive,
  linearSpeedMps,
  angularSpeedRadps,
  onStepForward,
  frontRangeM = 0,
  isCollision = false,
}) => {
  const [speedScale, setSpeedScale] = useState(0.25); // 0.25 m/s
  const [enableKeyboard, setEnableKeyboard] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleForward = () => onManualDrive(speedScale, speedScale, 0.4);
  const handleBackward = () => onManualDrive(-speedScale, -speedScale, 0.4);
  const handleTurnLeft = () => onManualDrive(speedScale * 0.4, speedScale, 0.4);
  const handleTurnRight = () => onManualDrive(speedScale, speedScale * 0.4, 0.4);
  const handleSpotLeft = () => onManualDrive(-speedScale, speedScale, 0.4);
  const handleSpotRight = () => onManualDrive(speedScale, -speedScale, 0.4);
  const handleHalt = () => onManualDrive(0, 0);

  // Global Keyboard Controls (WASD / Arrows / Space / Q / E)
  useEffect(() => {
    if (!enableKeyboard || isEmergencyStopped) return;

    const driveKeys = new Set(['w', 'arrowup', 's', 'arrowdown', 'a', 'arrowleft', 'd', 'arrowright', 'q', 'e']);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) {
        e.preventDefault();
        setActiveKey('UP');
        handleForward();
      } else if (['s', 'arrowdown'].includes(key)) {
        e.preventDefault();
        setActiveKey('DOWN');
        handleBackward();
      } else if (['a', 'arrowleft'].includes(key)) {
        e.preventDefault();
        setActiveKey('LEFT');
        handleTurnLeft();
      } else if (['d', 'arrowright'].includes(key)) {
        e.preventDefault();
        setActiveKey('RIGHT');
        handleTurnRight();
      } else if (key === 'q') {
        e.preventDefault();
        setActiveKey('Q');
        handleSpotLeft();
      } else if (key === 'e') {
        e.preventDefault();
        setActiveKey('E');
        handleSpotRight();
      } else if (key === ' ') {
        e.preventDefault();
        setActiveKey('SPACE');
        handleHalt();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (driveKeys.has(key)) {
        setActiveKey(null);
        // Cơ chế nhả phím dừng an toàn (Deadman Switch)
        onManualDrive(0, 0, 0.05);
      }
    };

    // Mất tiêu điểm cửa sổ (Window Blur) -> Tự động phanh an toàn dừng robot
    const handleWindowBlur = () => {
      setActiveKey(null);
      onManualDrive(0, 0, 0.05);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enableKeyboard, isEmergencyStopped, speedScale, onManualDrive]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-4">
      {/* Simulation Playback & Step Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {status === 'running' ? (
            <button
              onClick={onPause}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Tạm Dừng</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Chạy Mô Phỏng</span>
            </button>
          )}

          {onStepForward && (
            <button
              onClick={onStepForward}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Chạy từng bước (Step-by-step)"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Bước Tiếp</span>
            </button>
          )}

          <button
            onClick={onStop}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Dừng robot và hủy lệnh hiện tại"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Dừng</span>
          </button>

          <button
            onClick={onReset}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Đặt lại vị trí xuất phát ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt Lại</span>
          </button>
        </div>

        {/* Real-time Status Badges */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
          <div className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-blue-600" />
            <span>v: {linearSpeedMps.toFixed(2)} m/s</span>
          </div>
          <div className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-purple-600" />
            <span>ω: {angularSpeedRadps.toFixed(2)} rad/s</span>
          </div>
          <div className="flex items-center gap-1">
            <Radar className="w-3.5 h-3.5 text-teal-600" />
            <span>Khoảng cách: {frontRangeM.toFixed(2)}m</span>
          </div>
          {isCollision && (
            <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[11px] animate-pulse">
              VA CHẠM!
            </span>
          )}
        </div>
      </div>

      {/* Manual Teleop & Speed Controller */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Speed Scale Slider & Keyboard Shortcut Info */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-700">Tốc Độ Điều Khiển (LINEAR_SCALE):</span>
            <span className="font-mono font-bold text-blue-600">{speedScale.toFixed(2)} m/s</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.50"
            step="0.05"
            value={speedScale}
            onChange={e => setSpeedScale(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />

          {/* Keyboard Toggle */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={enableKeyboard}
                onChange={e => setEnableKeyboard(e.target.checked)}
                className="rounded accent-blue-600 cursor-pointer"
              />
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Phím tắt (W/A/S/D hoặc Mũi Tên)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Q/E: Xoay tròn · Space: Phanh</span>
          </div>
        </div>

        {/* D-Pad Manual Teleop */}
        <div className="flex flex-col items-center gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-1">
            <button
              onClick={handleForward}
              disabled={isEmergencyStopped}
              className={`w-10 h-9 border rounded-lg shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40 ${
                activeKey === 'UP' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-200'
              }`}
              title="Tiến thẳng (W / ↑)"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSpotLeft}
              disabled={isEmergencyStopped}
              className={`w-10 h-9 border rounded-lg shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40 ${
                activeKey === 'Q' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-200'
              }`}
              title="Xoay tại chỗ trái (Q)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleTurnLeft}
              disabled={isEmergencyStopped}
              className={`w-10 h-9 border rounded-lg shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40 ${
                activeKey === 'LEFT' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-200'
              }`}
              title="Quẹo trái (A / ←)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleHalt}
              className={`w-10 h-9 border rounded-lg shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer font-bold text-xs ${
                activeKey === 'SPACE' ? 'bg-red-600 text-white border-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300'
              }`}
              title="Dừng khẩn cấp trục bánh (Space)"
            >
              HALT
            </button>

            <button
              onClick={handleTurnRight}
              disabled={isEmergencyStopped}
              className={`w-10 h-9 border rounded-lg shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40 ${
                activeKey === 'RIGHT' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-200'
              }`}
              title="Quẹo phải (D / →)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleSpotRight}
              disabled={isEmergencyStopped}
              className={`w-10 h-9 border rounded-lg shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40 ${
                activeKey === 'E' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-200'
              }`}
              title="Xoay tại chỗ phải (E)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleBackward}
              disabled={isEmergencyStopped}
              className={`w-10 h-9 border rounded-lg shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40 ${
                activeKey === 'DOWN' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-200'
              }`}
              title="Lùi lại (S / ↓)"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
