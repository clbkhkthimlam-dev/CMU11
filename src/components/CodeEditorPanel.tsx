import React, { useState } from 'react';
import { validateCode, CodeValidationResult } from '../simulation/codeRuntime';
import { Code, Play, Square, CheckCircle, AlertTriangle, Terminal, Sparkles, Copy, Check } from 'lucide-react';

interface CodeEditorPanelProps {
  code: string;
  setCode: (code: string) => void;
  onRunCode: () => void;
  onStopCode: () => void;
  isRunning: boolean;
  consoleOutput: Array<{ id: string; timestampS: number; text: string; level: 'log' | 'warn' | 'error' | 'info' }>;
  onClearConsole: () => void;
}

const PRESET_SCRIPTS: Array<{ name: string; desc: string; code: string }> = [
  {
    name: '1. Chạy hình vuông (Square Drive)',
    desc: 'Lập trình robot chạy 4 cạnh hình vuông và xoay góc 90 độ',
    code: `# Kịch bản: Chạy hình vuông 4 cạnh
print("Bắt đầu kịch bản chạy hình vuông")
robot.set_led("status", "green")

# Cạnh 1
robot.set_motors(0.20, 0.20, duration=2.0)
time.sleep(0.5)
# Xoay 90 độ (quẹo phải)
robot.set_motors(0.20, -0.20, duration=0.785)
time.sleep(0.5)

# Cạnh 2
robot.set_motors(0.20, 0.20, duration=2.0)
time.sleep(0.5)
robot.set_motors(0.20, -0.20, duration=0.785)
time.sleep(0.5)

# Cạnh 3
robot.set_motors(0.20, 0.20, duration=2.0)
time.sleep(0.5)
robot.set_motors(0.20, -0.20, duration=0.785)
time.sleep(0.5)

# Cạnh 4
robot.set_motors(0.20, 0.20, duration=2.0)
time.sleep(0.5)
robot.set_motors(0.20, -0.20, duration=0.785)

robot.set_led("status", "off")
robot.stop()
print("Hoàn thành hình vuông!")`,
  },
  {
    name: '2. Tìm kiếm và tiếp cận AprilTag (Tiết 29–30)',
    desc: 'scan_for_tag xoay tìm TAG 0 và approach_tag tiến lại cách 0.40m',
    code: `# Kịch bản: Điều hướng tự động theo AprilTag 0
print("Bắt đầu tìm kiếm AprilTag ID 0...")
robot.set_led("status", "amber")

# 1. Quét tìm tag
scan_for_tag(target_tag_id=0, direction="left", turn_speed=0.06)
time.sleep(0.5)

# 2. Căn chỉnh và tiếp cận dừng ở khoảng cách 0.40m
print("Đã phát hiện tag, tiến lại gần...")
robot.set_led("status", "green")
approach_tag(target_tag_id=0, desired_z_m=0.40, forward_speed=0.20)

print("Đã dừng trước AprilTag an toàn!")
robot.stop()`,
  },
  {
    name: '3. Thử thách Mê Cung AprilTag (Tiết 31–34)',
    desc: 'Tự động vượt qua 4 trạm TAG 0 → TAG 1 → TAG 2 → TAG 3',
    code: `# Thử thách mê cung 4 trạm AprilTag
print("🏁 BẮT ĐẦU THỬ THÁCH MÊ CUNG!")
robot.set_led("status", "green")

# Trạm 1: TAG 0 (Bắc)
print("[Trạm 1] Tìm TAG 0...")
scan_for_tag(target_tag_id=0, direction="left", turn_speed=0.06)
approach_tag(target_tag_id=0, desired_z_m=0.40, forward_speed=0.20)
time.sleep(0.8)

# Trạm 2: TAG 1 (Đông)
print("[Trạm 2] Quẹo phải tìm TAG 1...")
scan_for_tag(target_tag_id=1, direction="right", turn_speed=0.06)
approach_tag(target_tag_id=1, desired_z_m=0.40, forward_speed=0.20)
time.sleep(0.8)

# Trạm 3: TAG 2 (Nam)
print("[Trạm 3] Quẹo trái tìm TAG 2...")
scan_for_tag(target_tag_id=2, direction="left", turn_speed=0.06)
approach_tag(target_tag_id=2, desired_z_m=0.40, forward_speed=0.20)
time.sleep(0.8)

# Trạm 4: TAG 3 (Tây - Đích)
print("[Trạm 4] Về đích TAG 3...")
scan_for_tag(target_tag_id=3, direction="left", turn_speed=0.06)
approach_tag(target_tag_id=3, desired_z_m=0.30, forward_speed=0.15)

robot.set_led("status", "amber")
robot.stop()
print("🏆 HOÀN THÀNH TOÀN BỘ MÊ CUNG!")`,
  },
  {
    name: '4. Kiểm tra cảm biến & LED GPIO',
    desc: 'Bật đèn LED trạng thái, hiển thị số TM1637 và di chuyển',
    code: `# Kiểm tra tích hợp thiết bị ảo
print("Bật LED trạng thái xanh...")
robot.set_led("status", "green")
show_number(1234)
time.sleep(1.0)

print("Tiến về phía trước 1.5s...")
robot.drive(0.20, 0.0, 1.5)

print("Hiển thị năm 2026...")
show_number(2026)
robot.set_led("status", "amber")
time.sleep(1.0)

robot.stop()
show_number(0)
print("Kết thúc kiểm tra thiết bị.")`,
  },
];

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  code,
  setCode,
  onRunCode,
  onStopCode,
  isRunning,
  consoleOutput,
  onClearConsole,
}) => {
  const [validation, setValidation] = useState<CodeValidationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleValidate = () => {
    const res = validateCode(code);
    setValidation(res);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">
            Trình Thực Thi Code Mô Phỏng (Sandboxed Runtime)
          </span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono font-semibold">
            Python API
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <select
            onChange={e => {
              const selected = PRESET_SCRIPTS.find(p => p.name === e.target.value);
              if (selected) {
                setCode(selected.code);
                setValidation(null);
              }
            }}
            className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium cursor-pointer"
          >
            <option value="">-- Chọn bài mẫu kịch bản --</option>
            {PRESET_SCRIPTS.map(p => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Sao chép mã"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Main Text Area */}
      <div className="relative font-mono text-xs p-3 bg-slate-950 text-slate-200 min-h-[220px] max-h-[320px] overflow-y-auto">
        <textarea
          value={code}
          onChange={e => {
            setCode(e.target.value);
            setValidation(null);
          }}
          spellCheck={false}
          className="w-full h-full min-h-[200px] bg-transparent text-slate-100 outline-none resize-none font-mono text-xs leading-relaxed"
          placeholder="# Nhập lệnh điều khiển robot ảo..."
        />
      </div>

      {/* Action Bar */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={onStopCode}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Dừng Lệnh</span>
            </button>
          ) : (
            <button
              onClick={onRunCode}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Chạy Code</span>
            </button>
          )}

          <button
            onClick={handleValidate}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Kiểm Tra Cú Pháp</span>
          </button>
        </div>

        {/* Validation Status Badge */}
        {validation && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {validation.isValid ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Hợp lệ ({validation.supportedApis.length} API an toàn)
              </span>
            ) : (
              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                {validation.errors[0]?.message}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Output Console Log */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">Console Log / Output</span>
          </div>
          <button
            onClick={onClearConsole}
            className="hover:text-slate-200 transition-colors cursor-pointer text-[10px]"
          >
            Xóa màn hình
          </button>
        </div>

        <div className="font-mono text-xs min-h-[70px] max-h-[110px] overflow-y-auto flex flex-col gap-1 text-slate-300">
          {consoleOutput.length === 0 ? (
            <span className="text-slate-500 italic py-1">Chưa có thông báo đầu ra...</span>
          ) : (
            consoleOutput.map(c => (
              <div
                key={c.id}
                className={`flex items-start gap-2 ${
                  c.level === 'error'
                    ? 'text-red-400'
                    : c.level === 'warn'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}
              >
                <span className="text-slate-500 select-none">
                  [{c.timestampS.toFixed(1)}s]
                </span>
                <span>{c.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
