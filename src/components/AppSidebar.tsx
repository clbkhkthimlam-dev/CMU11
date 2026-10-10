import React from 'react';
import {
  Monitor,
  Map,
  Cpu,
  Code,
  ShieldCheck,
  Compass,
  Radar,
  Camera,
  BookOpen,
  GraduationCap,
  Activity,
  ChevronLeft,
  ChevronRight,
  Layers,
  Wrench,
  Radio,
} from 'lucide-react';

export type NavigationTarget =
  | 'simulator'
  | 'maps_gallery'
  | 'hardware_lab'
  | 'code_editor'
  | 'qa_tests'
  | 'inspector'
  | 'sensors_view'
  | 'camera_pov'
  | 'curriculum'
  | 'syllabus'
  | 'telemetry_logs';

interface AppSidebarProps {
  currentTarget: NavigationTarget;
  onSelectTarget: (target: NavigationTarget) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDarkMode: boolean;
}

interface NavItem {
  id: NavigationTarget;
  label: string;
  vietnameseLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentTarget,
  onSelectTarget,
  isCollapsed,
  onToggleCollapse,
  isDarkMode,
}) => {
  const sections: NavSection[] = [
    {
      title: 'Không Gian Mô Phỏng',
      items: [
        {
          id: 'simulator',
          label: 'Mô phỏng 3D',
          vietnameseLabel: 'Mô phỏng Robot & Bản đồ',
          icon: Monitor,
          color: 'text-blue-500',
        },
        {
          id: 'maps_gallery',
          label: 'Thư viện bản đồ',
          vietnameseLabel: '7 Địa hình thử nghiệm',
          icon: Map,
          color: 'text-emerald-500',
          badge: '7 Maps',
        },
        {
          id: 'hardware_lab',
          label: 'Lab phần cứng ảo',
          vietnameseLabel: 'Thí nghiệm GPIO/Cảm biến',
          icon: Cpu,
          color: 'text-indigo-500',
        },
      ],
    },
    {
      title: 'Lập Trình & Kiểm Thử',
      items: [
        {
          id: 'code_editor',
          label: 'Soạn kịch bản code',
          vietnameseLabel: 'Python Sandbox Runtime',
          icon: Code,
          color: 'text-purple-500',
        },
        {
          id: 'qa_tests',
          label: 'Kiểm thử QA (T01-T18)',
          vietnameseLabel: '18 Bài test định lượng',
          icon: ShieldCheck,
          color: 'text-teal-500',
          badge: '18 Tests',
        },
      ],
    },
    {
      title: 'Hệ Thống Robot CMU10',
      items: [
        {
          id: 'inspector',
          label: 'Khám phá linh kiện',
          vietnameseLabel: '10 Cụm cơ khí CAD 3D',
          icon: Wrench,
          color: 'text-amber-500',
          badge: 'CAD 3D',
        },
        {
          id: 'sensors_view',
          label: 'Cảm biến & LIDAR',
          vietnameseLabel: 'RPLIDAR 360° & Siêu âm',
          icon: Radar,
          color: 'text-cyan-500',
        },
        {
          id: 'camera_pov',
          label: 'Camera Robot POV',
          vietnameseLabel: 'CSI IMX219 & AprilTag',
          icon: Camera,
          color: 'text-pink-500',
        },
      ],
    },
    {
      title: 'Giáo Trình & Dữ Liệu',
      items: [
        {
          id: 'curriculum',
          label: '16 Bài học STEM',
          vietnameseLabel: 'Giáo trình M01 - M16',
          icon: BookOpen,
          color: 'text-blue-500',
          badge: 'M01-M16',
        },
        {
          id: 'syllabus',
          label: 'Đề cương & Chuẩn đầu ra',
          vietnameseLabel: '35 Tiết học & CLO',
          icon: GraduationCap,
          color: 'text-emerald-500',
        },
        {
          id: 'telemetry_logs',
          label: 'Nhật ký & Telemetry',
          vietnameseLabel: 'Dữ liệu đo thời gian thực',
          icon: Activity,
          color: 'text-rose-500',
        },
      ],
    },
  ];

  return (
    <aside
      className={`relative shrink-0 flex flex-col border-r transition-all duration-200 z-30 select-none ${
        isDarkMode
          ? 'bg-slate-900 border-slate-800 text-slate-300'
          : 'bg-white border-slate-200 text-slate-700'
      } ${isCollapsed ? 'w-16' : 'w-60'}`}
      aria-label="Sidebar điều hướng"
    >
      {/* Sidebar Header / Logo Branding */}
      <div className={`h-16 flex items-center border-b px-3.5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex flex-col truncate">
              <span className={`text-sm font-bold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                CMU10 Robotics
              </span>
              <span className="text-[10px] font-medium text-blue-500">
                Vibrant STEM Simulator
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Cpu className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Nav Sections List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="flex flex-col gap-0.5">
            {!isCollapsed && (
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {section.title}
              </span>
            )}

            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = currentTarget === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTarget(item.id)}
                  title={isCollapsed ? `${item.label} (${item.vietnameseLabel})` : undefined}
                  className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'bg-blue-600/20 text-blue-400 font-semibold shadow-xs'
                        : 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-md" />
                  )}

                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-500' : item.color}`} />

                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isDarkMode
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse / Expand Toggle Button Footer */}
      <div className={`p-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
            isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {!isCollapsed && <span>Thu gọn sidebar</span>}
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
