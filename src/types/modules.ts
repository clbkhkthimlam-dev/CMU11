export interface ModuleLesson {
  id: string; // M01 to M16
  title: string;
  shortDesc: string;
  sourceFile: string;
  hardwareRequirements: string[];
  wiringDiagram: {
    pinConnections: Array<{ from: string; to: string; note: string }>;
    description: string;
  };
  learningOutcomes: string[];
  keyConcepts: string[];
  codeCellSource: string;
  interactiveType:
    | 'gpio_led'
    | 'traffic_light'
    | 'button_led'
    | 'tm1637'
    | 'stopwatch'
    | 'countdown'
    | 'traffic_tm1637'
    | 'traffic_tm1637_input'
    | 'lidar_ros'
    | 'joystick_teleop'
    | 'slam_mapping'
    | 'camera_setup'
    | 'camera_calibration'
    | 'apriltag_perception'
    | 'apriltag_navigation'
    | 'apriltag_maze';
  simulatedRobotCode?: string;
  notes: string[];
  verificationStatus: 'VERIFIED_IN_SIMULATION' | 'DOCUMENTATION_PRESERVED';
}

export interface SyllabusItem {
  sessionNo: number;
  topic: string;
  learningOutcomes: string;
  teachingType: string;
  materials: string;
  notes: string;
}

export interface CLOItem {
  id: string;
  title: string;
  description: string;
  mapping: string;
}
