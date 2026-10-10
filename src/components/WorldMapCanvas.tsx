import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RobotPose, RobotKinematics, SensorData, DeviceState, RobotDiagnosticMode } from '../types/robot';
import { WorldMap, ViewportState, CameraViewMode, MapObstacle } from '../types/map';
import { getEffectiveObstacles } from '../simulation/physicsEngine';
import { AutonomousNavState } from '../simulation/autonomousNavigation';
import { OccupancyGrid } from '../simulation/localization';
import {
  ROBOT_COMPONENTS_CATALOG,
  RobotComponentInfo,
  drawTrackedRobot2DMechanical,
  drawTrackedRobot3DIsometric,
  drawSideProfileCAD,
  drawInspectorRobotDetailed,
  drawChaseCamRobot3D,
  drawFirstPersonCockpitHUD,
  shadeColor,
} from '../simulation/robotVisualModel';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Layers,
  Navigation,
  Radar,
  Box,
  Eye,
  EyeOff,
  Trash2,
  Move,
  Focus,
  Sliders,
  ChevronRight,
  RotateCw,
  Info,
  CheckCircle2,
  Cpu,
  Wrench,
  Activity,
  Layers as LayersIcon,
  X,
  Compass,
  MapPin,
  Grid,
} from 'lucide-react';

interface ExtendedViewportState extends ViewportState {
  showRadarSweep: boolean;
}

interface WorldMapCanvasProps {
  map: WorldMap;
  pose: RobotPose;
  kinematics: RobotKinematics;
  sensors: SensorData;
  deviceState: DeviceState;
  pathHistory: Array<{ xM: number; zM: number }>;
  currentWaypointIndex: number;
  simTimeS?: number;
  selectedObstacleId?: string | null;
  onUpdateObstacle?: (id: string, updates: Partial<MapObstacle>) => void;
  onDeleteObstacle?: (id: string) => void;
  onSelectObstacle?: (obs: MapObstacle | null) => void;
  autoNavState?: AutonomousNavState;
  occupancyGrid?: OccupancyGrid;
  showOccupancyGrid?: boolean;
  onSetNavGoal?: (goal: { xM: number; zM: number }) => void;
  isPickingGoal?: boolean;
}

export const WorldMapCanvas: React.FC<WorldMapCanvasProps> = ({
  map,
  pose,
  kinematics,
  sensors,
  deviceState,
  pathHistory,
  currentWaypointIndex,
  simTimeS = 0,
  selectedObstacleId: propSelectedObstacleId,
  onUpdateObstacle,
  onDeleteObstacle,
  onSelectObstacle,
  autoNavState,
  occupancyGrid,
  showOccupancyGrid = false,
  onSetNavGoal,
  isPickingGoal = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [viewport, setViewport] = useState<ExtendedViewportState>({
    zoom: 1.0,
    panX: 0,
    panZ: 0,
    fitScale: 70, // pixels per meter
    isFullscreen: false,
    showGrid: true,
    showCoordinates: true,
    showPath: true,
    showSensors: true,
    showLabels: true,
    showRadarSweep: true,
    cameraMode: 'top_down',
  });

  const [selectedObstacleId, setSelectedObstacleId] = useState<string | null>(propSelectedObstacleId || null);
  const [isAutoFollow, setIsAutoFollow] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingObstacle, setIsDraggingObstacle] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync selectedObstacleId when changed from parent
  useEffect(() => {
    if (propSelectedObstacleId !== undefined) {
      setSelectedObstacleId(propSelectedObstacleId);
    }
  }, [propSelectedObstacleId]);

  // Inspector & Mechanical Diagnostic States
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState<RobotDiagnosticMode>('realistic');
  const [orbitYawDeg, setOrbitYawDeg] = useState<number>(35);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [showComponentDrawer, setShowComponentDrawer] = useState<boolean>(false);

  // Store latest props for 60 FPS animation loop
  const propsRef = useRef({
    map,
    pose,
    kinematics,
    sensors,
    deviceState,
    pathHistory,
    currentWaypointIndex,
    viewport,
    simTimeS,
    selectedObstacleId,
    selectedComponentId,
    diagnosticMode,
    orbitYawDeg,
    isAutoRotating,
    autoNavState,
    occupancyGrid,
    showOccupancyGrid,
  });

  useEffect(() => {
    propsRef.current = {
      map,
      pose,
      kinematics,
      sensors,
      deviceState,
      pathHistory,
      currentWaypointIndex,
      viewport,
      simTimeS,
      selectedObstacleId,
      selectedComponentId,
      diagnosticMode,
      orbitYawDeg,
      isAutoRotating,
      autoNavState,
      occupancyGrid,
      showOccupancyGrid,
    };
  }, [
    map,
    pose,
    kinematics,
    sensors,
    deviceState,
    pathHistory,
    currentWaypointIndex,
    viewport,
    simTimeS,
    selectedObstacleId,
    selectedComponentId,
    diagnosticMode,
    orbitYawDeg,
    isAutoRotating,
    autoNavState,
    occupancyGrid,
    showOccupancyGrid,
  ]);

  // Smart Framing / Auto-Follow robot position
  useEffect(() => {
    if (!isAutoFollow) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const totalScale = viewport.fitScale * viewport.zoom;
    const mapCenterX = (map.bounds.minX + map.bounds.maxX) / 2;
    const mapCenterZ = (map.bounds.minZ + map.bounds.maxZ) / 2;
    const targetPanX = -(pose.xM - mapCenterX) * totalScale;
    const targetPanZ = (pose.zM - mapCenterZ) * totalScale;
    setViewport(prev => ({
      ...prev,
      panX: targetPanX,
      panZ: targetPanZ,
    }));
  }, [isAutoFollow, pose.xM, pose.zM, map, viewport.fitScale, viewport.zoom]);

  // Handle Fit to Frame
  const handleFitToFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mapW = map.bounds.maxX - map.bounds.minX;
    const mapH = map.bounds.maxZ - map.bounds.minZ;
    const pad = 40;
    const scaleX = (canvas.width - pad * 2) / mapW;
    const scaleZ = (canvas.height - pad * 2) / mapH;
    const bestScale = Math.min(scaleX, scaleZ);

    setViewport(prev => ({
      ...prev,
      zoom: 1.0,
      fitScale: bestScale,
      panX: 0,
      panZ: 0,
    }));
  }, [map]);

  // Center on Robot
  const handleCenterOnRobot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const totalScale = viewport.fitScale * viewport.zoom;
    const mapCenterX = (map.bounds.minX + map.bounds.maxX) / 2;
    const mapCenterZ = (map.bounds.minZ + map.bounds.maxZ) / 2;

    // Pan required so robot appears in center of canvas
    const targetPanX = -(pose.xM - mapCenterX) * totalScale;
    const targetPanZ = (pose.zM - mapCenterZ) * totalScale;

    setViewport(prev => ({
      ...prev,
      panX: targetPanX,
      panZ: targetPanZ,
    }));
  }, [map, pose, viewport.fitScale, viewport.zoom]);

  // Window resize observer
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 540;
      handleFitToFrame();
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [handleFitToFrame]);

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

    setViewport(prev => {
      const newZoom = Math.max(0.3, Math.min(6.0, prev.zoom * zoomFactor));
      const actualRatio = newZoom / prev.zoom;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Adjust pan so world point under mouse remains invariant
      const newPanX = mouseX - centerX - (mouseX - centerX - prev.panX) * actualRatio;
      const newPanZ = mouseY - centerY - (mouseY - centerY - prev.panZ) * actualRatio;

      return {
        ...prev,
        zoom: newZoom,
        panX: newPanX,
        panZ: newPanZ,
      };
    });
  };

  // Convert canvas pixel to world coordinates
  const canvasToWorld = (canvasX: number, canvasY: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const totalScale = viewport.fitScale * viewport.zoom;
    const mapCenterX = (map.bounds.minX + map.bounds.maxX) / 2;
    const mapCenterZ = (map.bounds.minZ + map.bounds.maxZ) / 2;
    const originCanvasX = canvas.width / 2 + viewport.panX;
    const originCanvasY = canvas.height / 2 + viewport.panZ;

    const xM = mapCenterX + (canvasX - originCanvasX) / totalScale;
    const zM = mapCenterZ - (canvasY - originCanvasY) / totalScale;
    return [xM, zM];
  };

  // Mouse Interaction: Clicking and Dragging Obstacles or Pan Canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const [clickXM, clickZM] = canvasToWorld(mouseX, mouseY);

    if (isPickingGoal || e.shiftKey) {
      if (onSetNavGoal) {
        onSetNavGoal({ xM: parseFloat(clickXM.toFixed(2)), zM: parseFloat(clickZM.toFixed(2)) });
        return;
      }
    }

    if (viewport.cameraMode === 'inspector') {
      setSelectedObstacleId(null);
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Check if clicking on an obstacle in top-down view
    const clickedObs = map.obstacles.find(obs => {
      const halfW = (obs.widthM || 0.8) / 2;
      const halfD = (obs.depthM || 0.8) / 2;
      return (
        clickXM >= obs.xM - halfW &&
        clickXM <= obs.xM + halfW &&
        clickZM >= obs.zM - halfD &&
        clickZM <= obs.zM + halfD
      );
    });

    if (clickedObs) {
      setSelectedObstacleId(clickedObs.id);
      setIsDraggingObstacle(true);
      if (onSelectObstacle) onSelectObstacle(clickedObs);
    } else {
      setSelectedObstacleId(null);
      setIsDraggingCanvas(true);
      if (onSelectObstacle) onSelectObstacle(null);
    }

    setDragStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panZ });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingObstacle && selectedObstacleId && onUpdateObstacle) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const [newXM, newZM] = canvasToWorld(mouseX, mouseY);
      // Snap to 0.1m
      const snappedX = Math.round(newXM * 10) / 10;
      const snappedZ = Math.round(newZM * 10) / 10;
      onUpdateObstacle(selectedObstacleId, { xM: snappedX, zM: snappedZ });
    } else if (isDraggingCanvas) {
      if (viewport.cameraMode === 'inspector') {
        const deltaX = e.clientX - dragStart.x;
        setOrbitYawDeg(prev => (prev + deltaX * 0.5) % 360);
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (viewport.cameraMode === '3d_iso' && (e.shiftKey || e.buttons === 2)) {
        const deltaX = e.clientX - dragStart.x;
        setOrbitYawDeg(prev => (prev + deltaX * 0.5) % 360);
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        setViewport(prev => ({
          ...prev,
          panX: e.clientX - dragStart.x,
          panZ: e.clientY - dragStart.y,
        }));
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setIsDraggingObstacle(false);
  };

  // 60 FPS Render Loop supporting 6 Camera Modes & Themed Backgrounds
  useEffect(() => {
    let animationFrameId: number;

    const render = (timeMs: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const {
            map: curMap,
            pose: curPose,
            kinematics: curKin,
            sensors: curSensors,
            deviceState: curDev,
            pathHistory: curPath,
            currentWaypointIndex: curWpIdx,
            viewport: curView,
            simTimeS: curSimTime,
            selectedObstacleId: curSelObsId,
            selectedComponentId: curSelectedCompId,
            diagnosticMode: curDiagMode,
            orbitYawDeg: curOrbitYawDeg,
            isAutoRotating: curIsAutoRotating,
            autoNavState: curAutoNav,
            occupancyGrid: curOccupancy,
            showOccupancyGrid: curShowOccupancy,
          } = propsRef.current;

          const width = canvas.width;
          const height = canvas.height;
          const totalScale = curView.fitScale * curView.zoom;

          const mapCenterX = (curMap.bounds.minX + curMap.bounds.maxX) / 2;
          const mapCenterZ = (curMap.bounds.minZ + curMap.bounds.maxZ) / 2;
          const originCanvasX = width / 2 + curView.panX;
          const originCanvasY = height / 2 + curView.panZ;

          const toCanvas = (xm: number, zm: number): [number, number] => {
            const px = originCanvasX + (xm - mapCenterX) * totalScale;
            const py = originCanvasY - (zm - mapCenterZ) * totalScale;
            return [px, py];
          };

          const effectiveObstacles = getEffectiveObstacles(curMap, curSimTime);
          const [robotPx, robotPy] = toCanvas(curPose.xM, curPose.zM);

          // ----------------------------------------------------
          // CHẾ ĐỘ 1: TOP-DOWN 2D (Góc nhìn trực giao từ trên xuống)
          // ----------------------------------------------------
          if (curView.cameraMode === 'top_down') {
            // Theme Background Canvas
            drawThemedBackground(ctx, curMap.backgroundTheme, width, height);

            // Grid Lines
            if (curView.showGrid) {
              drawGrid(ctx, curMap, toCanvas, totalScale);
            }

            // Outer Boundary Walls
            const [bxMin, byMax] = toCanvas(curMap.bounds.minX, curMap.bounds.minZ);
            const [bxMax, byMin] = toCanvas(curMap.bounds.maxX, curMap.bounds.maxZ);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 3;
            ctx.strokeRect(bxMin, byMin, bxMax - bxMin, byMax - byMin);

            // 2D Occupancy Grid Layer (Log-Odds mapped from LiDAR)
            if (curShowOccupancy && curOccupancy) {
              drawOccupancyGrid2D(ctx, curOccupancy, toCanvas);
            }

            // Lane Ribbon & Centerline
            if (curMap.lanePoints && curMap.lanePoints.length >= 2) {
              drawLane(ctx, curMap, toCanvas);
            }

            // Obstacles
            effectiveObstacles.forEach(obs => {
              drawObstacle2D(ctx, obs, toCanvas, totalScale, obs.id === curSelObsId);
            });

            // AprilTag Markers
            curMap.markers.forEach(marker => {
              drawMarker2D(ctx, marker, toCanvas, totalScale, curView.showLabels);
            });

            // Waypoints & Route
            if (curView.showPath && curMap.waypoints.length > 0) {
              drawWaypoints2D(ctx, curMap.waypoints, toCanvas, curWpIdx, curView.showLabels);
            }

            // Path Trajectory History
            if (curView.showPath && curPath.length > 1) {
              drawPathHistory(ctx, curPath, toCanvas);
            }

            // Autonomous Navigation Planned Path & Target Goal
            if (curAutoNav) {
              drawPlannedPathAndGoal(ctx, curAutoNav, toCanvas, timeMs, robotPx, robotPy);
            }

            // Dynamic Radar Sweep & Polar Plot Layer
            if (curView.showSensors && curView.showRadarSweep) {
              drawRadarSweepAndPolarPlot(ctx, curPose, curSensors, robotPx, robotPy, totalScale, timeMs, toCanvas, curView.showLabels);
            }

            // Ultrasonic Front Range Ray
            if (curView.showSensors && curSensors.frontRangeM > 0) {
              drawUltrasonicRay(ctx, curPose, curSensors.frontRangeM, robotPx, robotPy, toCanvas);
            }

            // Tracked Robot (2D Detailed Mechanical & Kinematic Model)
            drawTrackedRobot2DMechanical(ctx, curPose, curKin, curDev, robotPx, robotPy, totalScale, curView.showSensors, curSelectedCompId);

            // Coordinate HUD
            if (curView.showCoordinates) {
              drawCoordinateHUD(ctx, curPose, height);
            }
          }

          // ----------------------------------------------------
          // CHẾ ĐỘ 2: 3D ISOMETRIC (Góc nhìn toàn cảnh 3D)
          // ----------------------------------------------------
          else if (curView.cameraMode === '3d_iso') {
            if (curIsAutoRotating) {
              propsRef.current.orbitYawDeg = (propsRef.current.orbitYawDeg + 0.3) % 360;
            }
            draw3DIsometricScene(
              ctx,
              curMap,
              curPose,
              curKin,
              curDev,
              effectiveObstacles,
              curSensors,
              width,
              height,
              totalScale,
              curView.panX,
              curView.panZ,
              curSelectedCompId,
              propsRef.current.orbitYawDeg,
              curSelObsId,
              curView.showGrid,
              curView.showLabels
            );
          }

          // ----------------------------------------------------
          // CHẾ ĐỘ 3: CHASE CAM (Góc nhìn bám theo đuôi xe 3D)
          // ----------------------------------------------------
          else if (curView.cameraMode === 'chase_cam') {
            drawChaseCameraScene(
              ctx,
              curMap,
              curPose,
              curKin,
              curDev,
              effectiveObstacles,
              curSensors,
              width,
              height,
              timeMs,
              curSelectedCompId
            );
          }

          // ----------------------------------------------------
          // CHẾ ĐỘ 4: FIRST PERSON (Góc nhìn thứ nhất camera robot)
          // ----------------------------------------------------
          else if (curView.cameraMode === 'first_person') {
            drawFirstPersonScene(
              ctx,
              curMap,
              curPose,
              curKin,
              curDev,
              effectiveObstacles,
              curSensors,
              width,
              height
            );
          }

          // ----------------------------------------------------
          // CHẾ ĐỘ 5: SIDE PROFILE (Góc nhìn ngang kiểm tra gầm)
          // ----------------------------------------------------
          else if (curView.cameraMode === 'side_profile') {
            drawSideProfileCAD(
              ctx,
              curPose,
              curKin,
              curDev,
              curSensors,
              width,
              height,
              totalScale,
              curSelectedCompId
            );
          }

          // ----------------------------------------------------
          // CHẾ ĐỘ 6: INSPECTOR (Phóng to chi tiết linh kiện robot)
          // ----------------------------------------------------
          else if (curView.cameraMode === 'inspector') {
            if (curIsAutoRotating) {
              propsRef.current.orbitYawDeg = (propsRef.current.orbitYawDeg + 0.4) % 360;
            }
            const orbitRad = (propsRef.current.orbitYawDeg * Math.PI) / 180;
            drawInspectorRobotDetailed(
              ctx,
              curPose,
              curKin,
              curDev,
              curSensors,
              width,
              height,
              orbitRad,
              curDiagMode,
              curSelectedCompId
            );
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const selectedObs = map.obstacles.find(o => o.id === selectedObstacleId);
  const selectedComponent = ROBOT_COMPONENTS_CATALOG.find(c => c.id === selectedComponentId);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex flex-col ${
        viewport.isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[540px]'
      }`}
    >
      {/* Top Camera Mode Switcher Bar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setViewport(v => ({ ...v, cameraMode: 'top_down' }))}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            viewport.cameraMode === 'top_down'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Góc nhìn 2D từ trên xuống (Top-down Plan View)"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>2D Trên Xuống</span>
        </button>

        <button
          onClick={() => setViewport(v => ({ ...v, cameraMode: '3d_iso' }))}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            viewport.cameraMode === '3d_iso'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="3D toàn cảnh Isometric"
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Toàn Cảnh</span>
        </button>

        <button
          onClick={() => setViewport(v => ({ ...v, cameraMode: 'chase_cam' }))}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            viewport.cameraMode === 'chase_cam'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Camera bám theo đuôi robot (Chase Cam)"
        >
          <Focus className="w-3.5 h-3.5" />
          <span>Theo Sau Robot</span>
        </button>

        <button
          onClick={() => setViewport(v => ({ ...v, cameraMode: 'first_person' }))}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            viewport.cameraMode === 'first_person'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Góc nhìn thứ nhất từ camera robot (First-person POV)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Góc Nhìn Robot</span>
        </button>

        <button
          onClick={() => setViewport(v => ({ ...v, cameraMode: 'side_profile' }))}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            viewport.cameraMode === 'side_profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Góc nhìn ngang kiểm tra chiều cao & khoảng sáng gầm"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Góc Nhìn Ngang</span>
        </button>

        <button
          onClick={() => setViewport(v => ({ ...v, cameraMode: 'inspector' }))}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            viewport.cameraMode === 'inspector'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Phóng to robot quan sát chi tiết linh kiện cơ khí & điện tử"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Chi Tiết Robot</span>
        </button>
      </div>

      {/* Inspector Mode Sub-Bar: Diagnostic Modes & Orbit Controls */}
      {viewport.cameraMode === 'inspector' && (
        <div className="absolute top-14 left-3 z-20 flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-700 text-xs text-white">
          <span className="text-[11px] font-bold text-slate-400 pl-1">Chế độ chẩn đoán:</span>
          {(['realistic', 'components', 'wireframe', 'collision', 'axes'] as RobotDiagnosticMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setDiagnosticMode(mode)}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer font-medium ${
                diagnosticMode === mode
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {mode === 'realistic' && 'Vật Liệu Thực'}
              {mode === 'components' && 'Cụm Linh Kiện'}
              {mode === 'wireframe' && 'Khung Dây 3D'}
              {mode === 'collision' && 'Vùng Va Chạm'}
              {mode === 'axes' && 'Trục Tọa Độ'}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Orbit Controls */}
          <span className="text-[11px] font-bold text-slate-400">Xoay 3D:</span>
          <button
            onClick={() => setOrbitYawDeg(d => (d - 15) % 360)}
            className="p-1 hover:bg-slate-800 rounded-md cursor-pointer text-slate-300 hover:text-white"
            title="Xoay trái 15°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setOrbitYawDeg(d => (d + 15) % 360)}
            className="p-1 hover:bg-slate-800 rounded-md cursor-pointer text-slate-300 hover:text-white"
            title="Xoay phải 15°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              isAutoRotating ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Bật/tắt tự động xoay quanh robot"
          >
            <Activity className="w-3 h-3" />
            <span>{isAutoRotating ? 'Dừng Xoay' : 'Tự Động Xoay'}</span>
          </button>
          <button
            onClick={() => {
              setOrbitYawDeg(35);
              setIsAutoRotating(false);
            }}
            className="px-1.5 py-1 hover:bg-slate-800 rounded-md text-[11px] text-slate-400 hover:text-white cursor-pointer"
            title="Đặt lại góc xoay chuẩn"
          >
            Reset
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Component Catalog Toggle */}
          <button
            onClick={() => setShowComponentDrawer(!showComponentDrawer)}
            className={`px-2.5 py-1 rounded-md font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
              showComponentDrawer || selectedComponentId
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-blue-400 hover:bg-slate-700'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Tra Cứu 10 Linh Kiện</span>
            {selectedComponentId && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
        </div>
      )}

      {/* 3D Isometric Mode Sub-Bar: Orbit Controls & Rendering Toggles */}
      {viewport.cameraMode === '3d_iso' && (
        <div className="absolute top-14 left-3 z-20 flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-700 text-xs text-white">
          <span className="text-[11px] font-bold text-slate-400 pl-1">Góc nhìn 3D:</span>
          <button
            onClick={() => setOrbitYawDeg(d => (d - 15) % 360)}
            className="p-1 hover:bg-slate-800 rounded-md cursor-pointer text-slate-300 hover:text-white"
            title="Xoay trái 15°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setOrbitYawDeg(d => (d + 15) % 360)}
            className="p-1 hover:bg-slate-800 rounded-md cursor-pointer text-slate-300 hover:text-white"
            title="Xoay phải 15°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              isAutoRotating ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Bật/tắt tự động xoay toàn cảnh"
          >
            <Activity className="w-3 h-3" />
            <span>{isAutoRotating ? 'Dừng Xoay' : 'Tự Động Xoay'}</span>
          </button>
          <button
            onClick={() => {
              setOrbitYawDeg(0);
              setIsAutoRotating(false);
            }}
            className="px-1.5 py-1 hover:bg-slate-800 rounded-md text-[11px] text-slate-400 hover:text-white cursor-pointer"
            title="Góc nhìn chuẩn 0°"
          >
            Reset
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => setViewport(v => ({ ...v, showGrid: !v.showGrid }))}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              viewport.showGrid ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Bật/tắt lưới tọa độ 3D"
          >
            Lưới 3D
          </button>
          <button
            onClick={() => setViewport(v => ({ ...v, showLabels: !v.showLabels }))}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              viewport.showLabels ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Bật/tắt nhãn vật cản"
          >
            Nhãn
          </button>
        </div>
      )}

      {/* Viewport Control Bar (Right side) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200 text-xs">
        <button
          onClick={() => setIsAutoFollow(!isAutoFollow)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isAutoFollow ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title={isAutoFollow ? 'Tắt tự động bám theo robot' : 'Bật tự động bám theo robot (Auto-Follow)'}
        >
          <Compass className={`w-4 h-4 ${isAutoFollow ? 'text-white' : 'text-purple-600'}`} />
        </button>
        <button
          onClick={handleCenterOnRobot}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Căn giữa vào robot (Center on Robot)"
        >
          <Focus className="w-4 h-4 text-purple-600" />
        </button>
        <button
          onClick={handleFitToFrame}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Fit to frame: Vừa khung toàn bộ bản đồ"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>
        <button
          onClick={() => setViewport(v => ({ ...v, zoom: Math.min(5.0, v.zoom * 1.25) }))}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Phóng to (Zoom In)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.3, v.zoom * 0.8) }))}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Thu nhỏ (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewport(v => ({ ...v, panX: 0, panZ: 0, zoom: 1.0 }))}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Khôi phục góc nhìn (Reset View)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        {/* Radar Sweep Toggle */}
        <button
          onClick={() => setViewport(v => ({ ...v, showRadarSweep: !v.showRadarSweep }))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-semibold ${
            viewport.showRadarSweep ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Bật/tắt quét Radar & Biểu đồ cực"
        >
          <Radar className={`w-4 h-4 ${viewport.showRadarSweep ? 'text-emerald-600' : 'text-slate-500'}`} />
        </button>
        <button
          onClick={() => setViewport(v => ({ ...v, showSensors: !v.showSensors }))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            viewport.showSensors ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Bật/tắt tia cảm biến"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewport(v => ({ ...v, isFullscreen: !v.isFullscreen }))}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Toàn màn hình (Fullscreen)"
        >
          {viewport.isFullscreen ? <Minimize2 className="w-4 h-4 text-red-600" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Selected Obstacle Floating Control Box */}
      {selectedObs && onUpdateObstacle && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-slate-200 text-xs flex flex-col gap-2 min-w-[260px]">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-blue-600" />
              {selectedObs.name || selectedObs.id}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({selectedObs.xM.toFixed(1)}m, {selectedObs.zM.toFixed(1)}m)
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onUpdateObstacle(selectedObs.id, { enabled: selectedObs.enabled === false ? true : false })}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                selectedObs.enabled === false
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {selectedObs.enabled === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{selectedObs.enabled === false ? 'Đang Tắt' : 'Đang Bật'}</span>
            </button>

            {onDeleteObstacle && (
              <button
                onClick={() => {
                  onDeleteObstacle(selectedObs.id);
                  setSelectedObstacleId(null);
                }}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="Xóa vật cản này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Component Specification Card (When a component is selected) */}
      {viewport.cameraMode === 'inspector' && selectedComponent && (
        <div className="absolute top-28 right-3 z-30 w-80 max-h-[80%] bg-slate-900/95 backdrop-blur-md rounded-xl p-3.5 shadow-2xl border border-slate-700 text-xs text-white flex flex-col gap-2.5 overflow-y-auto">
          <div className="flex items-start justify-between border-b border-slate-700 pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">
                {selectedComponent.category}
              </span>
              <h4 className="font-bold text-sm text-white mt-1">{selectedComponent.vietnameseName}</h4>
              <p className="text-[10px] text-slate-400 font-mono">{selectedComponent.name}</p>
            </div>
            <button
              onClick={() => setSelectedComponentId(null)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
            <div>
              <span className="text-slate-400 block text-[10px]">Kích thước [W×H×L]:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {selectedComponent.dimensionsMm[0]} × {selectedComponent.dimensionsMm[1]} × {selectedComponent.dimensionsMm[2]} mm
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Khối lượng:</span>
              <span className="font-mono font-semibold text-amber-400">{selectedComponent.massGrams} g</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px]">Vị trí lắp đặt:</span>
              <span className="text-slate-200">{selectedComponent.location}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Thông số kỹ thuật:</span>
            <div className="flex flex-col gap-1 bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
              {Object.entries(selectedComponent.specs).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">{k}:</span>
                  <span className="font-mono font-medium text-slate-200 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Giao tiếp / Chuẩn nối:</span>
            <div className="flex flex-wrap gap-1">
              {selectedComponent.interfaces.map((inf, i) => (
                <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {inf}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800 pt-2">
            {selectedComponent.description}
          </p>

          <button
            onClick={() => setSelectedComponentId(null)}
            className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition-colors text-center"
          >
            Bỏ chọn · Xem toàn bộ robot
          </button>
        </div>
      )}

      {/* Component Catalog Drawer (List of 10 components) */}
      {viewport.cameraMode === 'inspector' && showComponentDrawer && (
        <div className="absolute top-28 left-3 z-30 w-72 max-h-[80%] bg-slate-900/95 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-slate-700 text-xs text-white flex flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
            <span className="font-bold text-xs flex items-center gap-1.5 text-blue-400">
              <Wrench className="w-3.5 h-3.5" />
              10 Cụm Linh Kiện Robot CMU10
            </span>
            <button
              onClick={() => setShowComponentDrawer(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            Nhấp vào từng linh kiện để phóng to và xem thông số cơ khí / điện tử:
          </p>

          <div className="flex flex-col gap-1.5 mt-1">
            {ROBOT_COMPONENTS_CATALOG.map((comp, idx) => {
              const isSelected = selectedComponentId === comp.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    setSelectedComponentId(isSelected ? null : comp.id);
                  }}
                  className={`text-left p-2 rounded-lg transition-all cursor-pointer border flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-purple-900/60 border-purple-400 text-white shadow-xs'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-700 text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      {comp.vietnameseName.split('(')[0]}
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-700 text-slate-300">
                      {comp.massGrams}g
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 pl-5 font-mono truncate">{comp.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Main Canvas */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      />
    </div>
  );
};

// ====================================================================
// RENDER HELPERS: THEMES, 2D, 3D ISOMETRIC, CHASE CAM, PROFILE, INSPECTOR
// ====================================================================

function drawThemedBackground(ctx: CanvasRenderingContext2D, theme: string, w: number, h: number) {
  if (theme === 'stem_lab') {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, w, h);
  } else if (theme === 'corridor') {
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, w, h);
  } else if (theme === 'track') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, w, h);
  } else if (theme === 'maze') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);
  } else if (theme === 'warehouse') {
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, w, h);
  } else if (theme === 'intersection') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, w, h);
  } else if (theme === 'outdoor') {
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, w, h);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, map: WorldMap, toCanvas: (x: number, z: number) => [number, number], scale: number) {
  ctx.strokeStyle = map.backgroundTheme === 'maze' || map.backgroundTheme === 'intersection' ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
  ctx.lineWidth = 1;
  const step = scale > 100 ? 0.25 : 1.0;

  for (let x = Math.floor(map.bounds.minX); x <= Math.ceil(map.bounds.maxX); x += step) {
    const [x1, y1] = toCanvas(x, map.bounds.minZ);
    const [x2, y2] = toCanvas(x, map.bounds.maxZ);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  for (let z = Math.floor(map.bounds.minZ); z <= Math.ceil(map.bounds.maxZ); z += step) {
    const [x1, y1] = toCanvas(map.bounds.minX, z);
    const [x2, y2] = toCanvas(map.bounds.maxX, z);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawLane(ctx: CanvasRenderingContext2D, map: WorldMap, toCanvas: (x: number, z: number) => [number, number]) {
  ctx.fillStyle = 'rgba(37, 99, 235, 0.05)';
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);

  ctx.beginPath();
  map.lanePoints.forEach((pt, i) => {
    const [px, py] = toCanvas(pt.xM, pt.zM);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawObstacle2D(
  ctx: CanvasRenderingContext2D,
  obs: MapObstacle,
  toCanvas: (x: number, z: number) => [number, number],
  scale: number,
  isSelected: boolean
) {
  const isOff = obs.enabled === false;

  ctx.save();
  if (isOff) {
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([4, 4]);
  }

  if (obs.type === 'circle') {
    const [cx, cy] = toCanvas(obs.xM, obs.zM);
    const rPx = (obs.radiusM || 0.15) * scale;
    ctx.fillStyle = obs.color || '#EA580C';
    ctx.beginPath();
    ctx.arc(cx, cy, rPx, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#3B82F6' : '#9A3412';
    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.stroke();
  } else {
    const halfW = obs.widthM / 2;
    const halfD = obs.depthM / 2;
    const [x1, y1] = toCanvas(obs.xM - halfW, obs.zM + halfD);
    const [x2, y2] = toCanvas(obs.xM + halfW, obs.zM - halfD);

    if (!isOff) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(x1 + 3, y1 + 3, x2 - x1, y2 - y1);
    }

    ctx.fillStyle = obs.color || '#475569';
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeStyle = isSelected ? '#2563EB' : '#1E293B';
    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    if (isOff) {
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 9px "JetBrains Mono"';
      ctx.fillText('ĐÃ TẮT', x1 + 4, y1 + 12);
    }
  }

  ctx.restore();
}

function drawMarker2D(
  ctx: CanvasRenderingContext2D,
  marker: any,
  toCanvas: (x: number, z: number) => [number, number],
  scale: number,
  showLabels: boolean
) {
  const [mx, my] = toCanvas(marker.xM, marker.zM);
  const tagPx = Math.max(16, marker.sizeM * scale);

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(marker.yawRad);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-tagPx / 2, -tagPx / 2, tagPx, tagPx);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(-tagPx / 2, -tagPx / 2, tagPx, tagPx);
  ctx.fillStyle = '#000000';
  ctx.fillRect(-tagPx / 4, -tagPx / 4, tagPx / 2, tagPx / 2);
  ctx.restore();

  if (showLabels) {
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px "JetBrains Mono"';
    ctx.fillText(`TAG ${marker.id}`, mx + tagPx / 2 + 4, my + 4);
  }
}

function drawWaypoints2D(
  ctx: CanvasRenderingContext2D,
  waypoints: any[],
  toCanvas: (x: number, z: number) => [number, number],
  currentIdx: number,
  showLabels: boolean
) {
  ctx.strokeStyle = '#8B5CF6';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  waypoints.forEach((wp, idx) => {
    const [wx, wy] = toCanvas(wp.xM, wp.zM);
    if (idx === 0) ctx.moveTo(wx, wy);
    else ctx.lineTo(wx, wy);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  waypoints.forEach((wp, idx) => {
    const [wx, wy] = toCanvas(wp.xM, wp.zM);
    const isCurrent = idx === currentIdx;
    ctx.fillStyle = isCurrent ? '#EC4899' : '#8B5CF6';
    ctx.beginPath();
    ctx.arc(wx, wy, isCurrent ? 7 : 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (showLabels) {
      ctx.fillStyle = '#4C1D95';
      ctx.font = 'bold 10px "JetBrains Mono"';
      ctx.fillText(`WP${idx + 1}`, wx + 8, wy - 4);
    }
  });
}

function drawPathHistory(ctx: CanvasRenderingContext2D, path: any[], toCanvas: (x: number, z: number) => [number, number]) {
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  path.forEach((pt, idx) => {
    const [hx, hy] = toCanvas(pt.xM, pt.zM);
    if (idx === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  });
  ctx.stroke();
}

function drawOccupancyGrid2D(
  ctx: CanvasRenderingContext2D,
  grid: OccupancyGrid,
  toCanvas: (x: number, z: number) => [number, number]
) {
  const res = grid.resolutionM;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const idx = r * grid.cols + c;
      const prob = grid.probabilities[idx];
      if (prob > 0.60) {
        // Occupied cell
        const xM = grid.originX + c * res;
        const zM = grid.originZ + r * res;
        const [px1, py1] = toCanvas(xM, zM + res);
        const [px2, py2] = toCanvas(xM + res, zM);
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.65, (prob - 0.5) * 1.5)})`;
        ctx.fillRect(px1, py1, Math.max(1, px2 - px1), Math.max(1, py2 - py1));
      } else if (prob < 0.35) {
        // Free space cell
        const xM = grid.originX + c * res;
        const zM = grid.originZ + r * res;
        const [px1, py1] = toCanvas(xM, zM + res);
        const [px2, py2] = toCanvas(xM + res, zM);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.fillRect(px1, py1, Math.max(1, px2 - px1), Math.max(1, py2 - py1));
      }
    }
  }
}

function drawPlannedPathAndGoal(
  ctx: CanvasRenderingContext2D,
  autoNav: AutonomousNavState,
  toCanvas: (x: number, z: number) => [number, number],
  timeMs: number,
  robotPx: number,
  robotPy: number
) {
  // 1. Draw Planned A* Path
  if (autoNav.plannedPath && autoNav.plannedPath.waypoints.length > 1) {
    const wps = autoNav.plannedPath.waypoints;
    ctx.save();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 6;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -((timeMs / 40) % 12);
    ctx.beginPath();
    wps.forEach((wp, idx) => {
      const [wx, wy] = toCanvas(wp.xM, wp.zM);
      if (idx === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    });
    ctx.stroke();
    ctx.restore();

    // Waypoint dots
    wps.forEach((wp, idx) => {
      const [wx, wy] = toCanvas(wp.xM, wp.zM);
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(wx, wy, 3.5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // 2. Draw Pure Pursuit Lookahead Target Point
  if (autoNav.lookaheadPoint && autoNav.status === 'TRACKING') {
    const [lx, ly] = toCanvas(autoNav.lookaheadPoint.xM, autoNav.lookaheadPoint.zM);
    // Line from robot to lookahead
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(robotPx, robotPy);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing Lookahead dot
    ctx.fillStyle = '#06B6D4';
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 3. Draw Target Goal Pin
  if (autoNav.activeGoal) {
    const [gx, gy] = toCanvas(autoNav.activeGoal.xM, autoNav.activeGoal.zM);
    const pulse = 1.0 + 0.25 * Math.sin(timeMs / 200);

    // Outer ripple ring
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gx, gy, 12 * pulse, 0, 2 * Math.PI);
    ctx.stroke();

    // Bullseye
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(gx, gy, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Target Label Banner
    ctx.font = 'bold 11px "JetBrains Mono"';
    const label = autoNav.activeGoal.name
      ? `${autoNav.activeGoal.name}: (${autoNav.activeGoal.xM.toFixed(1)}, ${autoNav.activeGoal.zM.toFixed(1)})m`
      : `ĐÍCH: (${autoNav.activeGoal.xM.toFixed(1)}, ${autoNav.activeGoal.zM.toFixed(1)})m`;
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(gx - tw / 2 - 4, gy - 26, tw + 8, 18);
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(label, gx - tw / 2, gy - 13);
  }
}

function drawRadarSweepAndPolarPlot(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  sensors: SensorData,
  rx: number,
  ry: number,
  scale: number,
  timeMs: number,
  toCanvas: (x: number, z: number) => [number, number],
  showLabels: boolean
) {
  const sweepSpeedRadps = 3.14;
  const sweepWorldAngle = (timeMs / 1000 * sweepSpeedRadps) % (2 * Math.PI);

  ctx.save();
  const maxRangeM = 6.0;
  const rings = [1.0, 2.0, 3.0, 4.0, 5.0];

  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;

  rings.forEach(r => {
    const rPx = r * scale;
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.22)';
    ctx.beginPath();
    ctx.arc(rx, ry, rPx, 0, 2 * Math.PI);
    ctx.stroke();

    if (showLabels && scale > 35) {
      const lx = rx + rPx * Math.cos(pose.yawRad) + 3;
      const ly = ry + rPx * Math.sin(pose.yawRad) - 2;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.7)';
      ctx.font = '9px "JetBrains Mono"';
      ctx.fillText(`${r.toFixed(1)}m`, lx, ly);
    }
  });

  // Azimuth Spokes
  const spokes = 12;
  for (let i = 0; i < spokes; i++) {
    const spokeWorld = pose.yawRad + (i * 2 * Math.PI) / spokes;
    const sx = rx + maxRangeM * scale * Math.sin(spokeWorld);
    const sy = ry - maxRangeM * scale * Math.cos(spokeWorld);
    ctx.setLineDash(i === 0 ? [] : [2, 6]);
    ctx.strokeStyle = i === 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 165, 233, 0.1)';
    ctx.lineWidth = i === 0 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(sx, sy);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Polar Scanned Contour
  if (sensors.lidarScan && sensors.lidarScan.length > 2) {
    ctx.beginPath();
    let firstPt: [number, number] | null = null;
    sensors.lidarScan.forEach((beam, idx) => {
      const wa = pose.yawRad + beam.angleRad;
      const d = Math.min(beam.distanceM, maxRangeM);
      const [px, py] = toCanvas(pose.xM + d * Math.sin(wa), pose.zM + d * Math.cos(wa));
      if (idx === 0) {
        firstPt = [px, py];
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    if (firstPt) {
      ctx.closePath();
      const radGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, maxRangeM * scale);
      radGrad.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
      radGrad.addColorStop(1, 'rgba(6, 182, 212, 0.01)');
      ctx.fillStyle = radGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Sweep Fan
  const sweepTail = 0.75;
  const sweepArc = -Math.PI / 2 + sweepWorldAngle;
  for (let s = 0; s < 16; s++) {
    const frac = s / 16;
    const a1 = sweepArc - sweepTail * (1 - frac);
    const a2 = sweepArc - sweepTail * (1 - (s + 1) / 16);
    ctx.fillStyle = `rgba(16, 185, 129, ${Math.pow(frac, 2.5) * 0.16})`;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.arc(rx, ry, maxRangeM * scale, a1, a2);
    ctx.closePath();
    ctx.fill();
  }

  // Leading Sweep Beam
  const hx = rx + maxRangeM * scale * Math.sin(sweepWorldAngle);
  const hy = ry - maxRangeM * scale * Math.cos(sweepWorldAngle);
  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx, ry);
  ctx.lineTo(hx, hy);
  ctx.stroke();

  // Active point cloud
  sensors.lidarScan.forEach(beam => {
    if (beam.distanceM < 7.9) {
      const wa = pose.yawRad + beam.angleRad;
      const [px, py] = toCanvas(pose.xM + beam.distanceM * Math.sin(wa), pose.zM + beam.distanceM * Math.cos(wa));
      let diff = (sweepWorldAngle - wa) % (2 * Math.PI);
      if (diff < 0) diff += 2 * Math.PI;

      if (diff < 0.75) {
        ctx.fillStyle = beam.distanceM < 0.6 ? '#EF4444' : '#34D399';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillStyle = beam.distanceM < 0.6 ? '#EF4444' : '#06B6D4';
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });

  ctx.restore();
}

function drawUltrasonicRay(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  distM: number,
  rx: number,
  ry: number,
  toCanvas: (x: number, z: number) => [number, number]
) {
  const [hx, hy] = toCanvas(pose.xM + distM * Math.sin(pose.yawRad), pose.zM + distM * Math.cos(pose.yawRad));
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rx, ry);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.fillStyle = '#14B8A6';
  ctx.beginPath();
  ctx.arc(hx, hy, 4, 0, 2 * Math.PI);
  ctx.fill();
}

function drawTrackedRobot2D(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  rx: number,
  ry: number,
  scale: number,
  showSensors: boolean
) {
  const chassisL = 0.32 * scale;
  const chassisW = 0.22 * scale;
  const trackW = 0.045 * scale;
  const trackSpacing = 0.20 * scale;

  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(pose.yawRad);

  // Vision cone
  if (showSensors) {
    const fovAngle = (60 * Math.PI) / 180;
    const fovLen = 2.5 * scale;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, fovLen, -Math.PI / 2 - fovAngle / 2, -Math.PI / 2 + fovAngle / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Left Track
  const lx = -trackSpacing / 2;
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(lx - trackW / 2, -chassisL / 2 - 2, trackW, chassisL + 4, 4);
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.stroke();

  // Left ribs
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  for (let r = 0; r < 8; r++) {
    const ryRib = -chassisL / 2 + (((r + kin.leftTrack.phase) % 8) / 8) * chassisL;
    ctx.beginPath();
    ctx.moveTo(lx - trackW / 2, ryRib);
    ctx.lineTo(lx + trackW / 2, ryRib);
    ctx.stroke();
  }

  // Right Track
  const rrx = trackSpacing / 2;
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(rrx - trackW / 2, -chassisL / 2 - 2, trackW, chassisL + 4, 4);
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.stroke();

  // Right ribs
  for (let r = 0; r < 8; r++) {
    const ryRib = -chassisL / 2 + (((r + kin.rightTrack.phase) % 8) / 8) * chassisL;
    ctx.beginPath();
    ctx.moveTo(rrx - trackW / 2, ryRib);
    ctx.lineTo(rrx + trackW / 2, ryRib);
    ctx.stroke();
  }

  // Chassis Main Box
  ctx.fillStyle = '#2563EB';
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-chassisW / 2 + 3, -chassisL / 2 + 4, chassisW - 6, chassisL - 8, 5);
  ctx.fill();
  ctx.stroke();

  // Heading Nose Arrow
  ctx.fillStyle = '#1E40AF';
  ctx.beginPath();
  ctx.moveTo(0, -chassisL / 2 + 1);
  ctx.lineTo(-7, -chassisL / 2 + 15);
  ctx.lineTo(7, -chassisL / 2 + 15);
  ctx.closePath();
  ctx.fill();

  // Status LED
  const ledColors: Record<string, string> = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444', off: '#64748B' };
  ctx.fillStyle = ledColors[dev.statusLED] || '#64748B';
  ctx.beginPath();
  ctx.arc(0, chassisL / 4, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // LIDAR Puck
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(0, -4, 9, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.arc(0, -4, 4, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();
}

function drawCoordinateHUD(ctx: CanvasRenderingContext2D, pose: RobotPose, h: number) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(12, h - 38, 270, 26);
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 11px "JetBrains Mono"';
  ctx.fillText(
    `X: ${pose.xM.toFixed(2)}m · Z: ${pose.zM.toFixed(2)}m · Yaw: ${(pose.yawRad * 180 / Math.PI).toFixed(0)}°`,
    20,
    h - 21
  );
}

// --------------------------------------------------------------------
// 3D ISOMETRIC RENDERER (SOLID MECHANICAL ENGINE WITH LIGHTING & SHADOWS)
// --------------------------------------------------------------------
function draw3DIsometricScene(
  ctx: CanvasRenderingContext2D,
  map: WorldMap,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  obstacles: MapObstacle[],
  sensors: SensorData,
  w: number,
  h: number,
  scale: number,
  panX: number,
  panZ: number,
  selectedComponentId?: string | null,
  orbitYawDeg: number = 0,
  selectedObstacleId?: string | null,
  showGrid: boolean = true,
  showLabels: boolean = true
) {
  // Nền phòng thí nghiệm không gian tối kỹ thuật cao
  ctx.fillStyle = '#0B132B';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2 + panX;
  const cy = h / 2 + panZ;
  const isoScale = scale * 0.82;
  const orbitRad = (orbitYawDeg * Math.PI) / 180;
  const cosO = Math.cos(orbitRad);
  const sinO = Math.sin(orbitRad);
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  const mapCenterX = (map.bounds.minX + map.bounds.maxX) / 2;
  const mapCenterZ = (map.bounds.minZ + map.bounds.maxZ) / 2;

  // Vector nguồn sáng chiếu xiên định hướng (Directional Light Vector)
  const lx0 = -0.45;
  const ly0 = 0.82;
  const lz0 = -0.35;
  const lLen = Math.sqrt(lx0 * lx0 + ly0 * ly0 + lz0 * lz0) || 1;
  const [Lx, Ly, Lz] = [lx0 / lLen, ly0 / lLen, lz0 / lLen];

  // Chiếu điểm thế giới (wx, wz, wy) sang tọa độ Isometric 2D trên màn hình
  const toIso = (wx: number, wz: number, wy: number = 0): [number, number] => {
    const rx = wx - mapCenterX;
    const rz = wz - mapCenterZ;
    const rxO = rx * cosO - rz * sinO;
    const rzO = rx * sinO + rz * cosO;
    const screenX = cx + (rxO - rzO) * cos30 * isoScale;
    const screenY = cy + (rxO + rzO) * sin30 * isoScale * 0.6 - wy * isoScale;
    return [screenX, screenY];
  };

  // Chiếu bóng đổ xiên của điểm thế giới xuống mặt sàn Y=0
  const toShadowIso = (wx: number, wz: number, wy: number): [number, number] => {
    const rx = wx - mapCenterX;
    const rz = wz - mapCenterZ;
    const shRx = rx - wy * (Lx / Ly);
    const shRz = rz - wy * (Lz / Ly);
    const rxO = shRx * cosO - shRz * sinO;
    const rzO = shRx * sinO + shRz * cosO;
    const screenX = cx + (rxO - rzO) * cos30 * isoScale;
    const screenY = cy + (rxO + rzO) * sin30 * isoScale * 0.6;
    return [screenX, screenY];
  };

  // Tính chiều sâu (Depth key) dọc theo hướng nhìn camera để sắp xếp thứ tự vẽ
  const calcDepth = (wx: number, wz: number): number => {
    const rx = wx - mapCenterX;
    const rz = wz - mapCenterZ;
    const rxO = rx * cosO - rz * sinO;
    const rzO = rx * sinO + rz * cosO;
    return rxO + rzO;
  };

  // Tính độ sáng của mặt 3D theo pháp tuyến thế giới [nx, ny, nz]
  const calcNormalIntensity = (nx: number, ny: number, nz: number): number => {
    const dot = nx * Lx + ny * Ly + nz * Lz;
    const ambient = 0.38;
    const diffuse = 0.62;
    return Math.max(0.25, Math.min(1.25, ambient + diffuse * Math.max(0, dot)));
  };

  // ----------------------------------------------------
  // 1. MẶT SÀN & LƯỚI TỌA ĐỘ 3D (FLOOR & GRID SYSTEM)
  // ----------------------------------------------------
  // Vẽ các ô gạch sàn phòng thí nghiệm (1m x 1m Modular Floor Tiles)
  const minTileX = Math.floor(map.bounds.minX);
  const maxTileX = Math.ceil(map.bounds.maxX);
  const minTileZ = Math.floor(map.bounds.minZ);
  const maxTileZ = Math.ceil(map.bounds.maxZ);

  for (let tz = minTileZ; tz < maxTileZ; tz++) {
    for (let tx = minTileX; tx < maxTileX; tx++) {
      const p1 = toIso(tx, tz, 0);
      const p2 = toIso(tx + 1, tz, 0);
      const p3 = toIso(tx + 1, tz + 1, 0);
      const p4 = toIso(tx, tz + 1, 0);

      // Xen kẽ sắc độ sàn chống nhàm chán thị giác
      const isAlt = (Math.abs(tx + tz) % 2) === 0;
      ctx.fillStyle = isAlt ? '#1E293B' : '#172236';
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.lineTo(p4[0], p4[1]);
      ctx.closePath();
      ctx.fill();

      // Chỉ mạch ron sàn
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Viền gờ an toàn bao quanh ranh giới bản đồ (Safety Perimeter Curb)
  const [b1x, b1y] = toIso(map.bounds.minX, map.bounds.minZ, 0);
  const [b2x, b2y] = toIso(map.bounds.maxX, map.bounds.minZ, 0);
  const [b3x, b3y] = toIso(map.bounds.maxX, map.bounds.maxZ, 0);
  const [b4x, b4y] = toIso(map.bounds.minX, map.bounds.maxZ, 0);

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(b1x, b1y);
  ctx.lineTo(b2x, b2y);
  ctx.lineTo(b3x, b3y);
  ctx.lineTo(b4x, b4y);
  ctx.closePath();
  ctx.stroke();

  // Lưới tọa độ 3D (3D Grid Lines)
  if (showGrid) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    // Đường song song với trục Z
    for (let gx = minTileX; gx <= maxTileX; gx++) {
      const start = toIso(gx, map.bounds.minZ, 0);
      const end = toIso(gx, map.bounds.maxZ, 0);
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.lineTo(end[0], end[1]);
      ctx.stroke();
    }
    // Đường song song với trục X
    for (let gz = minTileZ; gz <= maxTileZ; gz++) {
      const start = toIso(map.bounds.minX, gz, 0);
      const end = toIso(map.bounds.maxX, gz, 0);
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.lineTo(end[0], end[1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Trục tọa độ thế giới 3D tại gốc (0, 0, 0)
  const oPt = toIso(0, 0, 0);
  const xPt = toIso(1.0, 0, 0);
  const zPt = toIso(0, 1.0, 0);
  const yPt = toIso(0, 0, 0.6);

  ctx.save();
  // Trục +X (Đỏ - East)
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(oPt[0], oPt[1]);
  ctx.lineTo(xPt[0], xPt[1]);
  ctx.stroke();
  ctx.fillStyle = '#EF4444';
  ctx.font = 'bold 9px "JetBrains Mono"';
  ctx.fillText('+X (East)', xPt[0] + 4, xPt[1]);

  // Trục +Z (Xanh lam - North)
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(oPt[0], oPt[1]);
  ctx.lineTo(zPt[0], zPt[1]);
  ctx.stroke();
  ctx.fillStyle = '#3B82F6';
  ctx.fillText('+Z (North)', zPt[0] + 4, zPt[1]);

  // Trục +Y (Xanh lục - Cao độ Up)
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(oPt[0], oPt[1]);
  ctx.lineTo(yPt[0], yPt[1]);
  ctx.stroke();
  ctx.fillStyle = '#10B981';
  ctx.fillText('+Y (Up)', yPt[0] + 4, yPt[1]);

  // Điểm tâm gốc (0, 0)
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.arc(oPt[0], oPt[1], 3.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // Dải làn đường mô phỏng nếu có (Lane ribbon in 3D)
  if (map.lanePoints && map.lanePoints.length >= 2) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    map.lanePoints.forEach((lp, idx) => {
      const p = toIso(lp.xM, lp.zM, 0.002);
      if (idx === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ----------------------------------------------------
  // 2. BÓNG ĐỔ DƯỚI MẶT SÀN (GROUND SHADOW LAYER)
  // ----------------------------------------------------
  // Vẽ bóng tiếp xúc (Contact AO) và bóng xiên của tất cả vật cản
  obstacles.forEach(obs => {
    if (obs.enabled === false) return;
    const hw = (obs.widthM || 0.8) / 2;
    const hd = (obs.depthM || 0.8) / 2;
    const hM = obs.heightM || 0.4;

    // Bóng tiếp xúc chân đế
    const c1 = toIso(obs.xM - hw, obs.zM - hd, 0.001);
    const c2 = toIso(obs.xM + hw, obs.zM - hd, 0.001);
    const c3 = toIso(obs.xM + hw, obs.zM + hd, 0.001);
    const c4 = toIso(obs.xM - hw, obs.zM + hd, 0.001);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.52)';
    ctx.beginPath();
    ctx.moveTo(c1[0], c1[1]);
    ctx.lineTo(c2[0], c2[1]);
    ctx.lineTo(c3[0], c3[1]);
    ctx.lineTo(c4[0], c4[1]);
    ctx.closePath();
    ctx.fill();

    // Bóng xiên chiếu từ đỉnh xuống mặt sàn
    const s1 = toShadowIso(obs.xM - hw, obs.zM - hd, hM);
    const s2 = toShadowIso(obs.xM + hw, obs.zM - hd, hM);
    const s3 = toShadowIso(obs.xM + hw, obs.zM + hd, hM);
    const s4 = toShadowIso(obs.xM - hw, obs.zM + hd, hM);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
    ctx.beginPath();
    ctx.moveTo(c1[0], c1[1]);
    ctx.lineTo(s1[0], s1[1]);
    ctx.lineTo(s2[0], s2[1]);
    ctx.lineTo(s3[0], s3[1]);
    ctx.lineTo(c3[0], c3[1]);
    ctx.closePath();
    ctx.fill();
  });

  // ----------------------------------------------------
  // 3. THU THẬP & SẮP XẾP ĐỐI TƯỢNG 3D (DEPTH SORTING)
  // ----------------------------------------------------
  interface RenderableItem {
    type: 'obstacle' | 'robot' | 'marker' | 'waypoint';
    depth: number;
    data?: any;
  }

  const renderQueue: RenderableItem[] = [];

  // Thêm các vật cản vào hàng đợi
  obstacles.forEach(obs => {
    if (obs.enabled === false) return;
    renderQueue.push({
      type: 'obstacle',
      depth: calcDepth(obs.xM, obs.zM),
      data: obs,
    });
  });

  // Thêm AprilTag Markers vào hàng đợi
  if (map.markers) {
    map.markers.forEach(m => {
      renderQueue.push({
        type: 'marker',
        depth: calcDepth(m.xM, m.zM),
        data: m,
      });
    });
  }

  // Thêm Waypoints vào hàng đợi
  if (map.waypoints) {
    map.waypoints.forEach((wp, wIdx) => {
      renderQueue.push({
        type: 'waypoint',
        depth: calcDepth(wp.xM, wp.zM),
        data: { wp, index: wIdx + 1 },
      });
    });
  }

  // Thêm Robot vào hàng đợi
  renderQueue.push({
    type: 'robot',
    depth: calcDepth(pose.xM, pose.zM),
  });

  // Sắp xếp thứ tự từ xa tới gần (Painter's Algorithm)
  renderQueue.sort((a, b) => a.depth - b.depth);

  // ----------------------------------------------------
  // 4. VẼ CÁC ĐỐI TƯỢNG 3D THEO THỨ TỰ CHIỀU SÂU
  // ----------------------------------------------------
  renderQueue.forEach(item => {
    // --------------------------------------------------
    // A. VẼ VẬT CẢN THỂ TÍCH 3D (SOLID 3D OBSTACLES)
    // --------------------------------------------------
    if (item.type === 'obstacle') {
      const obs = item.data as MapObstacle;
      const isSelected = obs.id === selectedObstacleId;
      const hw = (obs.widthM || 0.8) / 2;
      const hd = (obs.depthM || 0.8) / 2;
      const hM = obs.heightM || 0.4;
      const baseCol = obs.color || (obs.type === 'wall' ? '#475569' : '#F97316');

      // VẬT CẢN HÌNH TRỤ TRÒN (Cylindrical Obstacles / Pillars)
      if (obs.type === 'circle' || obs.radiusM) {
        const rad = obs.radiusM || hw;
        const numFacets = 16;
        const botPts: [number, number][] = [];
        const topPts: [number, number][] = [];

        for (let i = 0; i <= numFacets; i++) {
          const ang = (i / numFacets) * 2 * Math.PI;
          const px = obs.xM + rad * Math.cos(ang);
          const pz = obs.zM + rad * Math.sin(ang);
          botPts.push(toIso(px, pz, 0));
          topPts.push(toIso(px, pz, hM));
        }

        // Vẽ các nan thân trụ có diffuse shading
        for (let i = 0; i < numFacets; i++) {
          const angMid = ((i + 0.5) / numFacets) * 2 * Math.PI;
          const nx = Math.cos(angMid);
          const nz = Math.sin(angMid);
          const intensity = calcNormalIntensity(nx, 0, nz);
          ctx.fillStyle = shadeColor(baseCol, isSelected ? Math.max(1.0, intensity) : intensity);
          ctx.strokeStyle = isSelected ? '#FBBF24' : '#0F172A';
          ctx.lineWidth = isSelected ? 1.5 : 0.8;
          ctx.beginPath();
          ctx.moveTo(botPts[i][0], botPts[i][1]);
          ctx.lineTo(botPts[i + 1][0], botPts[i + 1][1]);
          ctx.lineTo(topPts[i + 1][0], topPts[i + 1][1]);
          ctx.lineTo(topPts[i][0], topPts[i][1]);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Mặt nắp trên trụ tròn
        const topInt = calcNormalIntensity(0, 1, 0);
        ctx.fillStyle = shadeColor(baseCol, isSelected ? 1.15 : topInt);
        ctx.strokeStyle = isSelected ? '#FBBF24' : '#0F172A';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        topPts.forEach((tp, tIdx) => {
          if (tIdx === 0) ctx.moveTo(tp[0], tp[1]);
          else ctx.lineTo(tp[0], tp[1]);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // VẬT CẢN HÌNH HỘP / TƯỜNG / CỬA (Box, Wall & Door)
      else {
        // Tọa độ 8 đỉnh hình hộp
        const [b1x, b1y] = toIso(obs.xM - hw, obs.zM - hd, 0);
        const [b2x, b2y] = toIso(obs.xM + hw, obs.zM - hd, 0);
        const [b3x, b3y] = toIso(obs.xM + hw, obs.zM + hd, 0);
        const [b4x, b4y] = toIso(obs.xM - hw, obs.zM + hd, 0);

        const [t1x, t1y] = toIso(obs.xM - hw, obs.zM - hd, hM);
        const [t2x, t2y] = toIso(obs.xM + hw, obs.zM - hd, hM);
        const [t3x, t3y] = toIso(obs.xM + hw, obs.zM + hd, hM);
        const [t4x, t4y] = toIso(obs.xM - hw, obs.zM + hd, hM);

        ctx.save();
        ctx.lineWidth = isSelected ? 2.5 : 1.0;
        ctx.strokeStyle = isSelected ? '#FBBF24' : '#0F172A';

        // 1. Mặt trước (+Z)
        const intFront = calcNormalIntensity(0, 0, 1);
        ctx.fillStyle = shadeColor(baseCol, isSelected ? Math.max(1.0, intFront) : intFront);
        ctx.beginPath();
        ctx.moveTo(b4x, b4y);
        ctx.lineTo(b3x, b3y);
        ctx.lineTo(t3x, t3y);
        ctx.lineTo(t4x, t4y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Mặt bên phải (+X)
        const intRight = calcNormalIntensity(1, 0, 0);
        ctx.fillStyle = shadeColor(baseCol, isSelected ? Math.max(1.0, intRight) : intRight);
        ctx.beginPath();
        ctx.moveTo(b2x, b2y);
        ctx.lineTo(b3x, b3y);
        ctx.lineTo(t3x, t3y);
        ctx.lineTo(t2x, t2y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Mặt trên cùng (+Y)
        const intTop = calcNormalIntensity(0, 1, 0);
        ctx.fillStyle = shadeColor(baseCol, isSelected ? 1.20 : intTop);
        ctx.beginPath();
        ctx.moveTo(t1x, t1y);
        ctx.lineTo(t2x, t2y);
        ctx.lineTo(t3x, t3y);
        ctx.lineTo(t4x, t4y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đường vát cạnh nổi khối (Beveled Highlight Edge)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(t4x, t4y);
        ctx.lineTo(t3x, t3y);
        ctx.lineTo(t2x, t2y);
        ctx.stroke();

        // Vạch cảnh báo an toàn cho kệ hàng / vật cản kho (Hazard Stripes)
        if (obs.type === 'box' && !isSelected && hM >= 0.3) {
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(t4x, t4y - 1);
          ctx.lineTo(t3x, t3y - 1);
          ctx.stroke();
        }

        ctx.restore();
      }

      // HIỆU ỨNG KHI ĐƯỢC CHỌN (Selection Indicator & HUD Tag)
      if (isSelected) {
        const [tcx, tcy] = toIso(obs.xM, obs.zM, hM + 0.15);
        // Vòng ngắm nhắm chọn trên sàn
        const [bcx, bcy] = toIso(obs.xM, obs.zM, 0.005);
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(bcx, bcy, (hw + 0.15) * isoScale * 0.8, (hd + 0.15) * isoScale * 0.45, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // Thẻ thông tin nổi 3D (Floating Holographic Tag)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.roundRect(tcx - 65, tcy - 30, 130, 26, 6);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(obs.name || obs.id, tcx, tcy - 14);
        ctx.restore();
      }

      // Nhãn tên vật cản thường
      else if (showLabels && obs.name) {
        const [tcx, tcy] = toIso(obs.xM, obs.zM, hM + 0.08);
        ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
        ctx.font = '9px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(obs.name, tcx, tcy);
      }
    }

    // --------------------------------------------------
    // B. VẼ APRILTAG MARKERS TRONG KHÔNG GIAN 3D
    // --------------------------------------------------
    else if (item.type === 'marker') {
      const marker = item.data;
      const szM = marker.sizeM || 0.15;
      const [mx, my] = toIso(marker.xM, marker.zM, 0.12);
      const [bx, by] = toIso(marker.xM, marker.zM, 0.001);

      ctx.save();
      // Cọc đỡ biển AprilTag
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(mx, my);
      ctx.stroke();

      // Bảng AprilTag vuông
      const tagPx = szM * isoScale * 1.2;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(mx - tagPx / 2, my - tagPx / 2, tagPx, tagPx);
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx - tagPx / 2, my - tagPx / 2, tagPx, tagPx);

      // Lưới ma trận AprilTag
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(mx - tagPx * 0.35, my - tagPx * 0.35, tagPx * 0.7, tagPx * 0.7);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(mx - tagPx * 0.18, my - tagPx * 0.18, tagPx * 0.36, tagPx * 0.36);

      // Nhãn ID
      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 9px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(`TAG #${marker.id}`, mx, my - tagPx / 2 - 4);
      ctx.restore();
    }

    // --------------------------------------------------
    // C. VẼ WAYPOINTS TRONG KHÔNG GIAN 3D
    // --------------------------------------------------
    else if (item.type === 'waypoint') {
      const { wp, index } = item.data;
      const [wx, wy] = toIso(wp.xM, wp.zM, 0.002);
      ctx.save();
      // Vòng tròn holographic trên sàn
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(wx, wy, 16, 9, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // Cột phát quang thẳng đứng
      const [tx, ty] = toIso(wp.xM, wp.zM, 0.35);
      const grad = ctx.createLinearGradient(wx, wy, tx, ty);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Huy hiệu số thứ tự Waypoint
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(tx, ty, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 8px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(`${index}`, tx, ty + 3);
      ctx.restore();
    }

    // --------------------------------------------------
    // D. VẼ ROBOT CƠ KHÍ 3D SOLID HOÀN CHỈNH
    // --------------------------------------------------
    else if (item.type === 'robot') {
      const [rx, ry] = toIso(pose.xM, pose.zM, 0);
      drawTrackedRobot3DIsometric(
        ctx,
        pose,
        kin,
        dev,
        sensors,
        rx,
        ry,
        isoScale,
        selectedComponentId,
        {
          orbitYawRad: orbitRad,
          showShadow: true,
        }
      );
    }
  });

  // ----------------------------------------------------
  // 5. OVERLAY HUD CHIẾN THUẬT GÓC NHÌN 3D
  // ----------------------------------------------------
  ctx.save();
  // Khung tiêu đề bên trái
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.roundRect(14, 62, 310, 56, 8);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 12px "JetBrains Mono"';
  ctx.textAlign = 'left';
  ctx.fillText('3D TOÀN CẢNH (CMU10 SOLID 3D KINEMATICS ENGINE)', 24, 82);

  ctx.font = '10px "JetBrains Mono"';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText(
    `Robot: (${pose.xM.toFixed(2)}m, ${pose.zM.toFixed(2)}m) · Yaw: ${(pose.yawRad * 180 / Math.PI).toFixed(1)}°`,
    24, 98
  );
  ctx.fillText(
    `Orbit: ${orbitYawDeg.toFixed(0)}° · Cự ly trước: ${sensors.frontRangeM.toFixed(2)}m`,
    24, 111
  );

  ctx.restore();
}

// --------------------------------------------------------------------
// CHASE CAMERA RENDERER (Perspective Behind Robot)
// --------------------------------------------------------------------
function drawChaseCameraScene(
  ctx: CanvasRenderingContext2D,
  map: WorldMap,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  obstacles: MapObstacle[],
  sensors: SensorData,
  w: number,
  h: number,
  timeMs: number,
  selectedComponentId?: string | null
) {
  // Điểm đặt camera: lùi sau 1.5m, nâng cao 0.75m theo hướng di chuyển của robot
  const chaseDist = 1.5;
  const camX = pose.xM - chaseDist * Math.sin(pose.yawRad);
  const camZ = pose.zM - chaseDist * Math.cos(pose.yawRad);
  const camY = 0.75;
  const camYaw = pose.yawRad;

  // Bầu trời & Không gian tối kỹ thuật
  ctx.fillStyle = '#0B132B';
  ctx.fillRect(0, 0, w, h);

  // Đường chân trời (Horizon Line)
  const horizonY = h * 0.44;
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, horizonY, w, h - horizonY);

  const fx = 520;
  const cx = w / 2;
  const cy = horizonY;

  // Chiếu phối cảnh từ camera đuôi xe sang màn hình 2D
  const toChaseScreen = (wx: number, wz: number, wy: number = 0): [number, number, number] => {
    const dx = wx - camX;
    const dz = wz - camZ;
    const xRel = dx * Math.cos(camYaw) - dz * Math.sin(camYaw);
    const zRel = dx * Math.sin(camYaw) + dz * Math.cos(camYaw);
    const yRel = wy - camY;
    const zSafe = Math.max(0.12, zRel);
    return [cx + (xRel / zSafe) * fx, cy - (yRel / zSafe) * fx, zRel];
  };

  // Lưới sàn phối cảnh hướng về chân trời
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.lineWidth = 1;
  for (let zGrid = 0.5; zGrid <= 8.0; zGrid += 0.8) {
    const leftPt = toChaseScreen(pose.xM - 3.5, pose.zM + zGrid, 0);
    const rightPt = toChaseScreen(pose.xM + 3.5, pose.zM + zGrid, 0);
    if (leftPt[2] > 0.2 && rightPt[2] > 0.2) {
      ctx.beginPath();
      ctx.moveTo(leftPt[0], leftPt[1]);
      ctx.lineTo(rightPt[0], rightPt[1]);
      ctx.stroke();
    }
  }
  for (let xGrid = -3.0; xGrid <= 3.0; xGrid += 1.0) {
    const pFar = toChaseScreen(pose.xM + xGrid, pose.zM + 8.0, 0);
    const pNear = toChaseScreen(pose.xM + xGrid, pose.zM + 0.3, 0);
    if (pFar[2] > 0.2 && pNear[2] > 0.2) {
      ctx.beginPath();
      ctx.moveTo(pNear[0], pNear[1]);
      ctx.lineTo(pFar[0], pFar[1]);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Vẽ các vật cản 3D trong tầm nhìn camera đuôi xe
  const visibleObs = obstacles
    .filter(obs => obs.enabled !== false)
    .map(obs => {
      const [ox, oy, oz] = toChaseScreen(obs.xM, obs.zM, 0);
      return { obs, ox, oy, oz };
    })
    .filter(item => item.oz > 0.25 && item.oz < 10.0)
    .sort((a, b) => b.oz - a.oz); // Xa trước, gần sau

  visibleObs.forEach(({ obs, ox, oy, oz }) => {
    const hw = (obs.widthM || 0.8) / 2;
    const hd = (obs.depthM || 0.8) / 2;
    const hM = obs.heightM || 0.4;
    const baseCol = obs.color || '#F97316';

    const [b1x, b1y] = toChaseScreen(obs.xM - hw, obs.zM - hd, 0);
    const [b2x, b2y] = toChaseScreen(obs.xM + hw, obs.zM - hd, 0);
    const [b3x, b3y] = toChaseScreen(obs.xM + hw, obs.zM + hd, 0);
    const [b4x, b4y] = toChaseScreen(obs.xM - hw, obs.zM + hd, 0);

    const [t1x, t1y] = toChaseScreen(obs.xM - hw, obs.zM - hd, hM);
    const [t2x, t2y] = toChaseScreen(obs.xM + hw, obs.zM - hd, hM);
    const [t3x, t3y] = toChaseScreen(obs.xM + hw, obs.zM + hd, hM);
    const [t4x, t4y] = toChaseScreen(obs.xM - hw, obs.zM + hd, hM);

    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#0F172A';

    // Mặt trước hướng về xe
    ctx.fillStyle = shadeColor(baseCol, 0.75);
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.lineTo(b2x, b2y);
    ctx.lineTo(t2x, t2y);
    ctx.lineTo(t1x, t1y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mặt bên
    ctx.fillStyle = shadeColor(baseCol, 0.55);
    ctx.beginPath();
    ctx.moveTo(b2x, b2y);
    ctx.lineTo(b3x, b3y);
    ctx.lineTo(t3x, t3y);
    ctx.lineTo(t2x, t2y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mặt trên
    ctx.fillStyle = shadeColor(baseCol, 1.05);
    ctx.beginPath();
    ctx.moveTo(t1x, t1y);
    ctx.lineTo(t2x, t2y);
    ctx.lineTo(t3x, t3y);
    ctx.lineTo(t4x, t4y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  });

  // Vẽ mô hình 3D xe xích từ góc nhìn bám đuôi
  drawChaseCamRobot3D(ctx, pose, kin, dev, w, h, selectedComponentId);

  // HUD buồng lái chiến thuật (Tactical Chase HUD)
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.roundRect(14, 62, 300, 52, 8);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 12px "JetBrains Mono"';
  ctx.fillText('CAMERA BÁM THEO ĐUÔI ROBOT (3D CHASE VIEW)', 24, 82);

  ctx.font = '10px "JetBrains Mono"';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText(
    `Vận tốc: ${kin.linearSpeedMps.toFixed(2)} m/s · Khoảng cách trước: ${sensors.frontRangeM.toFixed(2)} m`,
    24, 100
  );
  ctx.restore();
}

// --------------------------------------------------------------------
// FIRST PERSON SCENE (Inside Canvas view)
// --------------------------------------------------------------------
function drawFirstPersonScene(
  ctx: CanvasRenderingContext2D,
  map: WorldMap,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  obstacles: MapObstacle[],
  sensors: SensorData,
  w: number,
  h: number
) {
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, h * 0.5, w, h * 0.5);

  drawFirstPersonCockpitHUD(ctx, pose, kin, dev, sensors, w, h);
}

// --------------------------------------------------------------------
// SIDE PROFILE VIEW (Ground clearance, wheel contact)
// --------------------------------------------------------------------
function drawSideProfileScene(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  obstacles: MapObstacle[],
  sensors: SensorData,
  w: number,
  h: number,
  scale: number
) {
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, w, h);

  const floorY = h * 0.65;
  const pScale = Math.max(120, scale * 1.5);

  // Floor Ground Line
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(w, floorY);
  ctx.stroke();

  // Ground contact hatch lines
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x - 12, floorY + 12);
    ctx.stroke();
  }

  // Robot Side Profile (Length = 0.32m, Height = 0.12m, Wheel R = 0.035m)
  const rcX = w / 2;
  const rL = 0.32 * pScale;
  const rH = 0.12 * pScale;
  const wheelR = 0.035 * pScale;

  // 4 Road wheels + Sprocket & Idler wheel touching ground (y=0)
  ctx.fillStyle = '#1E293B';
  const numWheels = 4;
  for (let i = 0; i < numWheels; i++) {
    const wx = rcX - rL / 2 + 20 + i * ((rL - 40) / (numWheels - 1));
    const wy = floorY - wheelR;
    ctx.beginPath();
    ctx.arc(wx, wy, wheelR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.stroke();
  }

  // Track loop profile
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(rcX - rL / 2 - 4, floorY - wheelR * 2 - 2, rL + 8, wheelR * 2 + 4, 8);
  ctx.stroke();

  // Chassis deck
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(rcX - rL / 2 + 10, floorY - rH - wheelR, rL - 20, rH);
  ctx.strokeStyle = '#1D4ED8';
  ctx.strokeRect(rcX - rL / 2 + 10, floorY - rH - wheelR, rL - 20, rH);

  // LIDAR puck on top
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(rcX - 14, floorY - rH - wheelR - 18, 28, 18);

  // Technical Dimension Callouts
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 1.5;
  // Height dimension line
  ctx.beginPath();
  ctx.moveTo(rcX - rL / 2 - 30, floorY);
  ctx.lineTo(rcX - rL / 2 - 30, floorY - rH - wheelR);
  ctx.stroke();

  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 11px "JetBrains Mono"';
  ctx.fillText('Cao: 0.12m', rcX - rL / 2 - 105, floorY - rH / 2);
  ctx.fillText('Khoảng sáng gầm: 0.035m', rcX + 20, floorY - 8);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 13px "JetBrains Mono"';
  ctx.fillText('GÓC NHÌN NGANG CHIẾU CẠNH (SIDE PROFILE INSPECTOR)', 16, 68);
}

// --------------------------------------------------------------------
// INSPECTOR DETAILED COMPONENT VIEW
// --------------------------------------------------------------------
function drawInspectorView(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  sensors: SensorData,
  w: number,
  h: number,
  timeMs: number
) {
  ctx.fillStyle = '#0B132B';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const zoomScale = 380; // High zoom for inspection

  // Draw enlarged tracked robot
  drawTrackedRobot2D(ctx, { xM: 0, zM: 0, yM: 0, yawRad: 0 }, kin, dev, cx, cy, zoomScale, true);

  // Component Technical Callouts
  const callouts = [
    { text: '1. Tháp Cảm Biến RPLIDAR A1 360°', x: cx + 80, y: cy - 70 },
    { text: '2. Dải Xích & Bánh Lăn (Track Assembly)', x: cx + 110, y: cy + 30 },
    { text: '3. Camera CSI IMX219 (Gimbal Servo)', x: cx - 220, y: cy - 80 },
    { text: '4. Đèn LED Trạng Thái RGB (Pin 11/13/23)', x: cx - 220, y: cy + 60 },
  ];

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 11px "JetBrains Mono"';

  callouts.forEach(c => {
    ctx.fillText(c.text, c.x, c.y);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.arc(c.x - 8, c.y - 4, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px "JetBrains Mono"';
  ctx.fillText('CHẾ ĐỘ PHÓNG TO CHI TIẾT LINH KIỆN ROBOT (COMPONENT INSPECTOR)', 16, 68);
  ctx.font = '11px "JetBrains Mono"';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Kích thước chuẩn: Dài 0.32m × Rộng 0.22m × Cao 0.12m · Trục xích 0.20m', 16, 88);
}
