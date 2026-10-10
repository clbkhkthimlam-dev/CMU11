import { RobotPose, SafetyState } from './robot';
import { WorldMap, MapObstacle } from './map';
import { NavGoal, NavPath } from '../simulation/autonomousNavigation';

export type MissionExecutionMode = 'AUTONOMOUS' | 'PROGRAM' | 'MANUAL';

export type MissionStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED_OBSTACLE'
  | 'FAILED_TIMEOUT'
  | 'ESTOP_ABORTED'
  | 'MAP_ABORTED'
  | 'SENSOR_FAULT';

export interface MissionWaypoint {
  id: string;
  order: number;
  name: string;
  xM: number;
  zM: number;
  toleranceM: number;       // default 0.12 m
  dwellTimeS?: number;      // pause duration at waypoint (s)
  action?: 'NONE' | 'SCAN_APRILTAG' | 'BLINK_LED' | 'BEEP_BUZZER';
  status: 'PENDING' | 'REACHED' | 'SKIPPED' | 'FAILED';
}

export interface MissionConfig {
  id: string;
  title: string;
  description: string;
  mapId: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  spawnPose: {
    xM: number;
    zM: number;
    yawRad: number;
  };
  waypoints: MissionWaypoint[];
  timeoutS: number;          // e.g. 120s max
  mode: MissionExecutionMode;
  customObstacles?: MapObstacle[];
}

export interface MissionTelemetrySnapshot {
  simTimeS: number;
  xM: number;
  zM: number;
  yawRad: number;
  vLeftMps: number;
  vRightMps: number;
  crossTrackErrorM: number;
  currentWaypointIdx: number;
  isCollision: boolean;
}

export interface MissionRunMetrics {
  runId: string;
  missionId: string;
  status: MissionStatus;
  startTimeSimS: number;
  endTimeSimS: number;
  elapsedSimTimeS: number;
  totalDistanceM: number;
  plannedDistanceM: number;
  crossTrackErrors: number[];
  averageCrossTrackErrorM: number;
  maxCrossTrackErrorM: number;
  finalGoalDistanceM: number;
  collisionCount: number;
  replanCount: number;
  estopCount: number;
  sensorFaultCount: number;
  completedWaypointsCount: number;
  totalWaypointsCount: number;
  historySnapshots: MissionTelemetrySnapshot[];
}

export interface LabGradingRubricItem {
  id: string;
  name: string;
  weightPercent: number;    // e.g. 25% (sum = 100)
  targetRule: string;       // e.g. "Thời gian <= 60s"
  maxPoints: number;        // e.g. 10
}

export interface LabGradingScoreItem {
  rubricId: string;
  name: string;
  weightPercent: number;
  targetRule: string;
  measuredValue: string;
  hasData: boolean;
  score: number;            // 0 - 10
  passed: boolean;
  comment: string;
}

export interface LabAssignment {
  id: string;
  title: string;
  category: 'AUTONOMOUS' | 'MANUAL' | 'PROGRAMMING';
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  objectives: string[];
  description: string;
  recommendedMapId: string;
  missionConfig: MissionConfig;
  rubrics: LabGradingRubricItem[];
  instructions: {
    teacherNotes: string;
    studentTasks: string[];
  };
}

export interface LabGradingResult {
  evaluationId: string;
  studentName: string;
  studentGroup: string;
  assignmentId: string;
  assignmentTitle: string;
  evaluatedAt: string;
  mode: MissionExecutionMode;
  metrics: MissionRunMetrics;
  scoreItems: LabGradingScoreItem[];
  totalScore: number;       // 0 to 10
  passed: boolean;
  gradeTier: 'XUẤT SẮC' | 'GIỎI' | 'ĐẠT' | 'CẦN THỰC HÀNH LẠI';
  summaryFeedback: string;
}
