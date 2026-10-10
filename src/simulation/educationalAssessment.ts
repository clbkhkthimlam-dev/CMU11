import { RobotPose, SafetyState } from '../types/robot';
import { WorldMap } from '../types/map';
import { AutonomousNavState } from './autonomousNavigation';
import { OdometryState } from './localization';

export interface PracticeMissionReport {
  reportId: string;
  studentName: string;
  studentGroup: string;
  timestamp: string;
  module: {
    id: string;
    title: string;
  };
  map: {
    id: string;
    name: string;
    obstacleCount: number;
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  };
  metrics: {
    simTimeS: number;
    totalDistanceM: number;
    collisionCount: number;
    isEmergencyStopped: boolean;
    goalStatus: 'COMPLETED' | 'IN_PROGRESS' | 'BLOCKED' | 'STOPPED';
    targetGoal: { xM: number; zM: number } | null;
    finalDistanceToGoalM: number;
    odometryDriftM: number;
    finalPose: { xM: number; zM: number; yawDeg: number };
  };
  evaluation: {
    passed: boolean;
    score: number; // 0 to 10 scale
    gradeText: 'XUẤT SẮC' | 'GIỎI' | 'ĐẠT' | 'CẦN THỰC HÀNH LẠI';
    criteriaResults: Array<{ name: string; target: string; measured: string; passed: boolean }>;
    feedback: string;
  };
}

/**
 * Generates an objective, quantitative practice report for CMU Robotics Class 11
 */
export function generatePracticeReport(
  moduleId: string,
  moduleTitle: string,
  map: WorldMap,
  pose: RobotPose,
  simTimeS: number,
  safety: SafetyState,
  autoNavState?: AutonomousNavState,
  odometry?: OdometryState,
  studentName: string = 'Học Viên CMU11',
  studentGroup: string = 'Nhóm SMART'
): PracticeMissionReport {
  const reportId = `REP_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const nowStr = new Date().toISOString();

  const targetGoal = autoNavState?.activeGoal
    ? { xM: autoNavState.activeGoal.xM, zM: autoNavState.activeGoal.zM }
    : null;

  const finalDistanceToGoalM = targetGoal
    ? Math.hypot(targetGoal.xM - pose.xM, targetGoal.zM - pose.zM)
    : 0;

  const totalDistanceM = odometry?.totalDistanceM || 0;
  const odometryDriftM = odometry?.driftErrorM || 0;

  let goalStatus: PracticeMissionReport['metrics']['goalStatus'] = 'STOPPED';
  if (autoNavState?.status === 'GOAL_REACHED' || (targetGoal && finalDistanceToGoalM <= 0.10)) {
    goalStatus = 'COMPLETED';
  } else if (autoNavState?.status === 'TRACKING') {
    goalStatus = 'IN_PROGRESS';
  } else if (autoNavState?.status === 'OBSTACLE_BLOCKED' || autoNavState?.status === 'SENSOR_FAULT') {
    goalStatus = 'BLOCKED';
  }

  // Quantitative criteria checking
  const isGoalReached = targetGoal ? finalDistanceToGoalM <= 0.10 : true;
  const noCollision = !safety.isCollision;
  const safeEstop = !safety.isEmergencyStopped || goalStatus === 'COMPLETED';
  const driftAcceptable = odometryDriftM < 0.25;

  const criteriaResults = [
    {
      name: 'Tiếp Cận Điểm Đích (Goal Arrival)',
      target: 'Sai số vị trí <= 0.10m',
      measured: targetGoal ? `${finalDistanceToGoalM.toFixed(3)}m` : 'Không đặt đích',
      passed: isGoalReached,
    },
    {
      name: 'An Toàn Va Chạm (Collision Safety)',
      target: '0 va chạm (isCollision = false)',
      measured: safety.isCollision ? 'Phát hiện va chạm vật cản' : 'Không va chạm (An toàn)',
      passed: noCollision,
    },
    {
      name: 'Độ Trôi Định Vị (Odometry Drift)',
      target: 'Độ trôi trượt bánh < 0.25m',
      measured: `${(odometryDriftM * 100).toFixed(1)} cm`,
      passed: driftAcceptable,
    },
    {
      name: 'Tối Ưu Thời Gian Thực Thi (Time Efficiency)',
      target: 'Hoàn thành <= 180s',
      measured: `${simTimeS.toFixed(1)}s`,
      passed: simTimeS <= 180,
    },
  ];

  const passedCriteriaCount = criteriaResults.filter(c => c.passed).length;
  let score = 0;
  if (passedCriteriaCount === 4) score = 10.0;
  else if (passedCriteriaCount === 3) score = 8.0;
  else if (passedCriteriaCount === 2) score = 6.0;
  else score = 4.0;

  let gradeText: PracticeMissionReport['evaluation']['gradeText'] = 'CẦN THỰC HÀNH LẠI';
  if (score >= 9.0) gradeText = 'XUẤT SẮC';
  else if (score >= 8.0) gradeText = 'GIỎI';
  else if (score >= 6.0) gradeText = 'ĐẠT';

  const passed = score >= 6.0 && noCollision;

  const feedback = passed
    ? `Robot hoàn thành tốt bài thực hành ${moduleId} trên bản đồ "${map.name}". Đạt các tiêu chí động học và an toàn vật lý.`
    : `Cần cải thiện kỹ năng điều hướng cho bài ${moduleId}: Kiểm tra lại bán kính né vật cản và thời gian hành trình.`;

  return {
    reportId,
    studentName,
    studentGroup,
    timestamp: nowStr,
    module: { id: moduleId, title: moduleTitle },
    map: {
      id: map.id,
      name: map.name,
      obstacleCount: map.obstacles.length,
      bounds: { ...map.bounds },
    },
    metrics: {
      simTimeS: parseFloat(simTimeS.toFixed(2)),
      totalDistanceM: parseFloat(totalDistanceM.toFixed(3)),
      collisionCount: safety.isCollision ? 1 : 0,
      isEmergencyStopped: safety.isEmergencyStopped,
      goalStatus,
      targetGoal,
      finalDistanceToGoalM: parseFloat(finalDistanceToGoalM.toFixed(3)),
      odometryDriftM: parseFloat(odometryDriftM.toFixed(4)),
      finalPose: {
        xM: parseFloat(pose.xM.toFixed(2)),
        zM: parseFloat(pose.zM.toFixed(2)),
        yawDeg: parseFloat(((pose.yawRad * 180) / Math.PI).toFixed(1)),
      },
    },
    evaluation: {
      passed,
      score,
      gradeText,
      criteriaResults,
      feedback,
    },
  };
}

/**
 * Serializes report to human-readable structured Vietnamese text for teachers and grading records
 */
export function formatPracticeReportAsText(report: PracticeMissionReport): string {
  return `================================================================================
BÁO CÁO KẾT QUẢ THỰC HÀNH ROBOTICS LỚP 11 (CMU10)
Mã Báo Cáo: ${report.reportId} · Ngày: ${report.timestamp}
================================================================================
1. THÔNG TIN HỌC VIÊN & BÀI HỌC:
- Học viên / Nhóm: ${report.studentName} (${report.studentGroup})
- Bài thực hành: [${report.module.id}] ${report.module.title}
- Bản đồ mô phỏng: ${report.map.name} (${report.map.obstacleCount} vật cản)

2. THÔNG SỐ ĐO ĐẠC MÔ PHỎNG (TELEMETRY METRICS):
- Thời gian mô phỏng (Sim Time): ${report.metrics.simTimeS} giây
- Quãng đường di chuyển thực tế: ${report.metrics.totalDistanceM} m
- Tọa độ kết thúc (Final Pose): X=${report.metrics.finalPose.xM}m, Z=${report.metrics.finalPose.zM}m, Yaw=${report.metrics.finalPose.yawDeg}°
- Mục tiêu cần đạt: ${report.metrics.targetGoal ? `(${report.metrics.targetGoal.xM}, ${report.metrics.targetGoal.zM})m` : 'N/A'}
- Sai số khoảng cách đến đích: ${report.metrics.finalDistanceToGoalM} m
- Sai số trôi định vị (Odometry Drift): ${(report.metrics.odometryDriftM * 100).toFixed(1)} cm
- Trạng thái nhiệm vụ: ${report.metrics.goalStatus}

3. ĐÁNH GIÁ CHUẨN ĐẦU RA (ASSESSMENT):
${report.evaluation.criteriaResults.map(c => `  [${c.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}] ${c.name}: ${c.measured} (Yêu cầu: ${c.target})`).join('\n')}

- Xếp loại: ${report.evaluation.gradeText} (${report.evaluation.score}/10 điểm)
- Kết luận: ${report.evaluation.passed ? 'ĐẠT CHUẨN ĐẦU RA' : 'CHƯA ĐẠT CHUẨN'}
- Nhận xét: ${report.evaluation.feedback}
================================================================================`;
}
