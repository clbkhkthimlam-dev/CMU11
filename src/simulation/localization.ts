import { RobotPose, LidarBeam, DEFAULT_ROBOT_CONFIG } from '../types/robot';
import { MapBounds, WorldMap } from '../types/map';
import { normalizeAngle } from './physicsEngine';

/**
 * Odometry dead-reckoning state tracker
 */
export interface OdometryState {
  xM: number;
  zM: number;
  yawRad: number;
  linearSpeedMps: number;
  angularSpeedRadps: number;
  totalDistanceM: number;
  driftErrorM: number;
  headingErrorRad: number;
}

/**
 * IMU simulated data with sensor noise configuration
 */
export interface IMUSimulationData {
  yawRad: number;
  yawRateRadps: number;
  linearAccelMps2: number;
  accelXMps2: number;
  accelZMps2: number;
  gyroBiasRadps: number;
}

/**
 * Sensor Noise Configuration
 */
export interface SensorNoiseConfig {
  enabled: boolean;
  odometrySlipFactor: number;   // e.g. 0.985 (1.5% wheel slip)
  odometryNoiseStdDevM: number; // e.g. 0.002 m per step
  imuGyroNoiseStdDevRadps: number; // e.g. 0.005 rad/s
  lidarRangeNoiseStdDevM: number;  // e.g. 0.010 m
}

export const DEFAULT_SENSOR_NOISE: SensorNoiseConfig = {
  enabled: false, // Default is deterministic for reliable test reproducibility
  odometrySlipFactor: 0.985,
  odometryNoiseStdDevM: 0.002,
  imuGyroNoiseStdDevRadps: 0.005,
  lidarRangeNoiseStdDevM: 0.010,
};

/**
 * Simple pseudo-random Gaussian generator (Box-Muller)
 */
export function pseudoGaussianNoise(stdDev: number, seed: number = 0): number {
  if (stdDev <= 0) return 0;
  // Deterministic or pseudo-random
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev;
}

/**
 * Integrates wheel odometry from differential drive speeds
 * World frame: +Z is North (yaw=0), +X is East (yaw=PI/2), clockwise yaw is positive
 */
export function updateOdometry(
  currentOdo: OdometryState,
  vLeftMps: number,
  vRightMps: number,
  dt: number,
  trackSpacingM: number = DEFAULT_ROBOT_CONFIG.trackSpacingM,
  groundTruthPose?: RobotPose,
  noiseConfig: SensorNoiseConfig = DEFAULT_SENSOR_NOISE
): OdometryState {
  let effectiveLeft = vLeftMps;
  let effectiveRight = vRightMps;

  if (noiseConfig.enabled) {
    effectiveLeft *= noiseConfig.odometrySlipFactor;
    effectiveRight *= noiseConfig.odometrySlipFactor;
  }

  const vLinear = (effectiveRight + effectiveLeft) / 2;
  const yawRate = (effectiveLeft - effectiveRight) / trackSpacingM;
  const angularSpeed = (effectiveRight - effectiveLeft) / trackSpacingM;

  const halfYaw = currentOdo.yawRad + (yawRate * dt) / 2;
  const newYaw = normalizeAngle(currentOdo.yawRad + yawRate * dt);

  const deltaDist = vLinear * dt;
  const deltaX = deltaDist * Math.sin(halfYaw);
  const deltaZ = deltaDist * Math.cos(halfYaw);

  const newX = currentOdo.xM + deltaX;
  const newZ = currentOdo.zM + deltaZ;
  const newTotalDist = currentOdo.totalDistanceM + Math.abs(deltaDist);

  let driftErrorM = 0;
  let headingErrorRad = 0;

  if (groundTruthPose) {
    const dx = newX - groundTruthPose.xM;
    const dz = newZ - groundTruthPose.zM;
    driftErrorM = Math.hypot(dx, dz);
    headingErrorRad = Math.abs(normalizeAngle(newYaw - groundTruthPose.yawRad));
  }

  return {
    xM: newX,
    zM: newZ,
    yawRad: newYaw,
    linearSpeedMps: vLinear,
    angularSpeedRadps: angularSpeed,
    totalDistanceM: newTotalDist,
    driftErrorM: parseFloat(driftErrorM.toFixed(4)),
    headingErrorRad: parseFloat(headingErrorRad.toFixed(4)),
  };
}

/**
 * 2D Occupancy Grid Map representing free/occupied space from LiDAR observations
 */
export interface OccupancyGrid {
  bounds: MapBounds;
  resolutionM: number;
  cols: number;
  rows: number;
  logOdds: Float32Array;       // Log-odds values (-inf to +inf, clamped to [-4, +4])
  probabilities: Float32Array; // Probability [0.0, 1.0]
  originX: number;
  originZ: number;
}

/**
 * Creates an empty Occupancy Grid with prior probability P=0.5 (logOdds = 0.0)
 */
export function createOccupancyGrid(
  bounds: MapBounds,
  resolutionM: number = 0.10
): OccupancyGrid {
  const widthM = bounds.maxX - bounds.minX;
  const heightM = bounds.maxZ - bounds.minZ;
  const cols = Math.ceil(widthM / resolutionM);
  const rows = Math.ceil(heightM / resolutionM);
  const totalCells = cols * rows;

  const logOdds = new Float32Array(totalCells); // all zeros = 0.5 prob
  const probabilities = new Float32Array(totalCells);
  probabilities.fill(0.5);

  return {
    bounds: { ...bounds },
    resolutionM,
    cols,
    rows,
    logOdds,
    probabilities,
    originX: bounds.minX,
    originZ: bounds.minZ,
  };
}

/**
 * World coordinate to Grid cell (col, row)
 */
export function worldToGrid(
  grid: OccupancyGrid,
  xM: number,
  zM: number
): [number, number] | null {
  const col = Math.floor((xM - grid.originX) / grid.resolutionM);
  const row = Math.floor((zM - grid.originZ) / grid.resolutionM);
  if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) {
    return null;
  }
  return [col, row];
}

/**
 * Grid cell (col, row) to World coordinate (center of cell)
 */
export function gridToWorld(
  grid: OccupancyGrid,
  col: number,
  row: number
): [number, number] {
  const xM = grid.originX + (col + 0.5) * grid.resolutionM;
  const zM = grid.originZ + (row + 0.5) * grid.resolutionM;
  return [xM, zM];
}

/**
 * Updates 2D Occupancy Grid using Inverse Sensor Model (Log-odds update)
 * - Traversed cells along ray: L += l_free (-0.35)
 * - Endpoint hit cell: L += l_occ (+0.80)
 */
export function updateOccupancyGridWithLidar(
  grid: OccupancyGrid,
  robotPose: RobotPose,
  lidarScan: LidarBeam[],
  maxRangeM: number = 8.0
): void {
  const lFree = -0.35;
  const lOcc = 0.80;
  const clampMin = -4.0;
  const clampMax = 4.0;

  const startCoord = worldToGrid(grid, robotPose.xM, robotPose.zM);
  if (!startCoord) return;
  const [startCol, startRow] = startCoord;

  for (const beam of lidarScan) {
    const beamAngleWorld = normalizeAngle(robotPose.yawRad + beam.angleRad);
    const measuredDist = Math.min(beam.distanceM, maxRangeM);
    const hitXM = robotPose.xM + measuredDist * Math.sin(beamAngleWorld);
    const hitZM = robotPose.zM + measuredDist * Math.cos(beamAngleWorld);

    const hitCoord = worldToGrid(grid, hitXM, hitZM);

    // Raycast Bresenham algorithm on grid
    const targetCol = hitCoord ? hitCoord[0] : Math.floor((hitXM - grid.originX) / grid.resolutionM);
    const targetRow = hitCoord ? hitCoord[1] : Math.floor((hitZM - grid.originZ) / grid.resolutionM);

    const dCol = Math.abs(targetCol - startCol);
    const dRow = Math.abs(targetRow - startRow);
    const sCol = startCol < targetCol ? 1 : -1;
    const sRow = startRow < targetRow ? 1 : -1;
    let err = dCol - dRow;

    let currCol = startCol;
    let currRow = startRow;

    const maxRaySteps = Math.max(dCol, dRow) + 1;
    for (let step = 0; step < maxRaySteps; step++) {
      const isEndpoint = currCol === targetCol && currRow === targetRow;

      if (currCol >= 0 && currCol < grid.cols && currRow >= 0 && currRow < grid.rows) {
        const idx = currRow * grid.cols + currCol;

        if (isEndpoint && beam.distanceM < maxRangeM - 0.05) {
          // Obstacle hit
          grid.logOdds[idx] = Math.max(clampMin, Math.min(clampMax, grid.logOdds[idx] + lOcc));
        } else if (!isEndpoint) {
          // Free space traversal
          grid.logOdds[idx] = Math.max(clampMin, Math.min(clampMax, grid.logOdds[idx] + lFree));
        }

        // Convert log-odds to probability: P = 1 / (1 + exp(-L))
        grid.probabilities[idx] = 1.0 / (1.0 + Math.exp(-grid.logOdds[idx]));
      }

      if (isEndpoint) break;

      const e2 = 2 * err;
      if (e2 > -dRow) {
        err -= dRow;
        currCol += sCol;
      }
      if (e2 < dCol) {
        err += dCol;
        currRow += sRow;
      }
    }
  }
}
