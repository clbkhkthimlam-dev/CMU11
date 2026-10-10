import { MissionConfig, MissionWaypoint, MissionRunMetrics, LabAssignment, LabGradingResult, LabGradingScoreItem } from '../types/mission';
import { WorldMap } from '../types/map';
import { isGoalValid } from './autonomousNavigation';

/**
 * Validates complete mission config including map bounds, obstacles collision, and waypoints sequence
 */
export function validateMissionConfig(
  mission: MissionConfig,
  map: WorldMap
): { isValid: boolean; errors: string[]; totalEstimatedPathM: number } {
  const errors: string[] = [];

  if (!mission.id || mission.id.trim() === '') {
    errors.push('Thiếu mã định danh nhiệm vụ (ID).');
  }

  if (!mission.title || mission.title.trim() === '') {
    errors.push('Tên nhiệm vụ không được để trống.');
  }

  if (!mission.waypoints || mission.waypoints.length === 0) {
    errors.push('Nhiệm vụ phải có ít nhất 1 waypoint.');
  }

  // Validate spawn pose
  const spawnValid = isGoalValid({ xM: mission.spawnPose.xM, zM: mission.spawnPose.zM }, map);
  if (!spawnValid.isValid) {
    errors.push(`Điểm xuất phát (${mission.spawnPose.xM}, ${mission.spawnPose.zM}) không hợp lệ: ${spawnValid.reason}`);
  }

  // Validate waypoints
  let totalEstimatedPathM = 0;
  let prevX = mission.spawnPose.xM;
  let prevZ = mission.spawnPose.zM;

  mission.waypoints.forEach((wp, index) => {
    const validCheck = isGoalValid({ xM: wp.xM, zM: wp.zM }, map);
    if (!validCheck.isValid) {
      errors.push(`Waypoint ${index + 1} (${wp.name || wp.id}): ${validCheck.reason}`);
    }
    const dist = Math.hypot(wp.xM - prevX, wp.zM - prevZ);
    totalEstimatedPathM += dist;
    prevX = wp.xM;
    prevZ = wp.zM;
  });

  return {
    isValid: errors.length === 0,
    errors,
    totalEstimatedPathM,
  };
}

/**
 * Objectively grades a completed or stopped mission run against pedagogical rubrics
 */
export function gradeMissionRun(
  assignment: LabAssignment,
  metrics: MissionRunMetrics,
  studentName: string = 'Học Viên CMU',
  studentGroup: string = 'Nhóm Robotics'
): LabGradingResult {
  const scoreItems: LabGradingScoreItem[] = [];

  for (const rubric of assignment.rubrics) {
    let score = 0;
    let measuredValue = 'N/A';
    let hasData = false;
    let comment = '';
    let passed = false;

    switch (rubric.id) {
      case 'RUBRIC_COMPLETION': {
        hasData = true;
        measuredValue = `${metrics.completedWaypointsCount}/${metrics.totalWaypointsCount} waypoints (${metrics.status})`;
        if (metrics.status === 'COMPLETED' && metrics.completedWaypointsCount === metrics.totalWaypointsCount) {
          score = 10;
          passed = true;
          comment = 'Hoàn thành 100% tất cả các waypoint theo thứ tự.';
        } else {
          score = (metrics.completedWaypointsCount / Math.max(1, metrics.totalWaypointsCount)) * 8;
          passed = false;
          comment = `Chỉ hoàn thành ${metrics.completedWaypointsCount}/${metrics.totalWaypointsCount} điểm.`;
        }
        break;
      }

      case 'RUBRIC_COLLISION_SAFETY': {
        hasData = true;
        measuredValue = `${metrics.collisionCount} lần va chạm`;
        if (metrics.collisionCount === 0) {
          score = 10;
          passed = true;
          comment = 'Tuyệt đối an toàn, 0 lần va chạm vật cản.';
        } else if (metrics.collisionCount === 1) {
          score = 4;
          passed = false;
          comment = 'Có 1 lần chạm biên/vật cản.';
        } else {
          score = 0;
          passed = false;
          comment = 'Vi phạm an toàn nghiêm trọng (>1 lần va chạm).';
        }
        break;
      }

      case 'RUBRIC_TIME_EFFICIENCY': {
        hasData = metrics.elapsedSimTimeS > 0;
        const maxTime = assignment.missionConfig.timeoutS || 120;
        measuredValue = `${metrics.elapsedSimTimeS.toFixed(1)}s / max ${maxTime}s`;
        if (metrics.elapsedSimTimeS <= maxTime * 0.6) {
          score = 10;
          passed = true;
          comment = 'Thời gian thực thi xuất sắc (nhanh hơn 40% định mức).';
        } else if (metrics.elapsedSimTimeS <= maxTime) {
          score = 8.5;
          passed = true;
          comment = 'Đạt thời gian định mức.';
        } else {
          score = Math.max(0, 10 - (metrics.elapsedSimTimeS - maxTime) * 0.2);
          passed = false;
          comment = 'Vượt quá thời gian định mức quy định.';
        }
        break;
      }

      case 'RUBRIC_TRACKING_ACCURACY': {
        hasData = metrics.crossTrackErrors.length > 0;
        const avgCte = metrics.averageCrossTrackErrorM;
        measuredValue = `CTE TB: ${avgCte.toFixed(3)}m, Max: ${metrics.maxCrossTrackErrorM.toFixed(3)}m`;
        if (avgCte <= 0.08) {
          score = 10;
          passed = true;
          comment = 'Bám quỹ đạo cực kỳ chính xác (CTE <= 8cm).';
        } else if (avgCte <= 0.15) {
          score = 8.0;
          passed = true;
          comment = 'Bám quỹ đạo tốt (CTE <= 15cm).';
        } else if (avgCte <= 0.30) {
          score = 6.0;
          passed = false;
          comment = 'Độ lệch quỹ đạo tương đối cao.';
        } else {
          score = 3.0;
          passed = false;
          comment = 'Dao động bám đường lớn.';
        }
        break;
      }

      case 'RUBRIC_FINAL_PRECISION': {
        hasData = metrics.finalGoalDistanceM >= 0;
        measuredValue = `Sai số đích cuối: ${metrics.finalGoalDistanceM.toFixed(3)}m`;
        if (metrics.finalGoalDistanceM <= 0.08) {
          score = 10;
          passed = true;
          comment = 'Tiếp cận đích chuẩn xác cao (<= 8cm).';
        } else if (metrics.finalGoalDistanceM <= 0.15) {
          score = 8.0;
          passed = true;
          comment = 'Nằm trong dung sai cho phép (<= 15cm).';
        } else {
          score = Math.max(0, 10 - metrics.finalGoalDistanceM * 20);
          passed = false;
          comment = 'Chưa vào vùng dung sai đích.';
        }
        break;
      }

      default: {
        hasData = true;
        measuredValue = 'Tiêu chuẩn tùy biến';
        score = 8;
        passed = true;
        comment = 'Đạt yêu cầu chung.';
      }
    }

    scoreItems.push({
      rubricId: rubric.id,
      name: rubric.name,
      weightPercent: rubric.weightPercent,
      targetRule: rubric.targetRule,
      measuredValue,
      hasData,
      score: Math.round(score * 10) / 10,
      passed,
      comment,
    });
  }

  // Calculate weighted total score
  const totalWeight = scoreItems.reduce((acc, item) => acc + item.weightPercent, 0) || 100;
  const weightedSum = scoreItems.reduce((acc, item) => acc + (item.score * item.weightPercent), 0);
  const totalScore = Math.round((weightedSum / totalWeight) * 10) / 10;

  const passed = totalScore >= 7.0 && metrics.collisionCount === 0 && metrics.status === 'COMPLETED';

  let gradeTier: LabGradingResult['gradeTier'] = 'CẦN THỰC HÀNH LẠI';
  if (totalScore >= 9.0 && metrics.collisionCount === 0) gradeTier = 'XUẤT SẮC';
  else if (totalScore >= 8.0 && metrics.collisionCount === 0) gradeTier = 'GIỎI';
  else if (totalScore >= 7.0) gradeTier = 'ĐẠT';

  const summaryFeedback = passed
    ? `Học viên hoàn thành xuất sắc bài thực hành với điểm tổng hợp ${totalScore}/10 (${gradeTier}). Thuật toán hoạt động ổn định và đáp ứng chuẩn an toàn.`
    : `Bài thực hành đạt ${totalScore}/10 (${gradeTier}). ${metrics.collisionCount > 0 ? 'Có va chạm vật cản cần khắc phục an toàn.' : 'Cần tối ưu thời gian hoặc độ chính xác bám đường.'}`;

  return {
    evaluationId: `LAB_EVAL_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    studentName,
    studentGroup,
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    evaluatedAt: new Date().toISOString(),
    mode: assignment.missionConfig.mode,
    metrics,
    scoreItems,
    totalScore,
    passed,
    gradeTier,
    summaryFeedback,
  };
}

/**
 * Built-in Pedagogical Lab Assignments for CMU10
 */
export const BUILT_IN_LAB_ASSIGNMENTS: LabAssignment[] = [
  {
    id: 'LAB_01',
    title: 'Lab 1: Tuần Tra Tự Hành Đa Điểm Phòng Thí Nghiệm',
    category: 'AUTONOMOUS',
    level: 'BASIC',
    objectives: [
      'Lập lộ trình tự hành qua 3 trạm kiểm tra trong STEM Lab',
      'Kiểm chứng thuật toán A* và Pure Pursuit trên robot dải xích',
      'Đạt độ chính xác tiếp cận mỗi trạm <= 10cm và 0 va chạm',
    ],
    description: 'Robot xuất phát tại trạm nạp điện, lần lượt di chuyển qua 3 waypoint tuần tra và dừng an toàn tại đích.',
    recommendedMapId: 'training_lab',
    missionConfig: {
      id: 'MIS_01',
      title: 'Tuần Tra STEM Lab 3 Trạm',
      description: 'Lộ trình tuần tra khép kín 3 trạm kiểm định chất lượng',
      mapId: 'training_lab',
      createdAt: '2026-10-10',
      updatedAt: '2026-10-10',
      author: 'Giảng Viên CMU Robotics',
      spawnPose: { xM: -1.2, zM: -1.2, yawRad: 0 },
      waypoints: [
        { id: 'wp_1', order: 1, name: 'Trạm 1 (Góc Đông-Bắc)', xM: 1.2, zM: -1.0, toleranceM: 0.12, status: 'PENDING' },
        { id: 'wp_2', order: 2, name: 'Trạm 2 (Khu Trung Tâm)', xM: 0.0, zM: 0.8, toleranceM: 0.12, status: 'PENDING' },
        { id: 'wp_3', order: 3, name: 'Trạm 3 (Đích Đỗ Xe)', xM: -1.0, zM: 1.0, toleranceM: 0.12, status: 'PENDING' },
      ],
      timeoutS: 60,
      mode: 'AUTONOMOUS',
    },
    rubrics: [
      { id: 'RUBRIC_COMPLETION', name: 'Hoàn Thành Waypoint', weightPercent: 35, targetRule: 'Đi qua đủ 3/3 waypoint', maxPoints: 10 },
      { id: 'RUBRIC_COLLISION_SAFETY', name: 'An Toàn Va Chạm', weightPercent: 25, targetRule: '0 va chạm', maxPoints: 10 },
      { id: 'RUBRIC_TRACKING_ACCURACY', name: 'Độ Lệch Quỹ Đạo (CTE)', weightPercent: 20, targetRule: 'CTE TB <= 0.10m', maxPoints: 10 },
      { id: 'RUBRIC_FINAL_PRECISION', name: 'Độ Chính Xác Đích', weightPercent: 20, targetRule: 'Sai số <= 0.10m', maxPoints: 10 },
    ],
    instructions: {
      teacherNotes: 'Đánh giá khả năng cấu hình lookahead distance của Pure Pursuit và dung sai waypoint của sinh viên.',
      studentTasks: [
        'Khởi chạy nhiệm vụ tuần tra tự hành',
        'Quan sát robot đi qua lần lượt từng trạm kiểm tra',
        'Đảm bảo không va chạm vào các kệ dụng cụ trong lab',
      ],
    },
  },
  {
    id: 'LAB_02',
    title: 'Lab 2: Vượt Hành Lang Zic-Zac & Tránh Vật Cản Động',
    category: 'AUTONOMOUS',
    level: 'INTERMEDIATE',
    objectives: [
      'Điều hướng qua hành lang chữ S zic-zac hẹp',
      'Kích hoạt tính năng replanning động khi phát hiện vật cản mới',
      'Đảm bảo thời gian hoàn thành dưới 90 giây',
    ],
    description: 'Thử nghiệm khả năng phản xạ và replanning của hệ thống tự hành khi không gian hẹp và có vật cản xuất hiện.',
    recommendedMapId: 'corridor_test',
    missionConfig: {
      id: 'MIS_02',
      title: 'Vượt Hành Lang Zic-Zac',
      description: 'Hành trình luồn lách qua các góc cua vuông góc trong hành lang',
      mapId: 'corridor_test',
      createdAt: '2026-10-10',
      updatedAt: '2026-10-10',
      author: 'Bộ Môn Tự Động Hóa',
      spawnPose: { xM: -2.0, zM: -0.6, yawRad: 0 },
      waypoints: [
        { id: 'wp_c1', order: 1, name: 'Cua Trái 1', xM: -0.8, zM: -0.6, toleranceM: 0.12, status: 'PENDING' },
        { id: 'wp_c2', order: 2, name: 'Trung Chuyển', xM: 0.5, zM: 0.6, toleranceM: 0.12, status: 'PENDING' },
        { id: 'wp_c3', order: 3, name: 'Cửa Ra Hành Lang', xM: 2.0, zM: 0.6, toleranceM: 0.12, status: 'PENDING' },
      ],
      timeoutS: 90,
      mode: 'AUTONOMOUS',
    },
    rubrics: [
      { id: 'RUBRIC_COMPLETION', name: 'Hoàn Thành Tuyến Đường', weightPercent: 30, targetRule: 'Đến cửa ra an toàn', maxPoints: 10 },
      { id: 'RUBRIC_COLLISION_SAFETY', name: 'Không Chạm Tường', weightPercent: 30, targetRule: '0 va chạm góc tường', maxPoints: 10 },
      { id: 'RUBRIC_TIME_EFFICIENCY', name: 'Hiệu Quả Thời Gian', weightPercent: 20, targetRule: 'Hoàn thành <= 70s', maxPoints: 10 },
      { id: 'RUBRIC_TRACKING_ACCURACY', name: 'Bám Làn Hành Lang', weightPercent: 20, targetRule: 'CTE TB <= 0.12m', maxPoints: 10 },
    ],
    instructions: {
      teacherNotes: 'Chú ý quan sát phản xạ LiDAR và tốc độ quay của hai dải xích tại các góc cua.',
      studentTasks: [
        'Chọn sa bàn Hành Lang Thử Nghiệm',
        'Bật lớp hiển thị Occupancy Grid để xem robot cập nhật bản đồ',
        'Chạy nhiệm vụ và xuất báo cáo kết quả',
      ],
    },
  },
  {
    id: 'LAB_03',
    title: 'Lab 3: Điều Khiển Thủ Công Khéo Léo & Xử Lý Sự Cố',
    category: 'MANUAL',
    level: 'BASIC',
    objectives: [
      'Thành thạo kỹ năng lái xe bánh xích bằng D-Pad và Joystick',
      'Luyện tập điều tiết tốc độ vi sai để không va chạm vật cản',
      'Sử dụng nút E-STOP dừng khẩn cấp khi phát hiện nguy cơ',
    ],
    description: 'Bài thực hành kỹ năng lái thủ công dành cho học viên mới làm quen với động học xe robot bánh xích.',
    recommendedMapId: 'training_lab',
    missionConfig: {
      id: 'MIS_03',
      title: 'Lái Xe Thủ Công Qua 2 Cổng Tiêu',
      description: 'Lái qua cổng số 1 và số 2 bằng bàn phím hoặc joystick',
      mapId: 'training_lab',
      createdAt: '2026-10-10',
      updatedAt: '2026-10-10',
      author: 'Bộ Môn Thực Hành Robot',
      spawnPose: { xM: -1.0, zM: -1.0, yawRad: 0 },
      waypoints: [
        { id: 'wp_m1', order: 1, name: 'Cổng Tiêu 1', xM: 0.0, zM: -0.5, toleranceM: 0.15, status: 'PENDING' },
        { id: 'wp_m2', order: 2, name: 'Cổng Tiêu 2', xM: 1.0, zM: 0.8, toleranceM: 0.15, status: 'PENDING' },
      ],
      timeoutS: 60,
      mode: 'MANUAL',
    },
    rubrics: [
      { id: 'RUBRIC_COMPLETION', name: 'Lái Qua Cổng', weightPercent: 40, targetRule: 'Qua đủ 2 cổng', maxPoints: 10 },
      { id: 'RUBRIC_COLLISION_SAFETY', name: 'Không Va Chạm Tiêu', weightPercent: 35, targetRule: '0 va chạm', maxPoints: 10 },
      { id: 'RUBRIC_TIME_EFFICIENCY', name: 'Thời Gian Vận Hành', weightPercent: 25, targetRule: '<= 45s', maxPoints: 10 },
    ],
    instructions: {
      teacherNotes: 'Kiểm tra độ nhuyễn tay lái của học sinh và khả năng giữ thăng bằng tốc độ hai dải xích.',
      studentTasks: [
        'Dùng cụm phím W-A-S-D hoặc Joystick ảo',
        'Điều khiển robot qua 2 cổng tiêu',
        'Không để va quệt vào chướng ngại vật xung quanh',
      ],
    },
  },
];
