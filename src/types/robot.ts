export interface RobotConfig {
  chassisLengthM: number;       // 0.32 m
  chassisWidthM: number;        // 0.22 m
  chassisHeightM: number;       // 0.12 m
  trackLengthM: number;         // 0.40 m
  trackWidthM: number;          // 0.045 m
  trackSpacingM: number;        // 0.20 m (distance between center of tracks)
  driveWheelRadiusM: number;    // 0.035 m
  numRoadWheels: number;        // 4 each side
  maxLinearSpeedMps: number;    // 0.50 m/s
  maxAngularSpeedRadps: number; // 2.50 rad/s
  physicsDtS: number;           // 0.02 s (50 Hz)
}

export type RobotDiagnosticMode =
  | 'realistic'   // Hiển thị vật liệu & kết cấu hoàn chỉnh
  | 'wireframe'   // Khung dây cấu trúc đa giác 3D
  | 'components'  // Nổi bật từng cụm linh kiện theo phân cấp
  | 'collision'   // Vùng bao va chạm thực tế (Collision Hull)
  | 'axes'        // Trục tọa độ cục bộ (+X, +Y, +Z)
  | 'sensors'     // Nón quan sát quang học & tầm quét cảm biến
  | 'dimensions'; // Kích thước cơ khí & đường gióng định mức

export interface RobotGeometryConfig {
  bodyLengthM: number;       // 0.32 m
  bodyWidthM: number;        // 0.22 m
  bodyHeightM: number;       // 0.12 m
  trackLengthM: number;      // 0.40 m
  trackWidthM: number;       // 0.045 m
  trackSpacingM: number;     // 0.20 m
  groundClearanceM: number;  // 0.035 m
  driveWheelRadiusM: number; // 0.035 m
  numRoadWheels: number;     // 4 per side
  massKg: number;            // 2.2 kg
  sensorMounts: {
    frontRange: [number, number, number]; // [x, y, z] in local meters: [0.0, 0.075, +0.185]
    lidar: [number, number, number];      // [0.0, 0.105, 0.0]
    imu: [number, number, number];        // [0.0, 0.040, 0.0]
    camera: [number, number, number];     // [0.0, 0.095, +0.145]
  };
  cameraMount: {
    panLimitsRad: [number, number];       // [-1.20, 1.20]
    tiltLimitsRad: [number, number];      // [-0.35, 0.50]
    fovHorizDeg: number;                  // 60 deg
  };
  collisionGeometry: {
    type: 'box';
    halfX: number; // 0.11 m
    halfY: number; // 0.06 m
    halfZ: number; // 0.16 m
    boundingRadiusM: number; // ~0.194 m
  };
}

export const DEFAULT_ROBOT_GEOMETRY: RobotGeometryConfig = {
  bodyLengthM: 0.32,
  bodyWidthM: 0.22,
  bodyHeightM: 0.12,
  trackLengthM: 0.40,
  trackWidthM: 0.045,
  trackSpacingM: 0.20,
  groundClearanceM: 0.035,
  driveWheelRadiusM: 0.035,
  numRoadWheels: 4,
  massKg: 2.2,
  sensorMounts: {
    frontRange: [0.0, 0.075, 0.185],
    lidar: [0.0, 0.105, 0.0],
    imu: [0.0, 0.040, 0.0],
    camera: [0.0, 0.095, 0.145],
  },
  cameraMount: {
    panLimitsRad: [-1.20, 1.20],
    tiltLimitsRad: [-0.35, 0.50],
    fovHorizDeg: 60,
  },
  collisionGeometry: {
    type: 'box',
    halfX: 0.11,
    halfY: 0.06,
    halfZ: 0.16,
    boundingRadiusM: 0.194,
  },
};

export const DEFAULT_ROBOT_CONFIG: RobotConfig = {
  chassisLengthM: 0.32,
  chassisWidthM: 0.22,
  chassisHeightM: 0.12,
  trackLengthM: 0.40,
  trackWidthM: 0.045,
  trackSpacingM: 0.20,
  driveWheelRadiusM: 0.035,
  numRoadWheels: 4,
  maxLinearSpeedMps: 0.50,
  maxAngularSpeedRadps: 2.50,
  physicsDtS: 0.02,
};

export interface RobotPose {
  xM: number;       // World X in meters (positive right)
  yM: number;       // World Y in meters (height above ground = 0)
  zM: number;       // World Z in meters (positive forward/north)
  yawRad: number;   // Angle in radians (0 = pointing +Z, positive = clockwise looking from top)
}

export interface TrackState {
  speedMps: number;
  travelDistanceM: number;
  phase: number;          // 0 to 1 for visual tread link cycling
  wheelAngleRad: number;  // Rotation of drive sprocket and road wheels
}

export interface RobotKinematics {
  vLeftMps: number;
  vRightMps: number;
  linearSpeedMps: number;
  angularSpeedRadps: number;
  leftTrack: TrackState;
  rightTrack: TrackState;
}

export interface DeviceState {
  statusLED: 'off' | 'green' | 'amber' | 'red';
  servoPanRad: number;   // [-1.20, 1.20] rad
  servoTiltRad: number;  // [-0.35, 0.50] rad
  buzzerOn: boolean;
  buzzerFreqHz: number;
  gpioPins: Record<number, { mode: 'IN' | 'OUT'; value: number }>;
  tm1637Display: {
    digits: [number, number, number, number];
    colon: boolean;
    rawString: string;
  };
}

export interface LidarBeam {
  angleRad: number;
  distanceM: number;
}

export interface DetectedAprilTag {
  id: number;
  centerPx: [number, number];
  distanceM: number;
  xM: number;
  yM: number;
  zM: number;
  cornersPx: Array<[number, number]>;
  family: string;
}

export interface SensorData {
  frontRangeM: number;
  lidarScan: LidarBeam[];
  imu: {
    yawRad: number;
    yawRateRadps: number;
    linearAccelMps2: number;
  };
  cameraTimestampS: number;
  detectedTags: DetectedAprilTag[];
}

export interface SafetyState {
  isEmergencyStopped: boolean;
  isCollision: boolean;
  isOutsideLane: boolean;
  crossTrackErrorM: number;
  reason?: string;
}

export interface TelemetryRecord {
  simTimeS: number;
  pose: RobotPose;
  commanded: { vLeftMps: number; vRightMps: number };
  applied: { vLeftMps: number; vRightMps: number };
  speeds: { linearMps: number; angularRadps: number };
  frontRangeM: number;
  crossTrackErrorM: number;
  collision: boolean;
  estop: boolean;
  outsideLane: boolean;
}
