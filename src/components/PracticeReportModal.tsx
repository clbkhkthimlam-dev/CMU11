import React, { useState } from 'react';
import { PracticeMissionReport, formatPracticeReportAsText } from '../simulation/educationalAssessment';
import {
  FileText,
  Download,
  Copy,
  Check,
  X,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
  Compass,
  AlertTriangle,
} from 'lucide-react';

interface PracticeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PracticeMissionReport | null;
}

export const PracticeReportModal: React.FC<PracticeReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopyText = () => {
    const text = formatPracticeReportAsText(report);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.reportId}_${report.module.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Báo Cáo Nghiệm Thu Thực Hành (Mission Practice Report)
              </h3>
              <p className="text-xs text-slate-500">
                Đánh giá định lượng kết quả bài tập [{report.module.id}] {report.module.title}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] flex flex-col gap-4 text-xs">
          {/* Top Score Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            report.evaluation.passed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold font-mono ${
                report.evaluation.passed ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {report.evaluation.score.toFixed(1)}
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold">
                  Xếp Loại: {report.evaluation.gradeText}
                </span>
                <p className="text-xs mt-0.5 opacity-90">{report.evaluation.feedback}</p>
              </div>
            </div>

            <span className="font-mono text-[11px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-md border border-slate-200">
              Mã: {report.reportId}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Thời Gian:
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {report.metrics.simTimeS.toFixed(1)}s
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                Quãng Đường:
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {report.metrics.totalDistanceM.toFixed(2)}m
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                Sai Số Đến Đích:
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {report.metrics.finalDistanceToGoalM.toFixed(3)}m
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Độ Trôi Odometry:
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {(report.metrics.odometryDriftM * 100).toFixed(1)}cm
              </span>
            </div>
          </div>

          {/* Criteria Checklist */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-700">
              Đối Chiếu Tiêu Chí Hoàn Thành Nhiệm Vụ (Assessment Criteria)
            </div>
            <div className="divide-y divide-slate-100">
              {report.evaluation.criteriaResults.map((c, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-medium text-slate-900">{c.name}</span>
                      <div className="text-[11px] text-slate-500">Yêu cầu chuẩn: {c.target}</div>
                    </div>
                  </div>
                  <span className={`font-mono text-xs font-semibold ${
                    c.passed ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {c.measured}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Dữ liệu được xuất trực tiếp từ lõi vật lý và cảm biến CMU10 Robotics
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã Sao Chép' : 'Sao Chép Văn Bản'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Báo Cáo JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
