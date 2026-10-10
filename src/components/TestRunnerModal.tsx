import React, { useState } from 'react';
import { runQuantitativeTests } from '../simulation/testRunner';
import { TestResult } from '../types/simulation';
import { ShieldCheck, Play, CheckCircle2, XCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  if (!isOpen) return null;

  const handleRunAllTests = async () => {
    setIsRunning(true);
    // Simulate brief test cycle
    setTimeout(async () => {
      const results = await runQuantitativeTests();
      setTestResults(results);
      setIsRunning(false);
    }, 400);
  };

  const passCount = testResults.filter(t => t.status === 'PASS').length;
  const failCount = testResults.filter(t => t.status === 'FAIL').length;
  const notImplCount = testResults.filter(t => t.status === 'NOT_IMPLEMENTED').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bộ Kiểm Thử Toàn Diện & Chuẩn Hóa CMU10 (60 QA Tests T01 - T60)
              </h3>
              <p className="text-xs text-slate-500">
                Kiểm chứng toàn vẹn: Động học, Va chạm SAT, LiDAR 360°, AprilTag, Odometry, Occupancy Grid, A* Planner, Pure Pursuit, Kịch bản tự hành (T01-T40), Độ bền & Benchmark (T41-T50) và Nhiệm vụ Đa Waypoint, Lab Quản Lý & Chấm Điểm Sư Phạm (T51-T60).
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

        {/* Toolbar & Stats */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={handleRunAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isRunning ? 'Đang Chạy Kiểm Thử...' : 'Chạy Toàn Bộ 60 Bài Test Nghiệm Thu (T01 - T60)'}</span>
          </button>

          {testResults.length > 0 && (
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đạt: {passCount}
              </span>
              <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                <XCircle className="w-4 h-4 text-red-600" />
                Không đạt: {failCount}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                Chưa triển khai: {notImplCount}
              </span>
            </div>
          )}
        </div>

        {/* Test Results Table */}
        <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-3">
          {testResults.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
              <ShieldCheck className="w-12 h-12 text-slate-300" />
              <span>Chưa chạy kiểm thử. Nhấn nút bên trên để khởi động bộ kiểm tra tự động.</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3 w-16">ID</th>
                    <th className="py-2.5 px-3">Tên Bài Kiểm Thử</th>
                    <th className="py-2.5 px-3">Tiêu Chí Định Lượng</th>
                    <th className="py-2.5 px-3">Kết Quả Đo Được</th>
                    <th className="py-2.5 px-3 w-28 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {testResults.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-blue-600">{t.id}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                        <div>{t.name}</div>
                        <div className="text-[11px] text-slate-500 font-sans mt-0.5">{t.details}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">{t.targetCriteria}</td>
                      <td className="py-2.5 px-3 text-slate-800 text-[11px] font-semibold">{t.measuredResult}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'FAIL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.status === 'PASS' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {t.status === 'FAIL' && <XCircle className="w-3 h-3 text-red-600" />}
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
