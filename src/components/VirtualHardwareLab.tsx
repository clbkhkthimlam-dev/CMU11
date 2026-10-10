import React, { useState, useEffect } from 'react';
import { ModuleLesson } from '../types/modules';
import { Play, Pause, RotateCcw, Sliders, CheckCircle, Flame, Eye, Camera, Lightbulb } from 'lucide-react';

interface VirtualHardwareLabProps {
  module: ModuleLesson;
}

export const VirtualHardwareLab: React.FC<VirtualHardwareLabProps> = ({ module }) => {
  // M01 State
  const [ledPin11, setLedPin11] = useState(false);
  const [ledBlinkMode, setLedBlinkMode] = useState<'off' | '0.5s' | '3s_1s'>('off');

  // M02 State: Traffic light
  const [trafficLightPha, setTrafficLightPha] = useState<'XANH' | 'VANG' | 'DO'>('XANH');
  const [trafficAuto, setTrafficAuto] = useState(true);
  const [phaTimer, setPhaTimer] = useState(10);

  // M03 State: Button
  const [btnPressed, setBtnPressed] = useState(false);
  const [toggleLed, setToggleLed] = useState(false);
  const [btnMode, setBtnMode] = useState<'hold' | 'toggle'>('toggle');

  // M04-M06 State: TM1637
  const [tmDigits, setTmDigits] = useState('1234');
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [countdownVal, setCountdownVal] = useState(10);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // M08 Custom time
  const [greenTime, setGreenTime] = useState(10);
  const [yellowTime, setYellowTime] = useState(3);
  const [redTime, setRedTime] = useState(10);

  // M13 Calibration
  const [calibFramesCount, setCalibFramesCount] = useState(12);

  // M16 Maze results
  const [mazeTrials, setMazeTrials] = useState([
    { lan: 1, thoiGian: 42.5, hoanThanh: true, ghiChu: 'Chạy thử lần đầu' },
    { lan: 2, thoiGian: 36.8, hoanThanh: true, ghiChu: 'Tăng forward_speed lên 0.25 m/s' },
  ]);

  // Traffic Light auto timer
  useEffect(() => {
    if (module.interactiveType !== 'traffic_light' && module.interactiveType !== 'traffic_tm1637' && module.interactiveType !== 'traffic_tm1637_input') {
      return;
    }
    if (!trafficAuto) return;

    const gT = module.interactiveType === 'traffic_tm1637_input' ? greenTime : 10;
    const yT = module.interactiveType === 'traffic_tm1637_input' ? yellowTime : 3;
    const rT = module.interactiveType === 'traffic_tm1637_input' ? redTime : 10;

    const interval = setInterval(() => {
      setPhaTimer(prev => {
        if (prev <= 1) {
          if (trafficLightPha === 'XANH') {
            setTrafficLightPha('VANG');
            return yT;
          } else if (trafficLightPha === 'VANG') {
            setTrafficLightPha('DO');
            return rT;
          } else {
            setTrafficLightPha('XANH');
            return gT;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trafficAuto, trafficLightPha, module.interactiveType, greenTime, yellowTime, redTime]);

  // Stopwatch timer
  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = setInterval(() => {
      setStopwatchSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  // Countdown timer
  useEffect(() => {
    if (!isCountingDown) return;
    const interval = setInterval(() => {
      setCountdownVal(v => {
        if (v <= 1) {
          setIsCountingDown(false);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCountingDown]);

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Phòng Thí Nghiệm Ảo (Interactive Virtual Workbench)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
          Mô phỏng phần cứng {module.id}
        </span>
      </div>

      {/* Render specialized widget according to module interactiveType */}
      {/* 1. M01 LED */}
      {module.interactiveType === 'gpio_led' && (
        <div className="flex flex-col sm:flex-row items-center justify-around p-4 bg-white rounded-lg border border-slate-200 gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all ${
                ledPin11
                  ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50'
                  : 'bg-slate-200 border-slate-300'
              }`}
            >
              <span className={`text-xs font-bold ${ledPin11 ? 'text-white' : 'text-slate-400'}`}>
                {ledPin11 ? 'HIGH' : 'LOW'}
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700">LED Đỏ (Pin 11)</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setLedPin11(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Bật LED (HIGH)
              </button>
              <button
                onClick={() => setLedPin11(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tắt LED (LOW)
              </button>
            </div>
            <span className="text-[11px] text-slate-500">
              Mạch: Pin 11 ──── Điện trở 330Ω ──── LED (+) ──── Pin 14 (GND)
            </span>
          </div>
        </div>
      )}

      {/* 2. M02 Traffic Light */}
      {(module.interactiveType === 'traffic_light' || module.interactiveType === 'traffic_tm1637' || module.interactiveType === 'traffic_tm1637_input') && (
        <div className="flex flex-col sm:flex-row items-center justify-around p-4 bg-white rounded-lg border border-slate-200 gap-4">
          {/* Traffic Light Head */}
          <div className="bg-slate-900 p-3 rounded-2xl flex flex-col gap-2.5 items-center shadow-md">
            <div
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                trafficLightPha === 'DO'
                  ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/70'
                  : 'bg-red-950 border-red-900 opacity-40'
              }`}
            />
            <div
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                trafficLightPha === 'VANG'
                  ? 'bg-amber-400 border-amber-200 shadow-lg shadow-amber-400/70'
                  : 'bg-amber-950 border-amber-900 opacity-40'
              }`}
            />
            <div
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                trafficLightPha === 'XANH'
                  ? 'bg-emerald-500 border-emerald-300 shadow-lg shadow-emerald-500/70'
                  : 'bg-emerald-950 border-emerald-900 opacity-40'
              }`}
            />
          </div>

          {/* TM1637 Display if integrated */}
          {(module.interactiveType === 'traffic_tm1637' || module.interactiveType === 'traffic_tm1637_input') && (
            <div className="bg-black px-4 py-2.5 rounded-lg border-2 border-slate-700 shadow-inner flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-mono">TM1637 COUNTDOWN</span>
              <span className="text-3xl font-mono font-bold text-red-500 tracking-widest">
                {String(phaTimer).padStart(4, '0')}
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold text-slate-800">
              Pha hiện tại: <span className="text-blue-600 font-bold">{trafficLightPha}</span> ({phaTimer}s)
            </div>
            <button
              onClick={() => setTrafficAuto(!trafficAuto)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                trafficAuto ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {trafficAuto ? 'Tạm Dừng Chu Kỳ' : 'Tiếp Tục Chu Kỳ'}
            </button>
          </div>
        </div>
      )}

      {/* 3. M03 Button */}
      {module.interactiveType === 'button_led' && (
        <div className="flex flex-col sm:flex-row items-center justify-around p-4 bg-white rounded-lg border border-slate-200 gap-4">
          <div className="flex flex-col items-center gap-2">
            <button
              onMouseDown={() => {
                setBtnPressed(true);
                if (btnMode === 'toggle') setToggleLed(!toggleLed);
              }}
              onMouseUp={() => setBtnPressed(false)}
              className={`w-16 h-16 rounded-full border-4 font-bold text-xs shadow-md transition-all active:scale-90 cursor-pointer ${
                btnPressed ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              {btnPressed ? 'PRESSED' : 'NÚT NHẤN'}
            </button>
            <span className="text-xs font-mono text-slate-500">Pin 16 (PUD_UP)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all ${
                (btnMode === 'hold' ? btnPressed : toggleLed)
                  ? 'bg-emerald-500 border-emerald-300 shadow-md shadow-emerald-500/50'
                  : 'bg-slate-200 border-slate-300'
              }`}
            />
            <span className="text-xs font-mono font-semibold text-slate-700">LED Pin 11</span>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <span className="font-semibold text-slate-700">Chế độ nút bấm:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setBtnMode('toggle')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  btnMode === 'toggle' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Toggle (Bật/Tắt)
              </button>
              <button
                onClick={() => setBtnMode('hold')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  btnMode === 'hold' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Nhấn Giữ Sáng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. M04-M06 TM1637 Display & Stopwatch */}
      {(module.interactiveType === 'tm1637' || module.interactiveType === 'stopwatch' || module.interactiveType === 'countdown') && (
        <div className="flex flex-col sm:flex-row items-center justify-around p-4 bg-white rounded-lg border border-slate-200 gap-4">
          <div className="bg-black px-6 py-3 rounded-xl border-2 border-slate-700 shadow-inner flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-mono tracking-widest">TM1637 4-DIGIT DISPLAY</span>
            <span className="text-4xl font-mono font-bold text-red-500 tracking-widest">
              {module.interactiveType === 'stopwatch'
                ? String(stopwatchSeconds).padStart(4, '0')
                : module.interactiveType === 'countdown'
                ? String(countdownVal).padStart(4, '0')
                : tmDigits}
            </span>
          </div>

          {module.interactiveType === 'stopwatch' && (
            <div className="flex gap-2">
              <button
                onClick={() => setStopwatchRunning(!stopwatchRunning)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer ${
                  stopwatchRunning ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
              >
                {stopwatchRunning ? 'Dừng (Stop)' : 'Bắt Đầu (Start)'}
              </button>
              <button
                onClick={() => {
                  setStopwatchRunning(false);
                  setStopwatchSeconds(0);
                }}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Đặt Lại (Reset)
              </button>
            </div>
          )}

          {module.interactiveType === 'countdown' && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsCountingDown(true)}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Đếm Ngược Từ 10s
              </button>
              <button
                onClick={() => {
                  setIsCountingDown(false);
                  setCountdownVal(10);
                }}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. M13 Calibration Checkerboard */}
      {module.interactiveType === 'camera_calibration' && (
        <div className="flex flex-col sm:flex-row items-center justify-around p-4 bg-white rounded-lg border border-slate-200 gap-4">
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-bold text-slate-800">Thông Số Ma Trận K Đã Lưu:</span>
            <span className="font-mono text-slate-600">fx = 620.0, fy = 620.0</span>
            <span className="font-mono text-slate-600">cx = 320.0, cy = 240.0</span>
            <span className="font-mono text-emerald-700 font-semibold">RMS Reprojection Error: 0.284 px</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-700">Khung hình ô cờ đã chụp: {calibFramesCount}/15</span>
            <button
              onClick={() => setCalibFramesCount(c => Math.min(15, c + 1))}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              📷 Chụp Thêm Khung Hình ({calibFramesCount})
            </button>
          </div>
        </div>
      )}

      {/* 6. M16 Maze Challenge Trial Table */}
      {module.interactiveType === 'apriltag_maze' && (
        <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-slate-200 text-xs">
          <span className="font-bold text-slate-800">Bảng Ghi Chép Kết Quả Thử Thách Mê Cung (KET_QUA):</span>
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1">Lần</th>
                <th>Thời Gian</th>
                <th>Hoàn Thành</th>
                <th>Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              {mazeTrials.map(t => (
                <tr key={t.lan} className="border-b border-slate-100">
                  <td className="py-1">{t.lan}</td>
                  <td>{t.thoiGian.toFixed(2)}s</td>
                  <td className="text-emerald-600 font-bold">{t.hoanThanh ? '✅' : '❌'}</td>
                  <td className="text-slate-600">{t.ghiChu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
