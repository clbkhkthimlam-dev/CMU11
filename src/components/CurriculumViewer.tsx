import React, { useState } from 'react';
import { MODULES_DATA } from '../data/modulesData';
import { ModuleLesson } from '../types/modules';
import { VirtualHardwareLab } from './VirtualHardwareLab';
import { BookOpen, Copy, Check, Play, ExternalLink, Cpu, Info, Zap } from 'lucide-react';

interface CurriculumViewerProps {
  onLoadCodeToSimulator: (code: string) => void;
  onNavigateToSimulator: () => void;
}

export const CurriculumViewer: React.FC<CurriculumViewerProps> = ({
  onLoadCodeToSimulator,
  onNavigateToSimulator,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('M01');
  const [filterCategory, setFilterCategory] = useState<'all' | 'gpio' | 'ros' | 'vision'>('all');
  const [copiedCode, setCopiedCode] = useState(false);

  const selectedModule = MODULES_DATA.find(m => m.id === selectedModuleId) || MODULES_DATA[0];

  const filteredModules = MODULES_DATA.filter(m => {
    if (filterCategory === 'gpio') return parseInt(m.id.substring(1), 10) <= 8;
    if (filterCategory === 'ros') {
      const num = parseInt(m.id.substring(1), 10);
      return num >= 9 && num <= 11;
    }
    if (filterCategory === 'vision') return parseInt(m.id.substring(1), 10) >= 12;
    return true;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendToRobot = () => {
    if (selectedModule.simulatedRobotCode) {
      onLoadCodeToSimulator(selectedModule.simulatedRobotCode);
    } else {
      onLoadCodeToSimulator(selectedModule.codeCellSource);
    }
    onNavigateToSimulator();
  };

  // Color mapping according to Vibrant STEM
  const getModuleColorBadge = (id: string) => {
    const num = parseInt(id.substring(1), 10);
    if (num <= 3) return 'bg-blue-600 text-white';
    if (num <= 6) return 'bg-purple-600 text-white';
    if (num <= 8) return 'bg-amber-500 text-white';
    if (num <= 11) return 'bg-teal-600 text-white';
    return 'bg-pink-600 text-white';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Title & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            16 Mô-đun Bài Học CMU Robotics Lớp 11
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Giữ nguyên 100% dữ liệu kỹ thuật từ các notebook Jupyter, mã nguồn gốc và cấu trúc bài giảng.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả (16 Bài)
          </button>
          <button
            onClick={() => setFilterCategory('gpio')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterCategory === 'gpio' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GPIO & TM1637 (M01-M08)
          </button>
          <button
            onClick={() => setFilterCategory('ros')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterCategory === 'ros' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            LIDAR & SLAM (M09-M11)
          </button>
          <button
            onClick={() => setFilterCategory('vision')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterCategory === 'vision' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Camera & AprilTag (M12-M16)
          </button>
        </div>
      </div>

      {/* Main Grid: Left module list, Right detail viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Module Sidebar List */}
        <div className="lg:col-span-4 flex flex-col gap-2 max-h-[800px] overflow-y-auto pr-1">
          {filteredModules.map(mod => {
            const isSelected = mod.id === selectedModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-400 shadow-xs'
                    : 'bg-white border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${getModuleColorBadge(mod.id)}`}>
                      {mod.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                      {mod.title}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {mod.shortDesc}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>{mod.sourceFile}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Module Detail */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded ${getModuleColorBadge(selectedModule.id)}`}>
                  {selectedModule.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Nguồn: {selectedModule.sourceFile}
                </span>
              </div>

              <button
                onClick={handleSendToRobot}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Nạp Vào Robot Ảo</span>
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {selectedModule.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedModule.shortDesc}
            </p>
          </div>

          {/* Hardware & Wiring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Yêu Cầu Phần Cứng:
              </span>
              <ul className="text-xs text-slate-600 list-disc list-inside flex flex-col gap-1">
                {selectedModule.hardwareRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Sơ Đồ Kết Nối / Chân (Wiring):
              </span>
              <div className="text-xs text-slate-700 font-mono bg-white p-2 rounded border border-slate-200">
                {selectedModule.wiringDiagram.description}
              </div>
            </div>
          </div>

          {/* Interactive Virtual Hardware Sandbox */}
          <VirtualHardwareLab module={selectedModule} />

          {/* Original Notebook Code Viewer */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Mã Nguồn Gốc Trong Notebook ({selectedModule.sourceFile}):
              </span>
              <button
                onClick={() => handleCopyCode(selectedModule.codeCellSource)}
                className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Đã chép' : 'Sao chép mã'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[300px]">
              <pre className="leading-relaxed whitespace-pre font-mono">
                {selectedModule.codeCellSource}
              </pre>
            </div>
          </div>

          {/* Key Concepts & CLO Alignment */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800">
              Mục Tiêu Học Tập & Chuẩn Đầu Ra (CLO):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedModule.learningOutcomes.map(lo => (
                <span
                  key={lo}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200"
                >
                  {lo}
                </span>
              ))}
            </div>

            <div className="text-xs text-slate-500 mt-1 flex flex-col gap-1">
              {selectedModule.notes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
