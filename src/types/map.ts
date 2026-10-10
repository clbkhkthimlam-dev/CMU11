export interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export type BackgroundTheme =
  | 'stem_lab'
  | 'corridor'
  | 'track'
  | 'maze'
  | 'warehouse'
  | 'intersection'
  | 'outdoor'
  | 'custom';

export type CameraViewMode =
  | 'top_down'       // 2D trực giao từ trên xuống
  | '3d_iso'         // 3D phối cảnh toàn cảnh isometric
  | 'chase_cam'      // Bám theo đuôi xe 3D (Third-person chase)
  | 'first_person'   // Góc nhìn thứ nhất (Robot camera POV)
  | 'side_profile'   // Góc nhìn ngang chiếu cạnh (Profile / Ground clearance)
  | 'inspector';     // Phóng to chi tiết robot & linh kiện

export interface MapObstacle {
  id: string;
  type: 'box' | 'circle' | 'wall' | 'door';
  xM: number;
  zM: number;
  widthM: number;     // for box / door (X axis)
  depthM: number;     // for box / door (Z axis)
  radiusM?: number;   // for circle
  heightM: number;
  color?: string;
  name?: string;
  enabled?: boolean;  // Default true; if false, no collision and ignored by sensors
  isDynamic?: boolean;
  patrol?: {
    p1: [number, number];
    p2: [number, number];
    speedMps: number;
  };
  isOpen?: boolean;   // For doors: if open, passable
  rotationDeg?: number;
}

export interface MapWaypoint {
  id: string;
  xM: number;
  zM: number;
  name?: string;
  targetTagId?: number;
  desiredDistanceM?: number;
  direction?: 'left' | 'right';
  forwardSpeed?: number;
  pauseAfterS?: number;
}

export interface MapMarker {
  id: number;          // AprilTag ID (0, 1, 2, 3...)
  xM: number;
  zM: number;
  yawRad: number;      // Normal vector orientation of the marker surface
  sizeM: number;       // default 0.15 m
  label?: string;
}

export interface WorldMap {
  schemaVersion: number;
  id: string;
  name: string;
  description: string;
  units: 'm';
  backgroundTheme: BackgroundTheme;
  backgroundColor?: string;
  bounds: MapBounds;
  gridStepM: number;
  spawn: {
    xM: number;
    zM: number;
    yawRad: number;
  };
  laneHalfWidthM: number;
  lanePoints: Array<{ xM: number; zM: number }>;
  obstacles: MapObstacle[];
  waypoints: MapWaypoint[];
  markers: MapMarker[];
  metadata: {
    source: string;
    verifiedAsRealMap: boolean;
    createdDate: string;
    version?: number;
    lastUpdated?: string;
  };
}

export interface ViewportState {
  zoom: number;       // scale multiplier (1.0 = Fit)
  panX: number;       // pixel offset X
  panZ: number;       // pixel offset Y/Z
  fitScale: number;   // calculated fit-to-frame baseline
  isFullscreen: boolean;
  showGrid: boolean;
  showCoordinates: boolean;
  showPath: boolean;
  showSensors: boolean;
  showLabels: boolean;
  showRadarSweep?: boolean;
  cameraMode: CameraViewMode;
}

// Incremental Action Types for non-destructive map updates
export type MapAction =
  | { type: 'ADD_OBSTACLE'; obstacle: MapObstacle }
  | { type: 'UPDATE_OBSTACLE'; id: string; updates: Partial<MapObstacle> }
  | { type: 'MOVE_OBSTACLE'; id: string; xM: number; zM: number }
  | { type: 'SET_OBSTACLE_ENABLED'; id: string; enabled: boolean }
  | { type: 'REMOVE_OBSTACLE'; id: string }
  | { type: 'ADD_WAYPOINT'; waypoint: MapWaypoint }
  | { type: 'REMOVE_WAYPOINT'; id: string }
  | { type: 'UPDATE_PROPERTIES'; properties: Partial<WorldMap> }
  | { type: 'SET_THEME'; theme: BackgroundTheme };
