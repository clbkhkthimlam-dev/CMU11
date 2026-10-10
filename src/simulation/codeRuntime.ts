import { CommandMessage, EventLogItem, SimulationSession } from '../types/simulation';

export interface CodeValidationResult {
  isValid: boolean;
  supportedApis: string[];
  unsupportedApis: string[];
  errors: Array<{ line: number; message: string }>;
  parsedCommandsCount: number;
}

export interface RuntimeStep {
  type:
    | 'SET_MOTORS'
    | 'DRIVE'
    | 'STOP'
    | 'SLEEP'
    | 'SET_LED'
    | 'SET_SERVO'
    | 'SCAN_TAG'
    | 'APPROACH_TAG'
    | 'MAZE_STEP'
    | 'GPIO_WRITE'
    | 'TM1637_SHOW'
    | 'LOG';
  leftMps?: number;
  rightMps?: number;
  linearMps?: number;
  angularRadps?: number;
  durationS?: number;
  targetTagId?: number;
  direction?: 'left' | 'right';
  desiredZM?: number;
  speed?: number;
  forwardSpeed?: number;
  ledColor?: 'off' | 'green' | 'amber' | 'red';
  servoName?: 'pan' | 'tilt';
  servoAngleRad?: number;
  gpioPin?: number;
  gpioVal?: number;
  numberToShow?: number;
  logMessage?: string;
  sourceLine?: number;
}

const SUPPORTED_KEYWORDS = [
  'robot.set_motors',
  'robot.stop',
  'robot.drive',
  'robot.set_led',
  'robot.set_servo',
  'robot.read_range',
  'robot.read_imu',
  'robot.get_pose',
  'scan_for_tag',
  'approach_tag',
  'time.sleep',
  'show_number',
  'GPIO.setup',
  'GPIO.output',
  'GPIO.input',
  'GPIO.cleanup',
  '/cmd_vel',
  'twist.linear.x',
  'twist.angular.z',
  'all_off',
];

const UNSUPPORTED_KEYWORDS = [
  'import socket',
  'import subprocess',
  'import os',
  'open(',
  'eval(',
  'exec(',
  '__import__',
  'rospy.Service',
];

/**
 * Validates Python/script code against allowlist and flags unsupported APIs
 */
export function validateCode(code: string): CodeValidationResult {
  const lines = code.split('\n');
  const supportedFound = new Set<string>();
  const unsupportedFound = new Set<string>();
  const errors: Array<{ line: number; message: string }> = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    for (const unsup of UNSUPPORTED_KEYWORDS) {
      if (trimmed.includes(unsup)) {
        unsupportedFound.add(unsup);
        errors.push({
          line: idx + 1,
          message: `API không được phép trong sandbox: "${unsup}"`,
        });
      }
    }

    for (const sup of SUPPORTED_KEYWORDS) {
      if (trimmed.includes(sup)) {
        supportedFound.add(sup);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    supportedApis: Array.from(supportedFound),
    unsupportedApis: Array.from(unsupportedFound),
    errors,
    parsedCommandsCount: supportedFound.size,
  };
}

/**
 * Parses user code into a sequence of executable runtime steps
 */
export function parseCodeToSteps(code: string): RuntimeStep[] {
  const steps: RuntimeStep[] = [];
  const lines = code.split('\n');

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    // 1. robot.set_motors(left, right, duration)
    const setMotorsMatch = line.match(/robot\.set_motors\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*(?:duration\s*=\s*)?([^)]+))?\)/);
    if (setMotorsMatch) {
      const left = parseFloat(setMotorsMatch[1]);
      const right = parseFloat(setMotorsMatch[2]);
      const duration = setMotorsMatch[3] ? parseFloat(setMotorsMatch[3]) : 1.0;
      steps.push({
        type: 'SET_MOTORS',
        leftMps: isNaN(left) ? 0 : left,
        rightMps: isNaN(right) ? 0 : right,
        durationS: isNaN(duration) ? 1.0 : duration,
        sourceLine: idx + 1,
      });
      return;
    }

    // 2. robot.drive(linear, angular, duration)
    const driveMatch = line.match(/robot\.drive\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\)/);
    if (driveMatch) {
      const lin = parseFloat(driveMatch[1]);
      const ang = parseFloat(driveMatch[2]);
      const dur = driveMatch[3] ? parseFloat(driveMatch[3]) : 1.0;
      steps.push({
        type: 'DRIVE',
        linearMps: isNaN(lin) ? 0 : lin,
        angularRadps: isNaN(ang) ? 0 : ang,
        durationS: isNaN(dur) ? 1.0 : dur,
        sourceLine: idx + 1,
      });
      return;
    }

    // 3. robot.stop()
    if (line.includes('robot.stop()')) {
      steps.push({ type: 'STOP', sourceLine: idx + 1 });
      return;
    }

    // 4. time.sleep(seconds)
    const sleepMatch = line.match(/time\.sleep\s*\(\s*([^)]+)\s*\)/);
    if (sleepMatch) {
      const dur = parseFloat(sleepMatch[1]);
      steps.push({
        type: 'SLEEP',
        durationS: isNaN(dur) ? 0.5 : dur,
        sourceLine: idx + 1,
      });
      return;
    }

    // 5. scan_for_tag(...)
    const scanMatch = line.match(/scan_for_tag\s*\(/);
    if (scanMatch) {
      // Find target_tag_id and direction
      const tagIdMatch = line.match(/target_tag_id\s*=\s*(\d+)/);
      const dirMatch = line.match(/direction\s*=\s*["'](left|right)["']/);
      const speedMatch = line.match(/turn_speed\s*=\s*([0-9.]+)/);
      const tagId = tagIdMatch ? parseInt(tagIdMatch[1], 10) : 1;
      const dir = (dirMatch ? dirMatch[1] : 'left') as 'left' | 'right';
      const speed = speedMatch ? parseFloat(speedMatch[1]) : 0.06;

      steps.push({
        type: 'SCAN_TAG',
        targetTagId: tagId,
        direction: dir,
        speed,
        durationS: 15.0, // timeout
        sourceLine: idx + 1,
      });
      return;
    }

    // 6. approach_tag(...)
    const approachMatch = line.match(/approach_tag\s*\(/);
    if (approachMatch) {
      const tagIdMatch = line.match(/target_tag_id\s*=\s*(\d+)/);
      const desiredZMatch = line.match(/desired_z_m\s*=\s*([0-9.]+)/);
      const speedMatch = line.match(/forward_speed\s*=\s*([0-9.]+)/);
      const tagId = tagIdMatch ? parseInt(tagIdMatch[1], 10) : 1;
      const desiredZ = desiredZMatch ? parseFloat(desiredZMatch[1]) : 0.40;
      const speed = speedMatch ? parseFloat(speedMatch[1]) : 0.20;

      steps.push({
        type: 'APPROACH_TAG',
        targetTagId: tagId,
        desiredZM: desiredZ,
        speed,
        durationS: 20.0,
        sourceLine: idx + 1,
      });
      return;
    }

    // 7. robot.set_led('status', 'green')
    const ledMatch = line.match(/robot\.set_led\s*\(\s*[^,]+,\s*["'](off|green|amber|red)["']\s*\)/);
    if (ledMatch) {
      steps.push({
        type: 'SET_LED',
        ledColor: ledMatch[1] as any,
        sourceLine: idx + 1,
      });
      return;
    }

    // 8. robot.set_servo('pan', 0.5)
    const servoMatch = line.match(/robot\.set_servo\s*\(\s*["'](pan|tilt)["']\s*,\s*([^)]+)\)/);
    if (servoMatch) {
      steps.push({
        type: 'SET_SERVO',
        servoName: servoMatch[1] as any,
        servoAngleRad: parseFloat(servoMatch[2]) || 0,
        sourceLine: idx + 1,
      });
      return;
    }

    // 9. show_number(1234)
    const showNumMatch = line.match(/show_number\s*\(\s*([^)]+)\s*\)/);
    if (showNumMatch) {
      const val = parseInt(showNumMatch[1], 10);
      steps.push({
        type: 'TM1637_SHOW',
        numberToShow: isNaN(val) ? 0 : val,
        sourceLine: idx + 1,
      });
      return;
    }

    // 10. print(...)
    const printMatch = line.match(/print\s*\(\s*["']([^"']+)["']\s*\)/);
    if (printMatch) {
      steps.push({
        type: 'LOG',
        logMessage: printMatch[1],
        sourceLine: idx + 1,
      });
      return;
    }

    // 11. GPIO.output(pin, value)
    const gpioOutMatch = line.match(/GPIO\.output\s*\(\s*(\d+)\s*,\s*(GPIO\.HIGH|GPIO\.LOW|1|0)\s*\)/);
    if (gpioOutMatch) {
      const pin = parseInt(gpioOutMatch[1], 10);
      const val = gpioOutMatch[2].includes('HIGH') || gpioOutMatch[2] === '1' ? 1 : 0;
      steps.push({
        type: 'GPIO_WRITE',
        gpioPin: pin,
        gpioVal: val,
        sourceLine: idx + 1,
      });
      return;
    }
  });

  return steps;
}
