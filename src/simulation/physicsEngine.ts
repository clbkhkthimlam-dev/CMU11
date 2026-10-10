import { RobotConfig, RobotPose, RobotKinematics, SensorData, SafetyState, DetectedAprilTag, LidarBeam } from '../types/robot';
import { WorldMap, MapObstacle, MapMarker } from '../types/map';

export function normalizeAngle(angleRad: number): number {
  let a = angleRad;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

export interface RayIntersection {
  distanceM: number;
  hitPoint: [number, number];
  obstacleId?: string;
}

/**
 * Returns obstacles with updated positions for dynamic moving obstacles
 */
export function getEffectiveObstacles(map: WorldMap, simTimeS: number = 0): MapObstacle[] {
  return map.obstacles.map(obs => {
    if (obs.isDynamic && obs.patrol && obs.enabled !== false) {
      const { p1, p2, speedMps } = obs.patrol;
      const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
      const period = (dist * 2) / (speedMps || 0.2);
      const phase = (simTimeS % period) / period;
      const factor = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
      const currX = p1[0] + (p2[0] - p1[0]) * factor;
      const currZ = p1[1] + (p2[1] - p1[1]) * factor;
      return {
        ...obs,
        xM: currX,
        zM: currZ,
      };
    }
    return obs;
  });
}

/**
 * Checks ray intersection with a line segment
 */
function raySegmentIntersection(
  rayOrigin: [number, number],
  rayDir: [number, number],
  p1: [number, number],
  p2: [number, number]
): number | null {
  const [ox, oz] = rayOrigin;
  const [dx, dz] = rayDir;
  const [x1, z1] = p1;
  const [x2, z2] = p2;

  const sx = x2 - x1;
  const sz = z2 - z1;

  const denom = dx * sz - dz * sx;
  if (Math.abs(denom) < 1e-6) return null; // Parallel

  const t = ((x1 - ox) * sz - (z1 - oz) * sx) / denom;
  const u = ((x1 - ox) * dz - (z1 - oz) * dx) / denom;

  if (t > 0 && u >= 0 && u <= 1) {
    return t;
  }
  return null;
}

/**
 * Ray intersection with a circle
 */
function rayCircleIntersection(
  origin: [number, number],
  dir: [number, number],
  center: [number, number],
  radius: number
): number | null {
  const [ox, oz] = origin;
  const [dx, dz] = dir;
  const [cx, cz] = center;

  const fx = ox - cx;
  const fz = oz - cz;

  const a = dx * dx + dz * dz;
  const b = 2 * (fx * dx + fz * dz);
  const c = fx * fx + fz * fz - radius * radius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  if (t1 > 0) return t1;
  if (t2 > 0) return t2;
  return null;
}

/**
 * Cast a ray from origin in dir angle up to maxDistanceM against all active obstacles in world
 */
export function castRay(
  origin: [number, number],
  angleRad: number,
  maxDistanceM: number,
  map: WorldMap,
  simTimeS: number = 0
): RayIntersection {
  const dir: [number, number] = [Math.sin(angleRad), Math.cos(angleRad)];
  let closestDist = maxDistanceM;
  let hitObstacleId: string | undefined = undefined;

  // Boundary walls
  const bounds = map.bounds;
  const boundSegments: Array<[[number, number], [number, number]]> = [
    [[bounds.minX, bounds.minZ], [bounds.maxX, bounds.minZ]], // South
    [[bounds.maxX, bounds.minZ], [bounds.maxX, bounds.maxZ]], // East
    [[bounds.maxX, bounds.maxZ], [bounds.minX, bounds.maxZ]], // North
    [[bounds.minX, bounds.maxZ], [bounds.minX, bounds.minZ]], // West
  ];

  for (const seg of boundSegments) {
    const dist = raySegmentIntersection(origin, dir, seg[0], seg[1]);
    if (dist !== null && dist < closestDist) {
      closestDist = dist;
      hitObstacleId = 'boundary';
    }
  }

  // Effective active obstacles
  const obstacles = getEffectiveObstacles(map, simTimeS);

  for (const obs of obstacles) {
    // If disabled or door is open, ignore
    if (obs.enabled === false) continue;
    if (obs.type === 'door' && obs.isOpen) continue;

    if (obs.type === 'circle') {
      const r = obs.radiusM || obs.widthM / 2;
      const dist = rayCircleIntersection(origin, dir, [obs.xM, obs.zM], r);
      if (dist !== null && dist < closestDist) {
        closestDist = dist;
        hitObstacleId = obs.id;
      }
    } else {
      // Box / wall / closed door
      const halfW = obs.widthM / 2;
      const halfD = obs.depthM / 2;
      const corners: Array<[number, number]> = [
        [obs.xM - halfW, obs.zM - halfD],
        [obs.xM + halfW, obs.zM - halfD],
        [obs.xM + halfW, obs.zM + halfD],
        [obs.xM - halfW, obs.zM + halfD],
      ];

      const edges: Array<[[number, number], [number, number]]> = [
        [corners[0], corners[1]],
        [corners[1], corners[2]],
        [corners[2], corners[3]],
        [corners[3], corners[0]],
      ];

      for (const edge of edges) {
        const dist = raySegmentIntersection(origin, dir, edge[0], edge[1]);
        if (dist !== null && dist < closestDist) {
          closestDist = dist;
          hitObstacleId = obs.id;
        }
      }
    }
  }

  return {
    distanceM: closestDist,
    hitPoint: [origin[0] + dir[0] * closestDist, origin[1] + dir[1] * closestDist],
    obstacleId: hitObstacleId,
  };
}

/**
 * Check if a circle at (x, z) with radius r overlaps any active obstacle or boundary
 */
export function checkCollision(
  x: number,
  z: number,
  radiusM: number,
  map: WorldMap,
  simTimeS: number = 0
): boolean {
  const b = map.bounds;
  // Boundary check
  if (x - radiusM < b.minX || x + radiusM > b.maxX || z - radiusM < b.minZ || z + radiusM > b.maxZ) {
    return true;
  }

  const obstacles = getEffectiveObstacles(map, simTimeS);

  for (const obs of obstacles) {
    if (obs.enabled === false) continue;
    if (obs.type === 'door' && obs.isOpen) continue;

    if (obs.type === 'circle') {
      const r = (obs.radiusM || obs.widthM / 2) + radiusM;
      const dx = x - obs.xM;
      const dz = z - obs.zM;
      if (dx * dx + dz * dz < r * r) {
        return true;
      }
    } else {
      const halfW = obs.widthM / 2;
      const halfD = obs.depthM / 2;
      const closestX = Math.max(obs.xM - halfW, Math.min(x, obs.xM + halfW));
      const closestZ = Math.max(obs.zM - halfD, Math.min(z, obs.zM + halfD));
      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < radiusM * radiusM) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates perpendicular cross-track error to map's centerline
 */
export function calculateCrossTrackError(
  pose: RobotPose,
  lanePoints: Array<{ xM: number; zM: number }>
): { crossTrackErrorM: number; closestSegmentIndex: number } {
  if (!lanePoints || lanePoints.length < 2) {
    return { crossTrackErrorM: 0, closestSegmentIndex: 0 };
  }

  let minDistanceSq = Infinity;
  let signedError = 0;
  let bestIndex = 0;

  for (let i = 0; i < lanePoints.length - 1; i++) {
    const p1 = lanePoints[i];
    const p2 = lanePoints[i + 1];

    const vx = p2.xM - p1.xM;
    const vz = p2.zM - p1.zM;
    const lenSq = vx * vx + vz * vz;
    if (lenSq < 1e-6) continue;

    const wx = pose.xM - p1.xM;
    const wz = pose.zM - p1.zM;

    const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq));
    const projX = p1.xM + t * vx;
    const projZ = p1.zM + t * vz;

    const dx = pose.xM - projX;
    const dz = pose.zM - projZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      bestIndex = i;
      const cross = vx * (pose.zM - p1.zM) - vz * (pose.xM - p1.xM);
      const sign = cross >= 0 ? 1 : -1;
      signedError = sign * Math.sqrt(distSq);
    }
  }

  return { crossTrackErrorM: signedError, closestSegmentIndex: bestIndex };
}

/**
 * Computes simulated AprilTag perceptions in camera view
 */
export function computeAprilTagDetections(
  pose: RobotPose,
  markers: MapMarker[],
  servoPanRad: number = 0,
  servoTiltRad: number = 0,
  map?: WorldMap,
  simTimeS: number = 0
): DetectedAprilTag[] {
  const detections: DetectedAprilTag[] = [];
  const cameraFovH = (60 * Math.PI) / 180;
  const maxRangeM = 3.5;
  const camEffectiveYaw = normalizeAngle(pose.yawRad + servoPanRad);

  const camOrigin: [number, number] = [
    pose.xM + 0.145 * Math.sin(pose.yawRad),
    pose.zM + 0.145 * Math.cos(pose.yawRad),
  ];

  for (const m of markers) {
    const dx = m.xM - pose.xM;
    const dz = m.zM - pose.zM;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.1 || dist > maxRangeM) continue;

    const angleToMarker = Math.atan2(dx, dz);
    const relAngle = normalizeAngle(angleToMarker - camEffectiveYaw);

    if (Math.abs(relAngle) > cameraFovH / 2) continue;

    const markerNormalAngle = m.yawRad;
    const vectorMarkerToRobot = Math.atan2(pose.xM - m.xM, pose.zM - m.zM);
    const normalDiff = Math.abs(normalizeAngle(vectorMarkerToRobot - markerNormalAngle));
    if (normalDiff > (85 * Math.PI) / 180) continue;

    // Check line-of-sight occlusion if map geometry is provided
    if (map) {
      const dxCam = m.xM - camOrigin[0];
      const dzCam = m.zM - camOrigin[1];
      const distFromCam = Math.hypot(dxCam, dzCam);
      const angleFromCam = Math.atan2(dxCam, dzCam);
      const rayHit = castRay(camOrigin, angleFromCam, distFromCam, map, simTimeS);
      if (rayHit.distanceM < distFromCam - 0.06) {
        // Obstructed by obstacle between camera and marker
        continue;
      }
    }

    const lateralX = dist * Math.sin(relAngle);
    const longitudinalZ = dist * Math.cos(relAngle);
    const verticalY = 0.08 - servoTiltRad * dist;

    const fx = 620.0;
    const fy = 620.0;
    const cx = 320.0;
    const cy = 240.0;

    const screenX = cx + (lateralX / longitudinalZ) * fx;
    const screenY = cy - (verticalY / longitudinalZ) * fy;

    const tagSizePx = (m.sizeM / longitudinalZ) * fx;
    const half = tagSizePx / 2;

    const cornersPx: Array<[number, number]> = [
      [screenX - half, screenY - half],
      [screenX + half, screenY - half],
      [screenX + half, screenY + half],
      [screenX - half, screenY + half],
    ];

    detections.push({
      id: m.id,
      centerPx: [Math.round(screenX), Math.round(screenY)],
      distanceM: parseFloat(dist.toFixed(3)),
      xM: parseFloat(lateralX.toFixed(3)),
      yM: parseFloat(verticalY.toFixed(3)),
      zM: parseFloat(longitudinalZ.toFixed(3)),
      cornersPx,
      family: 'tag36h11',
    });
  }

  return detections;
}

/**
 * Executes a single physics simulation tick with midpoint integration
 */
export function stepPhysics(
  pose: RobotPose,
  kinematics: RobotKinematics,
  cmdLeftMps: number,
  cmdRightMps: number,
  config: RobotConfig,
  map: WorldMap,
  isEStop: boolean,
  servoPanRad: number = 0,
  servoTiltRad: number = 0,
  simTimeS: number = 0
): {
  newPose: RobotPose;
  newKinematics: RobotKinematics;
  sensors: SensorData;
  safety: SafetyState;
  appliedLeft: number;
  appliedRight: number;
} {
  const dt = config.physicsDtS;

  // 1. Safety Clamp & Input Sanitization & E-Stop
  let appliedLeft = isNaN(cmdLeftMps) || !isFinite(cmdLeftMps) ? 0 : cmdLeftMps;
  let appliedRight = isNaN(cmdRightMps) || !isFinite(cmdRightMps) ? 0 : cmdRightMps;

  const safePose: RobotPose = {
    xM: isNaN(pose.xM) || !isFinite(pose.xM) ? map.spawn.xM : pose.xM,
    yM: 0,
    zM: isNaN(pose.zM) || !isFinite(pose.zM) ? map.spawn.zM : pose.zM,
    yawRad: isNaN(pose.yawRad) || !isFinite(pose.yawRad) ? map.spawn.yawRad : pose.yawRad,
  };

  if (isEStop) {
    appliedLeft = 0;
    appliedRight = 0;
  } else {
    appliedLeft = Math.max(-config.maxLinearSpeedMps, Math.min(config.maxLinearSpeedMps, appliedLeft));
    appliedRight = Math.max(-config.maxLinearSpeedMps, Math.min(config.maxLinearSpeedMps, appliedRight));
  }

  // 2. Differential drive kinematics
  // Forward linear velocity: v = (v_R + v_L) / 2
  // Heading angle convention: yaw = 0 points towards +Z (North), yaw = +PI/2 points towards +X (East).
  // Clockwise rotation (yaw increases): occurs when Left track is faster than Right track (v_L > v_R).
  // Counter-clockwise rotation (yaw decreases): occurs when Right track is faster than Left track (v_R > v_L).
  // Heading angular rate: yawRate = (appliedLeft - appliedRight) / b
  // Standard angular velocity omega (CCW positive): omega = (appliedRight - appliedLeft) / b
  const v = (appliedRight + appliedLeft) / 2;
  const omega = (appliedRight - appliedLeft) / config.trackSpacingM;
  const yawRate = (appliedLeft - appliedRight) / config.trackSpacingM;

  const halfYaw = safePose.yawRad + (yawRate * dt) / 2;
  const yawNext = normalizeAngle(safePose.yawRad + yawRate * dt);

  const deltaX = v * Math.sin(halfYaw) * dt;
  const deltaZ = v * Math.cos(halfYaw) * dt;

  const candX = safePose.xM + deltaX;
  const candZ = safePose.zM + deltaZ;

  // 3. Collision Resolution with active obstacles & boundaries
  const robotRadius = Math.max(config.chassisLengthM, config.chassisWidthM) / 2;
  const isCandColliding = checkCollision(candX, candZ, robotRadius, map, simTimeS);
  const isCurrentColliding = checkCollision(safePose.xM, safePose.zM, robotRadius, map, simTimeS);

  let finalX = safePose.xM;
  let finalZ = safePose.zM;
  // Always permit yaw rotation so robot can steer away even when contacting obstacles
  let finalYaw = yawNext;
  let isCollisionHit = false;

  if (isCandColliding) {
    isCollisionHit = true;

    // Check sliding along X-axis
    const isSlideXColliding = checkCollision(candX, pose.zM, robotRadius, map, simTimeS);
    // Check sliding along Z-axis
    const isSlideZColliding = checkCollision(pose.xM, candZ, robotRadius, map, simTimeS);

    if (!isSlideXColliding && Math.abs(deltaX) > 1e-5) {
      finalX = candX;
      finalZ = pose.zM;
    } else if (!isSlideZColliding && Math.abs(deltaZ) > 1e-5) {
      finalX = pose.xM;
      finalZ = candZ;
    } else if (isCurrentColliding && !isCandColliding) {
      // Moving out of collision
      finalX = candX;
      finalZ = candZ;
    } else {
      // Block translation into collision
      finalX = pose.xM;
      finalZ = pose.zM;
      appliedLeft = 0;
      appliedRight = 0;
    }
  } else {
    finalX = candX;
    finalZ = candZ;
  }

  // Hard clamp within map boundaries
  finalX = Math.max(map.bounds.minX + robotRadius, Math.min(map.bounds.maxX - robotRadius, finalX));
  finalZ = Math.max(map.bounds.minZ + robotRadius, Math.min(map.bounds.maxZ - robotRadius, finalZ));

  const newPose: RobotPose = {
    xM: finalX,
    yM: 0,
    zM: finalZ,
    yawRad: finalYaw,
  };

  // 4. Update track animation and wheel states
  const leftTravel = kinematics.leftTrack.travelDistanceM + appliedLeft * dt;
  const rightTravel = kinematics.rightTrack.travelDistanceM + appliedRight * dt;
  const treadPitch = 0.05;

  const newKinematics: RobotKinematics = {
    vLeftMps: appliedLeft,
    vRightMps: appliedRight,
    linearSpeedMps: v,
    angularSpeedRadps: omega,
    leftTrack: {
      speedMps: appliedLeft,
      travelDistanceM: leftTravel,
      phase: ((leftTravel % treadPitch) + treadPitch) % treadPitch / treadPitch,
      wheelAngleRad: kinematics.leftTrack.wheelAngleRad + (appliedLeft / config.driveWheelRadiusM) * dt,
    },
    rightTrack: {
      speedMps: appliedRight,
      travelDistanceM: rightTravel,
      phase: ((rightTravel % treadPitch) + treadPitch) % treadPitch / treadPitch,
      wheelAngleRad: kinematics.rightTrack.wheelAngleRad + (appliedRight / config.driveWheelRadiusM) * dt,
    },
  };

  // 5. Sensors Update
  const frontSensorOrigin: [number, number] = [
    newPose.xM + 0.185 * Math.sin(newPose.yawRad),
    newPose.zM + 0.185 * Math.cos(newPose.yawRad),
  ];
  const frontRay = castRay(frontSensorOrigin, newPose.yawRad, 3.0, map, simTimeS);

  const lidarOrigin: [number, number] = [newPose.xM, newPose.zM];
  const lidarScan: LidarBeam[] = [];
  const numBeams = 72;
  for (let i = 0; i < numBeams; i++) {
    const beamAngleRel = (i * 2 * Math.PI) / numBeams;
    const beamAngleWorld = normalizeAngle(newPose.yawRad + beamAngleRel);
    const hit = castRay(lidarOrigin, beamAngleWorld, 8.0, map, simTimeS);
    lidarScan.push({
      angleRad: beamAngleRel,
      distanceM: parseFloat(hit.distanceM.toFixed(3)),
    });
  }

  const detectedTags = computeAprilTagDetections(newPose, map.markers, servoPanRad, servoTiltRad, map, simTimeS);

  const sensors: SensorData = {
    frontRangeM: parseFloat(frontRay.distanceM.toFixed(3)),
    lidarScan,
    imu: {
      yawRad: newPose.yawRad,
      yawRateRadps: omega,
      linearAccelMps2: 0,
    },
    cameraTimestampS: Date.now() / 1000,
    detectedTags,
  };

  // 6. Lane tracking and safety
  const { crossTrackErrorM } = calculateCrossTrackError(newPose, map.lanePoints);
  const isOutsideLane = Math.abs(crossTrackErrorM) > map.laneHalfWidthM;

  const safety: SafetyState = {
    isEmergencyStopped: isEStop,
    isCollision: isCollisionHit,
    isOutsideLane,
    crossTrackErrorM: parseFloat(crossTrackErrorM.toFixed(3)),
    reason: isCollisionHit ? 'Va chạm vật cản' : isEStop ? 'E-STOP khẩn cấp' : undefined,
  };

  return {
    newPose,
    newKinematics,
    sensors,
    safety,
    appliedLeft,
    appliedRight,
  };
}
