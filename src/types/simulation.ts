import { RobotConfig, RobotPose, RobotKinematics, DeviceState, SensorData, SafetyState } from './robot';
import { WorldMap } from './map';

export type SimulationMode = 'SIMULATION' | 'HARDWARE_BRIDGE' | 'HARDWARE';

export type SimulationStatus =
  | 'idle'
  | 'ready'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error';

export interface EventLogItem {
  id: string;
  simTimeS: number;
  source: 'SYSTEM' | 'CODE' | 'USER' | 'SAFETY' | 'HARDWARE';
  type:
    | 'code_started'
    | 'code_stopped'
    | 'command_accepted'
    | 'command_clamped'
    | 'sensor_updated'
    | 'waypoint_reached'
    | 'outside_lane'
    | 'collision'
    | 'runtime_error'
    | 'estop_triggered'
    | 'estop_reset'
    | 'map_loaded'
    | 'device_updated';
  payload: string;
  status: 'info' | 'warning' | 'error' | 'success';
}

export interface CommandMessage {
  commandId: string;
  source: 'CODE' | 'JOYSTICK' | 'MANUAL' | 'SAFETY';
  type: 'SET_MOTORS' | 'DRIVE' | 'STOP' | 'E_STOP' | 'SET_LED' | 'SET_SERVO';
  leftMps?: number;
  rightMps?: number;
  linearMps?: number;
  angularRadps?: number;
  durationS?: number;
  issuedAtSimTimeS: number;
  expiresAtSimTimeS?: number;
  ledColor?: 'off' | 'green' | 'amber' | 'red';
  servoName?: 'pan' | 'tilt';
  servoAngleRad?: number;
}

export interface SimulationSession {
  sessionId: string;
  mode: SimulationMode;
  status: SimulationStatus;
  simTimeS: number;
  config: RobotConfig;
  pose: RobotPose;
  kinematics: RobotKinematics;
  deviceState: DeviceState;
  sensors: SensorData;
  safety: SafetyState;
  currentMap: WorldMap;
  currentWaypointIndex: number;
  activeCommand: CommandMessage | null;
  pathHistory: Array<{ xM: number; zM: number }>;
  eventLog: EventLogItem[];
  consoleOutput: Array<{ id: string; timestampS: number; text: string; level: 'log' | 'warn' | 'error' | 'info' }>;
}

export interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'NOT_IMPLEMENTED';
  targetCriteria: string;
  measuredResult: string;
  details: string;
  timestamp: string;
}
