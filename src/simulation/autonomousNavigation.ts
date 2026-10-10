import { RobotPose, DEFAULT_ROBOT_CONFIG, SensorData } from '../types/robot';
import { WorldMap, MapObstacle } from '../types/map';
import { checkCollision, normalizeAngle, getEffectiveObstacles } from './physicsEngine';

export type NavigationStatus =
  | 'IDLE'
  | 'PLANNING'
  | 'TRACKING'
  | 'GOAL_REACHED'
  | 'OBSTACLE_BLOCKED'
  | 'SENSOR_FAULT'
  | 'ESTOP';

/**
 * Validates the physical integrity and availability of sensor streams
 */
export function validateSensorsHealth(sensors: SensorData): { isHealthy: boolean; faultReason?: string } {
  if (!sensors) {
    return { isHealthy: false, faultReason: 'Cấu trúc dữ liệu cảm biến không tồn tại' };
  }
  if (isNaN(sensors.frontRangeM) || !isFinite(sensors.frontRangeM) || sensors.frontRangeM < 0) {
    return { isHealthy: false, faultReason: 'Cảm biến siêu âm phía trước trả về giá trị không hợp lệ (NaN hoặc âm)' };
  }
  if (!Array.isArray(sensors.lidarScan) || sensors.lidarScan.length === 0) {
    return { isHealthy: false, faultReason: 'Mảng chùm tia LiDAR 360° bị rỗng hoặc mất kết nối phần cứng' };
  }
  if (sensors.lidarScan.some(b => isNaN(b.distanceM) || !isFinite(b.distanceM) || b.distanceM < 0)) {
    return { isHealthy: false, faultReason: 'Chùm tia LiDAR chứa khoảng cách không hợp lệ (NaN hoặc số âm)' };
  }
  if (
    !sensors.imu ||
    isNaN(sensors.imu.yawRad) ||
    !isFinite(sensors.imu.yawRad) ||
    isNaN(sensors.imu.yawRateRadps) ||
    !isFinite(sensors.imu.yawRateRadps)
  ) {
    return { isHealthy: false, faultReason: 'Cảm biến quán tính IMU bị lỗi dữ liệu góc xoay hoặc vận tốc góc' };
  }
  return { isHealthy: true };
}

export interface NavGoal {
  id: string;
  xM: number;
  zM: number;
  toleranceM: number;
  name?: string;
}

export interface NavPath {
  waypoints: Array<{ xM: number; zM: number }>;
  totalLengthM: number;
}

export interface PurePursuitOutput {
  vLeftMps: number;
  vRightMps: number;
  linearMps: number;
  angularRadps: number;
  lookaheadPoint: { xM: number; zM: number };
  distanceToGoalM: number;
  crossTrackErrorM: number;
  isGoalReached: boolean;
}

export interface AutonomousNavState {
  status: NavigationStatus;
  activeGoal: NavGoal | null;
  plannedPath: NavPath | null;
  currentPathIndex: number;
  lookaheadPoint: { xM: number; zM: number } | null;
  distanceToGoalM: number;
  crossTrackErrorM: number;
  replanCount: number;
  lastMessage?: string;
}

/**
 * Validates whether a target goal position is safe and reachable
 */
export function isGoalValid(
  goal: { xM: number; zM: number },
  map: WorldMap,
  robotRadiusM: number = 0.20,
  simTimeS: number = 0
): { isValid: boolean; reason?: string } {
  const b = map.bounds;
  // Inside bounds check
  if (
    goal.xM < b.minX + robotRadiusM ||
    goal.xM > b.maxX - robotRadiusM ||
    goal.zM < b.minZ + robotRadiusM ||
    goal.zM > b.maxZ - robotRadiusM
  ) {
    return {
      isValid: false,
      reason: `Điểm đích (${goal.xM.toFixed(2)}, ${goal.zM.toFixed(2)}) nằm ngoài phạm vi an toàn của bản đồ.`,
    };
  }

  // Obstacle collision check with safety inflation margin
  const collisionRadius = robotRadiusM + 0.05;
  if (checkCollision(goal.xM, goal.zM, collisionRadius, map, simTimeS)) {
    return {
      isValid: false,
      reason: `Điểm đích (${goal.xM.toFixed(2)}, ${goal.zM.toFixed(2)}) quá gần hoặc trùng với vật cản.`,
    };
  }

  return { isValid: true };
}

/**
 * Checks line-of-sight clearance between two points on the map
 */
export function hasLineOfSight(
  p1: { xM: number; zM: number },
  p2: { xM: number; zM: number },
  map: WorldMap,
  clearanceM: number = 0.22,
  simTimeS: number = 0
): boolean {
  const dist = Math.hypot(p2.xM - p1.xM, p2.zM - p1.zM);
  const steps = Math.max(3, Math.ceil(dist / 0.10));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = p1.xM + t * (p2.xM - p1.xM);
    const z = p1.zM + t * (p2.zM - p1.zM);
    if (checkCollision(x, z, clearanceM, map, simTimeS)) {
      return false;
    }
  }
  return true;
}

/**
 * A* Grid Path Planning Algorithm with obstacle inflation
 */
export function planPathAStar(
  start: { xM: number; zM: number },
  goal: { xM: number; zM: number },
  map: WorldMap,
  simTimeS: number = 0,
  gridResolutionM: number = 0.20,
  robotClearanceM: number = 0.22
): NavPath | null {
  // If start is in line of sight to goal, direct path is optimal
  if (hasLineOfSight(start, goal, map, robotClearanceM, simTimeS)) {
    const dist = Math.hypot(goal.xM - start.xM, goal.zM - start.zM);
    return {
      waypoints: [{ ...start }, { ...goal }],
      totalLengthM: dist,
    };
  }

  const b = map.bounds;
  const cols = Math.ceil((b.maxX - b.minX) / gridResolutionM);
  const rows = Math.ceil((b.maxZ - b.minZ) / gridResolutionM);

  const toCoord = (xM: number, zM: number): [number, number] => {
    const c = Math.max(0, Math.min(cols - 1, Math.floor((xM - b.minX) / gridResolutionM)));
    const r = Math.max(0, Math.min(rows - 1, Math.floor((zM - b.minZ) / gridResolutionM)));
    return [c, r];
  };

  const toWorld = (c: number, r: number): { xM: number; zM: number } => ({
    xM: b.minX + (c + 0.5) * gridResolutionM,
    zM: b.minZ + (r + 0.5) * gridResolutionM,
  });

  const [startC, startR] = toCoord(start.xM, start.zM);
  const [goalC, goalR] = toCoord(goal.xM, goal.zM);

  const startKey = `${startC},${startR}`;
  const goalKey = `${goalC},${goalR}`;

  interface Node {
    c: number;
    r: number;
    g: number;
    h: number;
    f: number;
    parentKey?: string;
  }

  const openSet = new Map<string, Node>();
  const closedSet = new Set<string>();

  const heuristic = (c: number, r: number): number => {
    const dx = (c - goalC) * gridResolutionM;
    const dz = (r - goalR) * gridResolutionM;
    return Math.hypot(dx, dz);
  };

  const startH = heuristic(startC, startR);
  openSet.set(startKey, { c: startC, r: startR, g: 0, h: startH, f: startH });

  const nodeMap = new Map<string, Node>();
  nodeMap.set(startKey, openSet.get(startKey)!);

  // 8-directional neighbors
  const neighbors = [
    [-1, 0, 1.0], [1, 0, 1.0], [0, -1, 1.0], [0, 1, 1.0],
    [-1, -1, 1.414], [-1, 1, 1.414], [1, -1, 1.414], [1, 1, 1.414],
  ];

  let iterations = 0;
  const maxIterations = 4000;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest f in openSet
    let bestKey = '';
    let lowestF = Infinity;
    for (const [key, node] of openSet.entries()) {
      if (node.f < lowestF) {
        lowestF = node.f;
        bestKey = key;
      }
    }

    const current = openSet.get(bestKey)!;
    if (current.c === goalC && current.r === goalR) {
      // Reconstruct path
      const rawWaypoints: Array<{ xM: number; zM: number }> = [{ ...goal }];
      let currTrace: Node | undefined = current;
      while (currTrace && currTrace.parentKey) {
        rawWaypoints.push(toWorld(currTrace.c, currTrace.r));
        currTrace = nodeMap.get(currTrace.parentKey);
      }
      rawWaypoints.push({ ...start });
      rawWaypoints.reverse();

      // Path smoothing (Shortcut collinear / clear segments)
      const smoothed: Array<{ xM: number; zM: number }> = [rawWaypoints[0]];
      let currentAnchor = 0;
      while (currentAnchor < rawWaypoints.length - 1) {
        let furthestVisible = currentAnchor + 1;
        for (let next = rawWaypoints.length - 1; next > currentAnchor + 1; next--) {
          if (hasLineOfSight(rawWaypoints[currentAnchor], rawWaypoints[next], map, robotClearanceM, simTimeS)) {
            furthestVisible = next;
            break;
          }
        }
        smoothed.push(rawWaypoints[furthestVisible]);
        currentAnchor = furthestVisible;
      }

      // Calculate total length
      let totalLengthM = 0;
      for (let i = 0; i < smoothed.length - 1; i++) {
        totalLengthM += Math.hypot(
          smoothed[i + 1].xM - smoothed[i].xM,
          smoothed[i + 1].zM - smoothed[i].zM
        );
      }

      return { waypoints: smoothed, totalLengthM };
    }

    openSet.delete(bestKey);
    closedSet.add(bestKey);

    for (const [dc, dr, costMult] of neighbors) {
      const nc = current.c + dc;
      const nr = current.r + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;

      const nKey = `${nc},${nr}`;
      if (closedSet.has(nKey)) continue;

      const nPos = toWorld(nc, nr);
      // Collision check with safety envelope
      if (checkCollision(nPos.xM, nPos.zM, robotClearanceM, map, simTimeS)) {
        closedSet.add(nKey);
        continue;
      }

      const tentativeG = current.g + gridResolutionM * costMult;
      const existing = nodeMap.get(nKey);

      if (!existing || tentativeG < existing.g) {
        const h = heuristic(nc, nr);
        const node: Node = {
          c: nc,
          r: nr,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parentKey: bestKey,
        };
        nodeMap.set(nKey, node);
        openSet.set(nKey, node);
      }
    }
  }

  return null; // No path found
}

/**
 * Pure Pursuit path tracking controller
 * Follows path waypoints with speed profiling and heading curvature control
 */
export function computePurePursuit(
  pose: RobotPose,
  path: NavPath,
  goalToleranceM: number = 0.10,
  maxLinearSpeedMps: number = DEFAULT_ROBOT_CONFIG.maxLinearSpeedMps,
  maxAngularSpeedRadps: number = DEFAULT_ROBOT_CONFIG.maxAngularSpeedRadps,
  trackSpacingM: number = DEFAULT_ROBOT_CONFIG.trackSpacingM
): PurePursuitOutput {
  const wps = path.waypoints;
  if (wps.length === 0) {
    return {
      vLeftMps: 0,
      vRightMps: 0,
      linearMps: 0,
      angularRadps: 0,
      lookaheadPoint: { xM: pose.xM, zM: pose.zM },
      distanceToGoalM: 0,
      crossTrackErrorM: 0,
      isGoalReached: true,
    };
  }

  const finalGoal = wps[wps.length - 1];
  const distToGoal = Math.hypot(finalGoal.xM - pose.xM, finalGoal.zM - pose.zM);

  // Goal reached condition
  if (distToGoal <= goalToleranceM) {
    return {
      vLeftMps: 0,
      vRightMps: 0,
      linearMps: 0,
      angularRadps: 0,
      lookaheadPoint: finalGoal,
      distanceToGoalM: distToGoal,
      crossTrackErrorM: 0,
      isGoalReached: true,
    };
  }

  // Find lookahead point along remaining path
  const lookaheadDistM = 0.35;
  let targetPoint = finalGoal;

  // 1. Find closest waypoint index to determine progress along path
  let closestIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < wps.length; i++) {
    const d = Math.hypot(wps[i].xM - pose.xM, wps[i].zM - pose.zM);
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }

  // 2. Search strictly forward from closestIdx + 1 towards the goal
  const startSearchIdx = Math.min(closestIdx + 1, wps.length - 1);
  for (let i = startSearchIdx; i < wps.length; i++) {
    const d = Math.hypot(wps[i].xM - pose.xM, wps[i].zM - pose.zM);
    if (d >= lookaheadDistM || i === wps.length - 1) {
      targetPoint = wps[i];
      break;
    }
  }

  // Angle to lookahead point
  // Convention: +Z is North (yaw=0), +X is East (yaw=PI/2)
  const dx = targetPoint.xM - pose.xM;
  const dz = targetPoint.zM - pose.zM;
  const angleToTarget = Math.atan2(dx, dz);
  const alpha = normalizeAngle(angleToTarget - pose.yawRad);

  // Curvature: kappa = 2 * sin(alpha) / Ld
  const actualLd = Math.max(0.15, Math.hypot(dx, dz));
  const curvature = (2.0 * Math.sin(alpha)) / actualLd;

  // Decelerate smoothly near goal or when turning sharply
  let desiredLinear = maxLinearSpeedMps;
  if (distToGoal < 0.60) {
    desiredLinear = Math.max(0.08, maxLinearSpeedMps * (distToGoal / 0.60));
  }
  // Reduce linear speed on large heading discrepancies
  const turnFactor = Math.cos(alpha);
  if (turnFactor < 0) {
    // Target is behind, pivot in place
    desiredLinear = 0.05;
  } else {
    desiredLinear *= Math.max(0.3, turnFactor);
  }

  // Heading angular rate: omega (positive = clockwise/right)
  let desiredOmega = desiredLinear * curvature;
  desiredOmega = Math.max(-maxAngularSpeedRadps, Math.min(maxAngularSpeedRadps, desiredOmega));

  // Differential drive track speeds
  // yawRate = (vLeft - vRight) / b  ==>  vLeft = v + (omega * b) / 2, vRight = v - (omega * b) / 2
  let vLeft = desiredLinear + (desiredOmega * trackSpacingM) / 2;
  let vRight = desiredLinear - (desiredOmega * trackSpacingM) / 2;

  // Clamp to individual motor speed limits
  const maxV = Math.max(Math.abs(vLeft), Math.abs(vRight));
  if (maxV > maxLinearSpeedMps) {
    const scale = maxLinearSpeedMps / maxV;
    vLeft *= scale;
    vRight *= scale;
  }

  // Cross-track error to active line segment
  const cte = Math.abs(dx * Math.cos(pose.yawRad) - dz * Math.sin(pose.yawRad));

  return {
    vLeftMps: parseFloat(vLeft.toFixed(3)),
    vRightMps: parseFloat(vRight.toFixed(3)),
    linearMps: parseFloat(((vLeft + vRight) / 2).toFixed(3)),
    angularRadps: parseFloat(((vLeft - vRight) / trackSpacingM).toFixed(3)),
    lookaheadPoint: targetPoint,
    distanceToGoalM: parseFloat(distToGoal.toFixed(3)),
    crossTrackErrorM: parseFloat(cte.toFixed(3)),
    isGoalReached: false,
  };
}

/**
 * Checks if the currently planned path is obstructed by a newly moved or dynamic obstacle
 */
export function isPathObstructed(
  path: NavPath,
  map: WorldMap,
  simTimeS: number = 0,
  robotRadiusM: number = 0.20
): boolean {
  if (!path || path.waypoints.length < 2) return false;
  for (let i = 0; i < path.waypoints.length - 1; i++) {
    const p1 = path.waypoints[i];
    const p2 = path.waypoints[i + 1];
    if (!hasLineOfSight(p1, p2, map, robotRadiusM, simTimeS)) {
      return true;
    }
  }
  return false;
}
