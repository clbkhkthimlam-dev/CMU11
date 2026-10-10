import { DEFAULT_ROBOT_CONFIG, RobotPose, RobotKinematics, SensorData } from '../types/robot';
import { BUILT_IN_MAPS } from '../data/mapsData';
import { WorldMap, MapObstacle } from '../types/map';
import { stepPhysics, checkCollision, castRay, normalizeAngle } from './physicsEngine';
import {
  planPathAStar,
  computePurePursuit,
  isGoalValid,
  isPathObstructed,
  validateSensorsHealth,
} from './autonomousNavigation';
import { createOccupancyGrid, updateOccupancyGridWithLidar } from './localization';

export interface PhysicsTickBenchmarkResult {
  numTicks: number;
  totalTimeMs: number;
  avgTickMs: number;
  p95TickMs: number;
  maxTickMs: number;
  budgetOverrunCount: number;
  budgetOverrunPct: number;
  passedBudget: boolean; // avgTickMs < 5.0ms and budgetOverrunPct === 0
}

export interface PlannerBenchmarkResult {
  openMapMs: number;
  denseMapMs: number;
  mazeMapMs: number;
  avgPlanningMs: number;
  allSucceeded: boolean;
}

export interface SensorOccupancyBenchmarkResult {
  iterations: number;
  avgLidarScanMs: number;
  avgOccupancyUpdateMs: number;
  totalPerCycleMs: number;
}

export interface EnduranceStressResult {
  numTicks: number;
  simulatedMinutes: number;
  executionWallTimeMs: number;
  heapBeforeMB: number;
  heapAfterMB: number;
  heapDeltaMB: number;
  hasNaNOrInf: boolean;
  finalPose: RobotPose;
  success: boolean;
}

export interface MissionCycleStressResult {
  totalCycles: number;
  successfulCycles: number;
  failedCycles: number;
  allClean: boolean;
}

/**
 * 1. Benchmark Physics Tick 50Hz Execution Time vs 20ms budget
 */
export function benchmarkPhysicsTicks(numTicks: number = 2000): PhysicsTickBenchmarkResult {
  const map = BUILT_IN_MAPS[0];
  const config = { ...DEFAULT_ROBOT_CONFIG };
  let pose: RobotPose = { ...map.spawn, yM: 0 };
  let kinematics: RobotKinematics = {
    vLeftMps: 0.35,
    vRightMps: 0.35,
    linearSpeedMps: 0.35,
    angularSpeedRadps: 0,
    leftTrack: { speedMps: 0.35, travelDistanceM: 0, phase: 0, wheelAngleRad: 0 },
    rightTrack: { speedMps: 0.35, travelDistanceM: 0, phase: 0, wheelAngleRad: 0 },
  };

  const tickTimes: number[] = new Array(numTicks);
  const startAll = performance.now();

  for (let i = 0; i < numTicks; i++) {
    const t0 = performance.now();
    const result = stepPhysics(
      pose,
      kinematics,
      0.35,
      0.35,
      config,
      map,
      false,
      0,
      0,
      i * config.physicsDtS
    );
    const t1 = performance.now();
    tickTimes[i] = t1 - t0;
    pose = result.newPose;
    kinematics = result.newKinematics;
  }

  const totalTimeMs = performance.now() - startAll;
  tickTimes.sort((a, b) => a - b);

  const avgTickMs = tickTimes.reduce((acc, v) => acc + v, 0) / numTicks;
  const p95Idx = Math.floor(numTicks * 0.95);
  const p95TickMs = tickTimes[p95Idx];
  const maxTickMs = tickTimes[numTicks - 1];

  const budgetOverrunCount = tickTimes.filter(t => t > 20.0).length;
  const budgetOverrunPct = (budgetOverrunCount / numTicks) * 100;

  return {
    numTicks,
    totalTimeMs: parseFloat(totalTimeMs.toFixed(2)),
    avgTickMs: parseFloat(avgTickMs.toFixed(4)),
    p95TickMs: parseFloat(p95TickMs.toFixed(4)),
    maxTickMs: parseFloat(maxTickMs.toFixed(4)),
    budgetOverrunCount,
    budgetOverrunPct: parseFloat(budgetOverrunPct.toFixed(2)),
    passedBudget: avgTickMs < 5.0 && budgetOverrunPct === 0,
  };
}

/**
 * 2. Benchmark A* Path Planning Latency across Diverse Map Topologies
 */
export function benchmarkPathPlanning(): PlannerBenchmarkResult {
  // Test 1: Open space on stem_lab
  const mapOpen = BUILT_IN_MAPS[0];
  const t0 = performance.now();
  const pathOpen = planPathAStar({ xM: 0, zM: -2 }, { xM: 0, zM: 1 }, mapOpen, 0);
  const openMapMs = performance.now() - t0;

  // Test 2: Dense obstacle map on obstacle_challenge (index 2)
  const mapDense = BUILT_IN_MAPS[2];
  const t1 = performance.now();
  const pathDense = planPathAStar({ xM: -2.5, zM: -2.5 }, { xM: 2.5, zM: 2.5 }, mapDense, 0);
  const denseMapMs = performance.now() - t1;

  // Test 3: Narrow corridor in maze_apriltag (index 3)
  const mapMaze = BUILT_IN_MAPS[3];
  const t2 = performance.now();
  const pathMaze = planPathAStar({ xM: 0, zM: -2.2 }, { xM: 0, zM: 2.2 }, mapMaze, 0);
  const mazeMapMs = performance.now() - t2;

  const avgPlanningMs = (openMapMs + denseMapMs + mazeMapMs) / 3;
  const allSucceeded = pathOpen !== null && pathDense !== null && pathMaze !== null;

  return {
    openMapMs: parseFloat(openMapMs.toFixed(2)),
    denseMapMs: parseFloat(denseMapMs.toFixed(2)),
    mazeMapMs: parseFloat(mazeMapMs.toFixed(2)),
    avgPlanningMs: parseFloat(avgPlanningMs.toFixed(2)),
    allSucceeded,
  };
}

/**
 * 3. Benchmark LiDAR Raycasting & 2D Occupancy Grid Updates
 */
export function benchmarkSensorsAndOccupancy(iterations: number = 200): SensorOccupancyBenchmarkResult {
  const map = BUILT_IN_MAPS[0];
  const grid = createOccupancyGrid(map.bounds, 0.12);
  const pose: RobotPose = { xM: 0, yM: 0, zM: 0, yawRad: 0 };
  const numBeams = 72;

  let totalLidarMs = 0;
  let totalGridMs = 0;

  for (let iter = 0; iter < iterations; iter++) {
    // 1. LiDAR raycasting
    const t0 = performance.now();
    const beams = [];
    for (let i = 0; i < numBeams; i++) {
      const angle = (i * 2 * Math.PI) / numBeams;
      const hit = castRay([pose.xM, pose.zM], angle, 8.0, map, 0);
      beams.push({ angleRad: angle, distanceM: hit.distanceM });
    }
    const t1 = performance.now();
    totalLidarMs += t1 - t0;

    // 2. Occupancy grid log-odds update
    const t2 = performance.now();
    updateOccupancyGridWithLidar(grid, pose, beams);
    const t3 = performance.now();
    totalGridMs += t3 - t2;
  }

  const avgLidarScanMs = totalLidarMs / iterations;
  const avgOccupancyUpdateMs = totalGridMs / iterations;

  return {
    iterations,
    avgLidarScanMs: parseFloat(avgLidarScanMs.toFixed(4)),
    avgOccupancyUpdateMs: parseFloat(avgOccupancyUpdateMs.toFixed(4)),
    totalPerCycleMs: parseFloat((avgLidarScanMs + avgOccupancyUpdateMs).toFixed(4)),
  };
}

/**
 * 4. Endurance Stress: 90,000 Continuous Physics Ticks (Equivalent to 30 minutes at 50Hz)
 */
export function runEndurancePhysicsStress(numTicks: number = 90000): EnduranceStressResult {
  const map = BUILT_IN_MAPS[0];
  const config = { ...DEFAULT_ROBOT_CONFIG };
  let pose: RobotPose = { ...map.spawn, yM: 0 };
  let kinematics: RobotKinematics = {
    vLeftMps: 0.20,
    vRightMps: 0.25, // Turning in wide arc
    linearSpeedMps: 0.225,
    angularSpeedRadps: 0.25,
    leftTrack: { speedMps: 0.20, travelDistanceM: 0, phase: 0, wheelAngleRad: 0 },
    rightTrack: { speedMps: 0.25, travelDistanceM: 0, phase: 0, wheelAngleRad: 0 },
  };

  const getHeapMB = () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / (1024 * 1024);
    }
    return 0;
  };

  const heapBeforeMB = getHeapMB();
  const startMs = performance.now();

  let hasNaNOrInf = false;

  for (let i = 0; i < numTicks; i++) {
    const simTimeS = i * config.physicsDtS;
    // Vary motor speeds every 1000 ticks to exercise acceleration & turning dynamics
    const vL = 0.20 + 0.10 * Math.sin(simTimeS * 0.5);
    const vR = 0.25 + 0.10 * Math.cos(simTimeS * 0.5);

    const step = stepPhysics(pose, kinematics, vL, vR, config, map, false, 0, 0, simTimeS);
    pose = step.newPose;
    kinematics = step.newKinematics;

    // Numerical sanity check every 10,000 ticks
    if (i % 10000 === 0) {
      if (
        isNaN(pose.xM) || !isFinite(pose.xM) ||
        isNaN(pose.zM) || !isFinite(pose.zM) ||
        isNaN(pose.yawRad) || !isFinite(pose.yawRad) ||
        isNaN(kinematics.leftTrack.phase) || kinematics.leftTrack.phase < 0 || kinematics.leftTrack.phase > 1
      ) {
        hasNaNOrInf = true;
        break;
      }
    }
  }

  const executionWallTimeMs = performance.now() - startMs;
  const heapAfterMB = getHeapMB();
  const heapDeltaMB = heapAfterMB - heapBeforeMB;

  const success = !hasNaNOrInf && isFinite(pose.xM) && isFinite(pose.zM);

  return {
    numTicks,
    simulatedMinutes: (numTicks * config.physicsDtS) / 60,
    executionWallTimeMs: parseFloat(executionWallTimeMs.toFixed(2)),
    heapBeforeMB: parseFloat(heapBeforeMB.toFixed(2)),
    heapAfterMB: parseFloat(heapAfterMB.toFixed(2)),
    heapDeltaMB: parseFloat(heapDeltaMB.toFixed(2)),
    hasNaNOrInf,
    finalPose: pose,
    success,
  };
}

/**
 * 5. Stress Test: 100 Sequential Mission Cycles (Start -> Step -> Pause -> Resume -> Stop)
 */
export function runMissionCycleStress(totalCycles: number = 100): MissionCycleStressResult {
  const map = BUILT_IN_MAPS[0];
  const config = { ...DEFAULT_ROBOT_CONFIG };
  let successfulCycles = 0;

  for (let c = 0; c < totalCycles; c++) {
    // 1. Start from spawn
    let pose: RobotPose = { ...map.spawn, yM: 0 };
    let kin: RobotKinematics = {
      vLeftMps: 0,
      vRightMps: 0,
      linearSpeedMps: 0,
      angularSpeedRadps: 0,
      leftTrack: { speedMps: 0, travelDistanceM: 0, phase: 0, wheelAngleRad: 0 },
      rightTrack: { speedMps: 0, travelDistanceM: 0, phase: 0, wheelAngleRad: 0 },
    };

    // 2. Goal validation
    const goal = { xM: 0.0, zM: 1.0 };
    const val = isGoalValid(goal, map, 0.20, 0);
    if (!val.isValid) continue;

    // 3. Plan path
    const path = planPathAStar({ xM: pose.xM, zM: pose.zM }, goal, map, 0);
    if (!path) continue;

    // 4. Run 10 steps of tracking
    let trackingOk = true;
    for (let s = 0; s < 10; s++) {
      const pp = computePurePursuit(pose, path, 0.10);
      const step = stepPhysics(pose, kin, pp.vLeftMps, pp.vRightMps, config, map, false);
      pose = step.newPose;
      kin = step.newKinematics;
    }

    // 5. Pause for 5 simulated ticks (no motion)
    const pauseX = pose.xM;
    const pauseZ = pose.zM;
    for (let p = 0; p < 5; p++) {
      // In pause, velocities are 0
      const step = stepPhysics(pose, kin, 0, 0, config, map, false);
      pose = step.newPose;
    }
    if (Math.hypot(pose.xM - pauseX, pose.zM - pauseZ) > 1e-6) {
      trackingOk = false;
    }

    // 6. Stop and reset
    kin.vLeftMps = 0;
    kin.vRightMps = 0;
    kin.linearSpeedMps = 0;

    if (trackingOk) {
      successfulCycles++;
    }
  }

  return {
    totalCycles,
    successfulCycles,
    failedCycles: totalCycles - successfulCycles,
    allClean: successfulCycles === totalCycles,
  };
}

/**
 * 6. Dynamic Obstacle CRUD Stress during Active Navigation
 */
export function benchmarkDynamicObstacleCRUD(): {
  initialObstacleCount: number;
  finalObstacleCount: number;
  allOperationsSucceeded: boolean;
  effectiveCountCorrect: boolean;
} {
  let map: WorldMap = JSON.parse(JSON.stringify(BUILT_IN_MAPS[0]));
  const initialCount = map.obstacles.length;

  // Add 5 obstacles
  for (let i = 0; i < 5; i++) {
    const newObs: MapObstacle = {
      id: `dyn_bench_${i}`,
      type: 'box',
      xM: -1.0 + i * 0.5,
      zM: 1.5,
      widthM: 0.3,
      depthM: 0.3,
      heightM: 0.4,
      color: '#475569',
    };
    map.obstacles.push(newObs);
  }

  // Move 2 obstacles
  map.obstacles[0].xM += 0.2;
  map.obstacles[1].zM -= 0.2;

  // Delete 2 obstacles
  const toDeleteId = map.obstacles[map.obstacles.length - 1].id;
  const toDeleteId2 = map.obstacles[map.obstacles.length - 2].id;
  map.obstacles = map.obstacles.filter(o => o.id !== toDeleteId && o.id !== toDeleteId2);

  const finalCount = map.obstacles.length;
  // Started with initialCount, added 5, deleted 2 => expected initialCount + 3
  const expectedCount = initialCount + 3;

  // Collision detection test on newly placed obstacle dyn_bench_0 at (-1.0, 1.5)
  const hitsNewObs = checkCollision(-1.0, 1.5, 0.20, map, 0);

  return {
    initialObstacleCount: initialCount,
    finalObstacleCount: finalCount,
    allOperationsSucceeded: finalCount === expectedCount,
    effectiveCountCorrect: hitsNewObs,
  };
}
