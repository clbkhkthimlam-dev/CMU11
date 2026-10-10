import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { AppSidebar, NavigationTarget } from './components/AppSidebar';
import { WorldMapCanvas } from './components/WorldMapCanvas';
import { RobotPOVCamera } from './components/RobotPOVCamera';
import { ControlDeck } from './components/ControlDeck';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { CurriculumViewer } from './components/CurriculumViewer';
import { TestRunnerModal } from './components/TestRunnerModal';
import { SyllabusModal } from './components/SyllabusModal';
import { HardwareBridgeModal } from './components/HardwareBridgeModal';
import { MapEditorModal } from './components/MapEditorModal';
import { MapGalleryModal } from './components/MapGalleryModal';
import { MapObjectManager } from './components/MapObjectManager';
import { BottomStatusBar } from './components/BottomStatusBar';
import { VirtualHardwareLab } from './components/VirtualHardwareLab';
import { PracticeReportModal } from './components/PracticeReportModal';
import { generatePracticeReport, PracticeMissionReport } from './simulation/educationalAssessment';

import { RobotPose, RobotKinematics, DeviceState, SensorData, SafetyState, DEFAULT_ROBOT_CONFIG } from './types/robot';
import { WorldMap, MapObstacle } from './types/map';
import { SimulationMode, SimulationStatus, EventLogItem, CommandMessage } from './types/simulation';
import { BUILT_IN_MAPS } from './data/mapsData';
import { MODULES_DATA } from './data/modulesData';
import { stepPhysics } from './simulation/physicsEngine';
import { parseCodeToSteps, RuntimeStep } from './simulation/codeRuntime';
import {
  OdometryState,
  updateOdometry,
  createOccupancyGrid,
  updateOccupancyGridWithLidar,
  OccupancyGrid,
} from './simulation/localization';
import {
  AutonomousNavState,
  planPathAStar,
  computePurePursuit,
  isGoalValid,
  isPathObstructed,
  validateSensorsHealth,
} from './simulation/autonomousNavigation';
import {
  Sparkles,
  Cpu,
  BookOpen,
  ShieldCheck,
  Compass,
  MapPin,
  ChevronRight,
  ChevronDown,
  Layers,
  Activity,
  Camera,
  Box,
  PanelRightClose,
  PanelRightOpen,
  Minimize2,
  Maximize2,
  Wrench,
  Radio,
  FileCode,
  Radar,
} from 'lucide-react';

export default function App() {
  // Navigation & Workspace State
  const [currentTarget, setCurrentTarget] = useState<NavigationTarget>('simulator');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Contextual Panels State
  const [rightPanelTab, setRightPanelTab] = useState<'telemetry' | 'camera' | 'objects'>('telemetry');
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);

  // Modals State
  const [isMapGalleryOpen, setIsMapGalleryOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [isMapEditorOpen, setIsMapEditorOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [practiceReport, setPracticeReport] = useState<PracticeMissionReport | null>(null);

  // Selected obstacle on active map
  const [selectedObstacleId, setSelectedObstacleId] = useState<string | null>(null);

  // Selected hardware module for lab view
  const [selectedLabModuleId, setSelectedLabModuleId] = useState<string>('M01');

  // Global Simulation State
  const [currentMap, setCurrentMap] = useState<WorldMap>(BUILT_IN_MAPS[0]);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('SIMULATION');
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('ready');
  const [simTimeS, setSimTimeS] = useState(0);

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Robot Physics State
  const [pose, setPose] = useState<RobotPose>({
    xM: BUILT_IN_MAPS[0].spawn.xM,
    yM: 0,
    zM: BUILT_IN_MAPS[0].spawn.zM,
    yawRad: BUILT_IN_MAPS[0].spawn.yawRad,
  });

  const [kinematics, setKinematics] = useState<RobotKinematics>({
    vLeftMps: 0,
    vRightMps: 0,
    linearSpeedMps: 0,
    angularSpeedRadps: 0,
    leftTrack: { speedMps: 0, travelDistanceM: 0, phase: 0, wheelAngleRad: 0 },
    rightTrack: { speedMps: 0, travelDistanceM: 0, phase: 0, wheelAngleRad: 0 },
  });

  const [deviceState, setDeviceState] = useState<DeviceState>({
    statusLED: 'off',
    servoPanRad: 0,
    servoTiltRad: 0,
    buzzerOn: false,
    buzzerFreqHz: 440,
    gpioPins: { 11: { mode: 'OUT', value: 0 }, 13: { mode: 'OUT', value: 0 }, 23: { mode: 'OUT', value: 0 } },
    tm1637Display: { digits: [0, 0, 0, 0], colon: false, rawString: '0000' },
  });

  const [sensors, setSensors] = useState<SensorData>({
    frontRangeM: 3.0,
    lidarScan: [],
    imu: { yawRad: 0, yawRateRadps: 0, linearAccelMps2: 0 },
    cameraTimestampS: Date.now() / 1000,
    detectedTags: [],
  });

  const [safety, setSafety] = useState<SafetyState>({
    isEmergencyStopped: false,
    isCollision: false,
    isOutsideLane: false,
    crossTrackErrorM: 0,
  });

  const [pathHistory, setPathHistory] = useState<Array<{ xM: number; zM: number }>>([]);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);

  // Localization & Dead-Reckoning Odometry State
  const [odometry, setOdometry] = useState<OdometryState>({
    xM: BUILT_IN_MAPS[0].spawn.xM,
    zM: BUILT_IN_MAPS[0].spawn.zM,
    yawRad: BUILT_IN_MAPS[0].spawn.yawRad,
    linearSpeedMps: 0,
    angularSpeedRadps: 0,
    totalDistanceM: 0,
    driftErrorM: 0,
    headingErrorRad: 0,
  });

  // 2D Occupancy Grid State
  const [occupancyGrid, setOccupancyGrid] = useState<OccupancyGrid>(() =>
    createOccupancyGrid(BUILT_IN_MAPS[0].bounds, 0.12)
  );
  const [showOccupancyGrid, setShowOccupancyGrid] = useState<boolean>(false);

  // Autonomous Navigation State
  const [autoNavState, setAutoNavState] = useState<AutonomousNavState>({
    status: 'IDLE',
    activeGoal: null,
    plannedPath: null,
    currentPathIndex: 0,
    lookaheadPoint: null,
    distanceToGoalM: 0,
    crossTrackErrorM: 0,
    replanCount: 0,
  });
  const [isPickingGoal, setIsPickingGoal] = useState<boolean>(false);

  // Command Bus & Runtime Execution
  const [activeCommand, setActiveCommand] = useState<CommandMessage | null>(null);
  const [code, setCode] = useState<string>(`# Kịch bản mẫu: Chạy thẳng và xoay tìm AprilTag 0
print("Bắt đầu kịch bản mô phỏng CMU10...")
robot.set_led("status", "green")
robot.set_motors(0.20, 0.20, duration=2.0)
time.sleep(0.5)
scan_for_tag(target_tag_id=0, direction="left", turn_speed=0.06)
time.sleep(0.5)
approach_tag(target_tag_id=0, desired_z_m=0.40, forward_speed=0.20)
robot.stop()
print("Hoàn thành kịch bản!")`);

  const [runtimeSteps, setRuntimeSteps] = useState<RuntimeStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [stepRemainingTimeS, setStepRemainingTimeS] = useState<number>(0);

  const [eventLog, setEventLog] = useState<EventLogItem[]>([
    {
      id: 'init_1',
      simTimeS: 0,
      source: 'SYSTEM',
      type: 'map_loaded',
      payload: 'Bản đồ "Phòng Thí Nghiệm Cơ Bản" đã được tải sẵn sàng.',
      status: 'info',
    },
  ]);

  const [consoleOutput, setConsoleOutput] = useState<
    Array<{ id: string; timestampS: number; text: string; level: 'log' | 'warn' | 'error' | 'info' }>
  >([
    { id: 'c_0', timestampS: 0, text: 'Hệ thống mô phỏng CMU10 Robotics sẵn sàng.', level: 'info' },
  ]);

  // Logging helpers
  const logEvent = useCallback((type: EventLogItem['type'], payload: string, status: EventLogItem['status'] = 'info', source: EventLogItem['source'] = 'SYSTEM') => {
    const item: EventLogItem = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      simTimeS,
      source,
      type,
      payload,
      status,
    };
    setEventLog(prev => [item, ...prev.slice(0, 49)]);
  }, [simTimeS]);

  const logConsole = useCallback((text: string, level: 'log' | 'warn' | 'error' | 'info' = 'log') => {
    setConsoleOutput(prev => [
      ...prev,
      { id: `c_${Date.now()}_${Math.random()}`, timestampS: simTimeS, text, level },
    ]);
  }, [simTimeS]);

  // Emergency Stop handlers
  const handleEmergencyStop = () => {
    setSafety(prev => ({
      ...prev,
      isEmergencyStopped: true,
      reason: 'E-STOP khẩn cấp kích hoạt',
    }));
    setActiveCommand(null);
    setCurrentStepIndex(-1);
    setKinematics(prev => ({
      ...prev,
      vLeftMps: 0,
      vRightMps: 0,
      linearSpeedMps: 0,
      angularSpeedRadps: 0,
    }));
    setAutoNavState(prev => (prev.status === 'TRACKING' ? { ...prev, status: 'ESTOP' } : prev));
    logEvent('estop_triggered', 'Nút Dừng Khẩn Cấp (E-STOP) được kích hoạt!', 'error', 'USER');
    logConsole('⚠️ E-STOP kích hoạt! Toàn bộ động cơ bị khóa.', 'error');
  };

  const handleResetEmergencyStop = () => {
    setSafety(prev => ({
      ...prev,
      isEmergencyStopped: false,
      reason: undefined,
    }));
    setAutoNavState(prev => (prev.status === 'ESTOP' ? { ...prev, status: 'IDLE', plannedPath: null, activeGoal: null } : prev));
    logEvent('estop_reset', 'E-STOP đã được đặt lại an toàn.', 'success', 'USER');
    logConsole('✓ E-STOP đã được gỡ bỏ.', 'info');
  };

  // Playback handlers
  const handlePlay = () => {
    if (safety.isEmergencyStopped) {
      logConsole('Không thể chạy khi đang bật E-STOP. Hãy nhấn Mở Khóa E-STOP trước.', 'warn');
      return;
    }
    setSimulationStatus('running');
  };

  const handlePause = () => {
    setSimulationStatus('paused');
  };

  const handleStop = () => {
    setSimulationStatus('stopped');
    setActiveCommand(null);
    setCurrentStepIndex(-1);
    setKinematics(prev => ({
      ...prev,
      vLeftMps: 0,
      vRightMps: 0,
      linearSpeedMps: 0,
      angularSpeedRadps: 0,
    }));
    logEvent('code_stopped', 'Lệnh chuyển động đã dừng hoàn toàn.', 'info', 'USER');
    logConsole('Robot đã dừng.', 'info');
  };

  const handleResetToSpawn = () => {
    handleStop();
    setPose({
      xM: currentMap.spawn.xM,
      yM: 0,
      zM: currentMap.spawn.zM,
      yawRad: currentMap.spawn.yawRad,
    });
    setPathHistory([]);
    setDeviceState(prev => ({
      ...prev,
      statusLED: 'off',
      servoPanRad: 0,
      servoTiltRad: 0,
    }));
    setSimTimeS(0);
    logEvent('map_loaded', 'Robot đã đặt lại vị trí xuất phát (spawn).', 'info', 'USER');
    logConsole('Đã đưa robot về vị trí xuất phát ban đầu.', 'info');
  };

  // Manual drive from control deck
  const handleManualDrive = (leftMps: number, rightMps: number, durationS: number = 0.5) => {
    if (safety.isEmergencyStopped) {
      logConsole('E-STOP đang bật, không thể nhận lệnh lái.', 'warn');
      return;
    }
    setActiveCommand({
      commandId: `cmd_man_${Date.now()}`,
      source: 'MANUAL',
      type: 'SET_MOTORS',
      leftMps,
      rightMps,
      durationS,
      issuedAtSimTimeS: simTimeS,
      expiresAtSimTimeS: simTimeS + durationS,
    });
    setSimulationStatus('running');
  };

  // Run user code
  const handleRunCode = () => {
    if (safety.isEmergencyStopped) {
      logConsole('E-STOP đang bật! Không thể thực thi code.', 'error');
      return;
    }
    const steps = parseCodeToSteps(code);
    if (steps.length === 0) {
      logConsole('Không tìm thấy lệnh hợp lệ trong kịch bản.', 'warn');
      return;
    }

    setRuntimeSteps(steps);
    setCurrentStepIndex(0);
    setStepRemainingTimeS(steps[0].durationS || 1.0);
    setSimulationStatus('running');
    logEvent('code_started', `Bắt đầu thực thi kịch bản (${steps.length} lệnh)`, 'info', 'CODE');
    logConsole(`🚀 Bắt đầu thực thi kịch bản gồm ${steps.length} lệnh...`, 'info');
  };

  const handleStopCode = () => {
    setCurrentStepIndex(-1);
    setActiveCommand(null);
    handleStop();
    logConsole('Đã dừng kịch bản đang chạy.', 'warn');
  };

  // Map change handler (Preserving code and user scripts!)
  const handleSelectMap = (newMap: WorldMap) => {
    handleStop();
    setCurrentMap(newMap);
    setPose({
      xM: newMap.spawn.xM,
      yM: 0,
      zM: newMap.spawn.zM,
      yawRad: newMap.spawn.yawRad,
    });
    setOdometry({
      xM: newMap.spawn.xM,
      zM: newMap.spawn.zM,
      yawRad: newMap.spawn.yawRad,
      linearSpeedMps: 0,
      angularSpeedRadps: 0,
      totalDistanceM: 0,
      driftErrorM: 0,
      headingErrorRad: 0,
    });
    setOccupancyGrid(createOccupancyGrid(newMap.bounds, 0.12));
    setAutoNavState({
      status: 'IDLE',
      activeGoal: null,
      plannedPath: null,
      currentPathIndex: 0,
      lookaheadPoint: null,
      distanceToGoalM: 0,
      crossTrackErrorM: 0,
      replanCount: 0,
    });
    setIsPickingGoal(false);
    setPathHistory([]);
    setSelectedObstacleId(null);
    logEvent('map_loaded', `Đã chuyển sang bản đồ "${newMap.name}"`, 'info', 'SYSTEM');
    logConsole(`Đã nạp bản đồ "${newMap.name}".`, 'info');
  };

  // Set Autonomous Navigation Goal
  const handleSetNavGoal = useCallback((goalPos: { xM: number; zM: number }) => {
    setIsPickingGoal(false);
    const validity = isGoalValid(goalPos, currentMap, 0.20, simTimeS);
    if (!validity.isValid) {
      logConsole(`❌ [AutoNav] Điểm đích không hợp lệ: ${validity.reason}`, 'error');
      logEvent('runtime_error', validity.reason || 'Điểm đích không hợp lệ', 'error');
      return;
    }

    const path = planPathAStar({ xM: pose.xM, zM: pose.zM }, goalPos, currentMap, simTimeS);
    if (!path) {
      logConsole('❌ [AutoNav] Không tìm thấy đường đi an toàn (bị vật cản chặn kín)!', 'error');
      logEvent('runtime_error', 'Không tìm thấy đường đi khả dụng đến điểm đích', 'error');
      setAutoNavState(prev => ({
        ...prev,
        status: 'OBSTACLE_BLOCKED',
        activeGoal: { id: `goal_${Date.now()}`, xM: goalPos.xM, zM: goalPos.zM, toleranceM: 0.10, name: `Đích (${goalPos.xM.toFixed(1)}, ${goalPos.zM.toFixed(1)})` },
      }));
      return;
    }

    setAutoNavState({
      status: 'TRACKING',
      activeGoal: {
        id: `goal_${Date.now()}`,
        xM: goalPos.xM,
        zM: goalPos.zM,
        toleranceM: 0.10,
        name: `Đích (${goalPos.xM.toFixed(1)}, ${goalPos.zM.toFixed(1)})`,
      },
      plannedPath: path,
      currentPathIndex: 0,
      lookaheadPoint: path.waypoints[1] || path.waypoints[0],
      distanceToGoalM: path.totalLengthM,
      crossTrackErrorM: 0,
      replanCount: 0,
    });

    setSimulationStatus('running');
    logConsole(`🧭 [AutoNav] Đã lập đường đi A* thành công (${path.waypoints.length} điểm, dài ${path.totalLengthM.toFixed(2)}m). Đang bắt đầu di chuyển!`, 'info');
    logEvent('command_accepted', `Đã lập đường đi A* thành công (${path.waypoints.length} điểm)`, 'success');
  }, [currentMap, simTimeS, pose, logConsole, logEvent]);

  const handleCancelNav = useCallback(() => {
    setAutoNavState(prev => ({ ...prev, status: 'IDLE', activeGoal: null, plannedPath: null, lookaheadPoint: null }));
    setActiveCommand({
      commandId: `cmd_${Date.now()}`,
      source: 'MANUAL',
      type: 'STOP',
      leftMps: 0,
      rightMps: 0,
      issuedAtSimTimeS: simTimeS,
    });
    logConsole('🛑 [AutoNav] Đã dừng và hủy lộ trình điều hướng tự hành.', 'info');
  }, [simTimeS, logConsole]);

  const handleAcknowledgeSensorFault = useCallback(() => {
    setAutoNavState(prev => {
      if (prev.status === 'SENSOR_FAULT') {
        return { ...prev, status: 'IDLE', plannedPath: null, activeGoal: null, lastMessage: undefined };
      }
      return prev;
    });
    logConsole('✓ Đã xác nhận và đặt lại trạng thái cảm biến về chế độ Chờ (IDLE).', 'info');
    logEvent('command_accepted', 'Đã đặt lại trạng thái cảm biến an toàn.', 'info', 'USER');
  }, [logConsole, logEvent]);

  const handleOpenPracticeReport = useCallback(() => {
    const report = generatePracticeReport(
      selectedLabModuleId,
      MODULES_DATA.find(m => m.id === selectedLabModuleId)?.title || 'Thực Hành Robotics',
      currentMap,
      pose,
      simTimeS,
      safety,
      autoNavState,
      odometry
    );
    setPracticeReport(report);
    setIsReportModalOpen(true);
    logConsole(`📊 Đã lập báo cáo thực hành "${report.reportId}" với điểm số: ${report.evaluation.score}/10 (${report.evaluation.gradeText}).`, 'info');
  }, [selectedLabModuleId, currentMap, pose, simTimeS, safety, autoNavState, odometry, logConsole]);

  // Incremental obstacle management (Section VIII.4: updates do not destroy unrelated obstacles!)
  const handleUpdateObstacle = (id: string, updates: Partial<MapObstacle>) => {
    setCurrentMap(prevMap => ({
      ...prevMap,
      obstacles: prevMap.obstacles.map(o => (o.id === id ? { ...o, ...updates } : o)),
    }));
  };

  const handleDeleteObstacle = (id: string) => {
    setCurrentMap(prevMap => ({
      ...prevMap,
      obstacles: prevMap.obstacles.filter(o => o.id !== id),
    }));
    if (selectedObstacleId === id) setSelectedObstacleId(null);
  };

  const handleAddObstacle = (newObs: MapObstacle) => {
    setCurrentMap(prevMap => ({
      ...prevMap,
      obstacles: [...prevMap.obstacles, newObs],
    }));
  };

  // 50Hz Simulation Tick Loop
  useEffect(() => {
    if (simulationStatus !== 'running') return;

    const dt = DEFAULT_ROBOT_CONFIG.physicsDtS; // 0.02s
    const timer = setInterval(() => {
      // Advance simulation clock
      setSimTimeS(t => t + dt);

      // Check current step in code runtime
      let cmdLeft = 0;
      let cmdRight = 0;

      if (currentStepIndex >= 0 && currentStepIndex < runtimeSteps.length) {
        const step = runtimeSteps[currentStepIndex];

        if (step.type === 'SET_MOTORS') {
          cmdLeft = step.leftMps || 0;
          cmdRight = step.rightMps || 0;
        } else if (step.type === 'DRIVE') {
          const v = step.linearMps || 0;
          const w = step.angularRadps || 0;
          cmdLeft = v - (w * DEFAULT_ROBOT_CONFIG.trackSpacingM) / 2;
          cmdRight = v + (w * DEFAULT_ROBOT_CONFIG.trackSpacingM) / 2;
        } else if (step.type === 'STOP') {
          cmdLeft = 0;
          cmdRight = 0;
        } else if (step.type === 'SET_LED') {
          setDeviceState(prev => ({ ...prev, statusLED: step.ledColor || 'off' }));
        } else if (step.type === 'SET_SERVO') {
          if (step.servoName === 'pan') {
            setDeviceState(prev => ({ ...prev, servoPanRad: step.servoAngleRad || 0 }));
          } else {
            setDeviceState(prev => ({ ...prev, servoTiltRad: step.servoAngleRad || 0 }));
          }
        } else if (step.type === 'TM1637_SHOW') {
          const val = step.numberToShow || 0;
          setDeviceState(prev => ({
            ...prev,
            tm1637Display: {
              digits: [
                Math.floor(val / 1000) % 10,
                Math.floor(val / 100) % 10,
                Math.floor(val / 10) % 10,
                val % 10,
              ],
              colon: false,
              rawString: String(val).padStart(4, '0'),
            },
          }));
        } else if (step.type === 'LOG') {
          logConsole(step.logMessage || '');
        } else if (step.type === 'SCAN_TAG') {
          const found = sensors.detectedTags.some(t => t.id === step.targetTagId);
          if (found) {
            logConsole(`✅ [scan] Đã phát hiện AprilTag ID ${step.targetTagId}!`, 'info');
            setStepRemainingTimeS(0);
          } else {
            const rotSpeed = step.speed || 0.06;
            if (step.direction === 'left') {
              cmdLeft = -rotSpeed;
              cmdRight = rotSpeed;
            } else {
              cmdLeft = rotSpeed;
              cmdRight = -rotSpeed;
            }
          }
        } else if (step.type === 'APPROACH_TAG') {
          const tag = sensors.detectedTags.find(t => t.id === step.targetTagId);
          if (!tag) {
            cmdLeft = 0.02;
            cmdRight = -0.02;
          } else {
            const desiredZ = step.desiredZM || 0.40;
            const zErr = tag.zM - desiredZ;
            const xErr = tag.xM;

            if (Math.abs(zErr) <= 0.04 && Math.abs(xErr) <= 0.08) {
              logConsole(`✅ [approach] Đã tiếp cận AprilTag ${step.targetTagId} ở khoảng cách ${tag.zM.toFixed(2)}m!`, 'info');
              setStepRemainingTimeS(0);
            } else {
              const forwardV = Math.min(step.forwardSpeed || 0.20, Math.max(0.04, zErr * 0.4));
              const steerW = -xErr * 1.2;
              cmdLeft = forwardV - (steerW * DEFAULT_ROBOT_CONFIG.trackSpacingM) / 2;
              cmdRight = forwardV + (steerW * DEFAULT_ROBOT_CONFIG.trackSpacingM) / 2;
            }
          }
        }

        // Advance step timer
        setStepRemainingTimeS(rem => {
          const nextRem = rem - dt;
          if (nextRem <= 0) {
            const nextIdx = currentStepIndex + 1;
            if (nextIdx < runtimeSteps.length) {
              setCurrentStepIndex(nextIdx);
              return runtimeSteps[nextIdx].durationS || 1.0;
            } else {
              setCurrentStepIndex(-1);
              handleStop();
              logConsole('🎉 Hoàn thành toàn bộ kịch bản mô phỏng.', 'info');
              return 0;
            }
          }
          return nextRem;
        });
      } else if (autoNavState.status === 'TRACKING' && !safety.isEmergencyStopped) {
        const sensorHealth = validateSensorsHealth(sensors);
        if (!sensorHealth.isHealthy) {
          cmdLeft = 0;
          cmdRight = 0;
          setAutoNavState(prev => ({
            ...prev,
            status: 'SENSOR_FAULT',
            lastMessage: sensorHealth.faultReason,
          }));
          logConsole(`⚠️ [AutoNav] Mất/lỗi cảm biến: ${sensorHealth.faultReason}. Chuyển sang trạng thái an toàn SENSOR_FAULT.`, 'error');
          logEvent('runtime_error', sensorHealth.faultReason || 'Lỗi cảm biến', 'error');
        } else if (autoNavState.plannedPath) {
          const pp = computePurePursuit(pose, autoNavState.plannedPath, autoNavState.activeGoal?.toleranceM || 0.10);
          if (pp.isGoalReached) {
            cmdLeft = 0;
            cmdRight = 0;
            setAutoNavState(prev => ({ ...prev, status: 'GOAL_REACHED', lookaheadPoint: null }));
            logConsole('🏁 [AutoNav] Robot đã đến điểm đích an toàn!', 'info');
            logEvent('waypoint_reached', 'Đã đến điểm đích thành công!', 'success');
          } else if (isPathObstructed(autoNavState.plannedPath, currentMap, simTimeS)) {
            logConsole('⚠️ [AutoNav] Phát hiện chướng ngại vật cắt ngang, đang tính lại đường né...', 'warn');
            const newPath = planPathAStar({ xM: pose.xM, zM: pose.zM }, autoNavState.activeGoal!, currentMap, simTimeS);
            if (newPath) {
              setAutoNavState(prev => ({ ...prev, plannedPath: newPath, replanCount: prev.replanCount + 1 }));
            } else {
              cmdLeft = 0;
              cmdRight = 0;
              setAutoNavState(prev => ({ ...prev, status: 'OBSTACLE_BLOCKED' }));
              logConsole('❌ [AutoNav] Quỹ đạo bị chặn đứng bởi chướng ngại vật!', 'error');
            }
          } else {
            cmdLeft = pp.vLeftMps;
            cmdRight = pp.vRightMps;
            setAutoNavState(prev => ({
              ...prev,
              lookaheadPoint: pp.lookaheadPoint,
              distanceToGoalM: pp.distanceToGoalM,
              crossTrackErrorM: pp.crossTrackErrorM,
            }));
          }
        }
      } else if (activeCommand && activeCommand.source === 'MANUAL') {
        if (activeCommand.expiresAtSimTimeS && simTimeS >= activeCommand.expiresAtSimTimeS) {
          cmdLeft = 0;
          cmdRight = 0;
          setActiveCommand(null);
        } else {
          cmdLeft = activeCommand.leftMps || 0;
          cmdRight = activeCommand.rightMps || 0;
        }
      }

      // Step physics
      const physicsResult = stepPhysics(
        pose,
        kinematics,
        cmdLeft,
        cmdRight,
        DEFAULT_ROBOT_CONFIG,
        currentMap,
        safety.isEmergencyStopped,
        deviceState.servoPanRad,
        deviceState.servoTiltRad,
        simTimeS
      );

      setPose(physicsResult.newPose);
      setKinematics(physicsResult.newKinematics);
      setSensors(physicsResult.sensors);
      setSafety(physicsResult.safety);

      // Cancel auto-nav tracking on E-STOP
      if (physicsResult.safety.isEmergencyStopped && autoNavState.status === 'TRACKING') {
        setAutoNavState(prev => ({ ...prev, status: 'ESTOP' }));
      }

      // Update dead-reckoning odometry
      setOdometry(prev =>
        updateOdometry(
          prev,
          physicsResult.appliedLeft,
          physicsResult.appliedRight,
          dt,
          DEFAULT_ROBOT_CONFIG.trackSpacingM,
          physicsResult.newPose
        )
      );

      // Update 2D Occupancy Grid mapping from LiDAR
      setOccupancyGrid(grid => {
        updateOccupancyGridWithLidar(grid, physicsResult.newPose, physicsResult.sensors.lidarScan);
        return grid;
      });

      // Record path history (sampled)
      setPathHistory(history => {
        const last = history[history.length - 1];
        if (!last || Math.hypot(physicsResult.newPose.xM - last.xM, physicsResult.newPose.zM - last.zM) > 0.05) {
          return [...history.slice(-300), { xM: physicsResult.newPose.xM, zM: physicsResult.newPose.zM }];
        }
        return history;
      });
    }, dt * 1000);

    return () => clearInterval(timer);
  }, [
    simulationStatus,
    pose,
    kinematics,
    currentMap,
    safety.isEmergencyStopped,
    deviceState.servoPanRad,
    deviceState.servoTiltRad,
    simTimeS,
    currentStepIndex,
    runtimeSteps,
    activeCommand,
    autoNavState,
    sensors.detectedTags,
    logConsole,
    logEvent,
    handleStop,
  ]);

  const selectedLabModule = MODULES_DATA.find(m => m.id === selectedLabModuleId) || MODULES_DATA[0];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDarkMode ? 'bg-[#0B1020] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* 1. Header Toàn Cục */}
      <Header
        simulationMode={simulationMode}
        setSimulationMode={setSimulationMode}
        simulationStatus={simulationStatus}
        isEmergencyStopped={safety.isEmergencyStopped}
        onEmergencyStop={handleEmergencyStop}
        onResetEmergencyStop={handleResetEmergencyStop}
        onOpenBridgeModal={() => setIsBridgeModalOpen(true)}
        onOpenMapGallery={() => setIsMapGalleryOpen(true)}
        onOpenMapEditor={() => setIsMapEditorOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        currentMapName={currentMap.name}
      />

      {/* 2. Middle Layer: Sidebar + Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Điều Hướng */}
        <AppSidebar
          currentTarget={currentTarget}
          onSelectTarget={target => {
            setCurrentTarget(target);
            if (target === 'maps_gallery') setIsMapGalleryOpen(true);
            if (target === 'qa_tests') setIsTestModalOpen(true);
            if (target === 'syllabus') setIsSyllabusModalOpen(true);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isDarkMode={isDarkMode}
        />

        {/* Main Content Workspace Container */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
          {/* VIEW 1: Main Simulator Workspace */}
          {currentTarget === 'simulator' && (
            <div className="flex-1 p-3 sm:p-4 flex flex-col gap-3">
              {/* Top Row: Workspace 2D/3D Map Canvas & Contextual Right Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[540px]">
                {/* Center Workspace (Map Canvas + Control Deck) */}
                <div className={`${isRightPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-3 transition-all`}>
                  {/* World Map Canvas */}
                  <div className="relative flex-1 min-h-[460px]">
                    <WorldMapCanvas
                      map={currentMap}
                      pose={pose}
                      kinematics={kinematics}
                      sensors={sensors}
                      deviceState={deviceState}
                      pathHistory={pathHistory}
                      currentWaypointIndex={currentWaypointIndex}
                      simTimeS={simTimeS}
                      selectedObstacleId={selectedObstacleId}
                      onUpdateObstacle={handleUpdateObstacle}
                      onDeleteObstacle={handleDeleteObstacle}
                      onSelectObstacle={obs => setSelectedObstacleId(obs?.id || null)}
                      autoNavState={autoNavState}
                      occupancyGrid={occupancyGrid}
                      showOccupancyGrid={showOccupancyGrid}
                      onSetNavGoal={handleSetNavGoal}
                      isPickingGoal={isPickingGoal}
                    />

                    {/* Toggle Right Panel Floating Button */}
                    <button
                      onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                      className={`absolute top-3 right-3 z-20 p-2 rounded-xl border shadow-md cursor-pointer transition-all ${
                        isDarkMode
                          ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
                          : 'bg-white/95 border-slate-200 text-slate-700 hover:text-slate-900'
                      }`}
                      title={isRightPanelCollapsed ? 'Mở panel thông số & camera' : 'Thu gọn panel bên để mở rộng bản đồ'}
                    >
                      {isRightPanelCollapsed ? <PanelRightOpen className="w-4 h-4 text-blue-500" /> : <PanelRightClose className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Manual Teleop & Playback Control Deck Toolbar */}
                  <ControlDeck
                    status={simulationStatus}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onStop={handleStop}
                    onReset={handleResetToSpawn}
                    onEmergencyStop={handleEmergencyStop}
                    isEmergencyStopped={safety.isEmergencyStopped}
                    onManualDrive={handleManualDrive}
                    linearSpeedMps={kinematics.linearSpeedMps}
                    angularSpeedRadps={kinematics.angularSpeedRadps}
                    frontRangeM={sensors.frontRangeM}
                    isCollision={safety.isCollision}
                  />
                </div>

                {/* Contextual Right Panel (Telemetry / Camera / Map Objects) */}
                {!isRightPanelCollapsed && (
                  <div className="lg:col-span-4 flex flex-col gap-3">
                    {/* Panel Navigation Tabs */}
                    <div className={`p-1 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <button
                        onClick={() => setRightPanelTab('telemetry')}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          rightPanelTab === 'telemetry'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isDarkMode
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Telemetry</span>
                      </button>

                      <button
                        onClick={() => setRightPanelTab('camera')}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          rightPanelTab === 'camera'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isDarkMode
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera POV</span>
                      </button>

                      <button
                        onClick={() => setRightPanelTab('objects')}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          rightPanelTab === 'objects'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isDarkMode
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Vật Cản ({currentMap.obstacles.length})</span>
                      </button>
                    </div>

                    {/* Tab 1: Telemetry Dashboard */}
                    {rightPanelTab === 'telemetry' && (
                      <TelemetryDashboard
                        pose={pose}
                        kinematics={kinematics}
                        sensors={sensors}
                        deviceState={deviceState}
                        safety={safety}
                        simTimeS={simTimeS}
                        eventLog={eventLog}
                        odometry={odometry}
                        autoNavState={autoNavState}
                        showOccupancyGrid={showOccupancyGrid}
                        onToggleOccupancyGrid={() => setShowOccupancyGrid(v => !v)}
                        isPickingGoal={isPickingGoal}
                        onTogglePickGoal={() => setIsPickingGoal(v => !v)}
                        onCancelNav={handleCancelNav}
                        onAcknowledgeSensorFault={handleAcknowledgeSensorFault}
                        onOpenPracticeReport={handleOpenPracticeReport}
                      />
                    )}

                    {/* Tab 2: Robot POV Virtual Camera */}
                    {rightPanelTab === 'camera' && (
                      <RobotPOVCamera
                        pose={pose}
                        sensors={sensors}
                        deviceState={deviceState}
                        map={currentMap}
                        isSimulating={simulationStatus === 'running'}
                      />
                    )}

                    {/* Tab 3: Interactive Map Object Manager */}
                    {rightPanelTab === 'objects' && (
                      <MapObjectManager
                        currentMap={currentMap}
                        selectedObstacleId={selectedObstacleId}
                        onSelectObstacle={obs => setSelectedObstacleId(obs?.id || null)}
                        onUpdateObstacle={handleUpdateObstacle}
                        onDeleteObstacle={handleDeleteObstacle}
                        onAddObstacle={handleAddObstacle}
                        isDarkMode={isDarkMode}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row: Code Editor & Sandboxed Console */}
              <div className="w-full">
                <CodeEditorPanel
                  code={code}
                  setCode={setCode}
                  onRunCode={handleRunCode}
                  onStopCode={handleStopCode}
                  isRunning={currentStepIndex >= 0}
                  consoleOutput={consoleOutput}
                  onClearConsole={() => setConsoleOutput([])}
                />
              </div>
            </div>
          )}

          {/* VIEW 2: Virtual Hardware Lab (M01-M16 Sandbox) */}
          {currentTarget === 'hardware_lab' && (
            <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-6xl mx-auto w-full">
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-500" />
                    Phòng Thí Nghiệm Linh Kiện Phần Cứng Ảo (Virtual Hardware Lab)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Thử nghiệm mạch điện GPIO, LED giao thông, còi buzzer và hiển thị 7 đoạn TM1637
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Chọn bài thực hành:</span>
                  <select
                    value={selectedLabModuleId}
                    onChange={e => setSelectedLabModuleId(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {MODULES_DATA.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.id}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <VirtualHardwareLab module={selectedLabModule} />
            </div>
          )}

          {/* VIEW 3: Curriculum Viewer (16 Modules M01-M16) */}
          {currentTarget === 'curriculum' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
              <CurriculumViewer
                onLoadCodeToSimulator={newCode => {
                  setCode(newCode);
                  setCurrentTarget('simulator');
                }}
                onNavigateToSimulator={() => setCurrentTarget('simulator')}
              />
            </div>
          )}

          {/* VIEW 4: QA Tests Suite */}
          {currentTarget === 'qa_tests' && (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full flex flex-col gap-4">
              <TestRunnerModal isOpen={true} onClose={() => setCurrentTarget('simulator')} />
            </div>
          )}

          {/* VIEW 5: Syllabus & Course Outline */}
          {currentTarget === 'syllabus' && (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full flex flex-col gap-4">
              <SyllabusModal isOpen={true} onClose={() => setCurrentTarget('simulator')} />
            </div>
          )}

          {/* VIEW 6: Telemetry Logs */}
          {currentTarget === 'telemetry_logs' && (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full flex flex-col gap-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" />
                  Nhật Ký Sự Kiện & Telemetry Toàn Cục
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  {eventLog.length} sự kiện được ghi nhận
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TelemetryDashboard
                  pose={pose}
                  kinematics={kinematics}
                  sensors={sensors}
                  deviceState={deviceState}
                  safety={safety}
                  simTimeS={simTimeS}
                  eventLog={eventLog}
                />
                <RobotPOVCamera
                  pose={pose}
                  sensors={sensors}
                  deviceState={deviceState}
                  map={currentMap}
                  isSimulating={simulationStatus === 'running'}
                />
              </div>
            </div>
          )}

          {/* VIEW 7: Inspector Mode Shortcut */}
          {currentTarget === 'inspector' && (
            <div className="flex-1 p-4 flex flex-col gap-3">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold">Chế Độ Khám Phá Chi Tiết Cơ Khí Robot 3D</h3>
                    <p className="text-xs text-slate-400">Xoay 360°, bóc tách 10 cụm linh kiện và tra cứu thông số kỹ thuật</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTarget('simulator')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Trở về mô phỏng sa bàn
                </button>
              </div>

              <div className="flex-1 min-h-[500px]">
                <WorldMapCanvas
                  map={currentMap}
                  pose={pose}
                  kinematics={kinematics}
                  sensors={sensors}
                  deviceState={deviceState}
                  pathHistory={pathHistory}
                  currentWaypointIndex={currentWaypointIndex}
                  simTimeS={simTimeS}
                  onUpdateObstacle={handleUpdateObstacle}
                  onDeleteObstacle={handleDeleteObstacle}
                  onSelectObstacle={obs => setSelectedObstacleId(obs?.id || null)}
                />
              </div>
            </div>
          )}

          {/* VIEW 8: Sensor View Shortcut */}
          {currentTarget === 'sensors_view' && (
            <div className="p-4 max-w-6xl mx-auto w-full flex flex-col gap-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Radar className="w-5 h-5 text-cyan-500" />
                  Cụm Cảm Biến SLAM & Siêu Âm Thời Gian Thực
                </h2>
                <button
                  onClick={() => setCurrentTarget('simulator')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Trở về sa bàn
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RobotPOVCamera
                  pose={pose}
                  sensors={sensors}
                  deviceState={deviceState}
                  map={currentMap}
                  isSimulating={simulationStatus === 'running'}
                />
                <TelemetryDashboard
                  pose={pose}
                  kinematics={kinematics}
                  sensors={sensors}
                  deviceState={deviceState}
                  safety={safety}
                  simTimeS={simTimeS}
                  eventLog={eventLog}
                />
              </div>
            </div>
          )}

          {/* VIEW 9: Camera POV Dedicated */}
          {currentTarget === 'camera_pov' && (
            <div className="p-4 max-w-4xl mx-auto w-full flex flex-col gap-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-500" />
                  Camera POV 3D & Định Vị AprilTag (CSI IMX219)
                </h2>
                <button
                  onClick={() => setCurrentTarget('simulator')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Trở về sa bàn
                </button>
              </div>

              <div className="w-full">
                <RobotPOVCamera
                  pose={pose}
                  sensors={sensors}
                  deviceState={deviceState}
                  map={currentMap}
                  isSimulating={simulationStatus === 'running'}
                />
              </div>
            </div>
          )}

          {/* VIEW 10: Dedicated Code Editor View */}
          {currentTarget === 'code_editor' && (
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-500" />
                  Không Gian Soạn Thảo Kịch Bản Điều Khiển Python
                </h2>
                <button
                  onClick={() => setCurrentTarget('simulator')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Mở kèm sa bàn mô phỏng
                </button>
              </div>

              <div className="flex-1">
                <CodeEditorPanel
                  code={code}
                  setCode={setCode}
                  onRunCode={handleRunCode}
                  onStopCode={handleStopCode}
                  isRunning={currentStepIndex >= 0}
                  consoleOutput={consoleOutput}
                  onClearConsole={() => setConsoleOutput([])}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Bottom Layer: Status Bar (Section 4.5) */}
      <BottomStatusBar
        simTimeS={simTimeS}
        pose={pose}
        kinematics={kinematics}
        safety={safety}
        currentMap={currentMap}
        status={simulationStatus}
        isDarkMode={isDarkMode}
        isCodeRunning={currentStepIndex >= 0}
      />

      {/* Floating Modals */}
      <MapGalleryModal
        isOpen={isMapGalleryOpen}
        onClose={() => setIsMapGalleryOpen(false)}
        currentMapId={currentMap.id}
        onSelectMap={handleSelectMap}
        isDarkMode={isDarkMode}
      />

      <MapEditorModal
        isOpen={isMapEditorOpen}
        onClose={() => setIsMapEditorOpen(false)}
        currentMap={currentMap}
        onSelectMap={handleSelectMap}
        onUpdateMap={m => setCurrentMap(m)}
      />

      <HardwareBridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        currentMode={simulationMode}
        onSelectMode={m => setSimulationMode(m)}
      />

      {isTestModalOpen && (
        <TestRunnerModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
        />
      )}

      {isSyllabusModalOpen && (
        <SyllabusModal
          isOpen={isSyllabusModalOpen}
          onClose={() => setIsSyllabusModalOpen(false)}
        />
      )}

      <PracticeReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={practiceReport}
      />
    </div>
  );
}
