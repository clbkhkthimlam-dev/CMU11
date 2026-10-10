import React, { useRef, useEffect, useState } from 'react';
import { RobotPose, SensorData, DeviceState } from '../types/robot';
import { WorldMap } from '../types/map';
import { Camera, Eye, Sliders, Check, Maximize2 } from 'lucide-react';

interface RobotPOVCameraProps {
  pose: RobotPose;
  sensors: SensorData;
  deviceState: DeviceState;
  map: WorldMap;
  isSimulating: boolean;
}

export const RobotPOVCamera: React.FC<RobotPOVCameraProps> = ({
  pose,
  sensors,
  deviceState,
  map,
  isSimulating,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(true);
  const [showHud, setShowHud] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Camera Intrinsic parameters (from Tiet 26-27 calibration)
    const fx = 620.0;
    const fy = 620.0;
    const cx = width / 2;
    const cy = height / 2;

    const effectiveYaw = pose.yawRad + deviceState.servoPanRad;
    const effectiveTilt = deviceState.servoTiltRad;

    // 1. Clear background (Ceiling / upper sky and floor)
    const horizonY = cy + Math.tan(effectiveTilt) * fy;

    // Ceiling gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#0F172A');
    skyGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, Math.max(0, horizonY));

    // Floor gradient
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    floorGrad.addColorStop(0, '#334155');
    floorGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, Math.max(0, horizonY), width, height - Math.max(0, horizonY));

    // Floor perspective grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    // Perspective lines emanating from vanishing point
    for (let x = -8; x <= 8; x += 1.0) {
      const pz = 5.0;
      const px = x;
      // World to camera transform
      const dx = px;
      const dz = pz;
      const screenX = cx + (dx / dz) * fx;
      ctx.beginPath();
      ctx.moveTo(cx, horizonY);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }

    // Horizontal depth lines on floor
    for (let z = 0.5; z <= 6.0; z += 0.5) {
      const yScreen = horizonY + (0.25 / z) * fy; // height of camera ~0.25m
      if (yScreen > horizonY && yScreen < height) {
        ctx.beginPath();
        ctx.moveTo(0, yScreen);
        ctx.lineTo(width, yScreen);
        ctx.stroke();
      }
    }

    // 2. Render visible obstacles in camera frame
    const camX = pose.xM;
    const camZ = pose.zM;
    const cosY = Math.cos(effectiveYaw);
    const sinY = Math.sin(effectiveYaw);

    interface RenderObject {
      depthZ: number;
      draw: () => void;
    }
    const renderQueue: RenderObject[] = [];

    // Helper: transform world point (x, z, y) to camera coords (camX, camY, camZ)
    const worldToCamera = (wx: number, wz: number, wy: number) => {
      const relX = wx - camX;
      const relZ = wz - camZ;
      // Rotate by -effectiveYaw
      const xCam = relX * cosY - relZ * sinY;
      const zCam = relX * sinY + relZ * cosY;
      const yCam = wy - 0.12 + effectiveTilt * zCam;
      return { xCam, zCam, yCam };
    };

    // Render Box Obstacles
    for (const obs of map.obstacles) {
      const hw = obs.widthM / 2;
      const hd = obs.depthM / 2;
      const corners = [
        [obs.xM - hw, obs.zM - hd],
        [obs.xM + hw, obs.zM - hd],
        [obs.xM + hw, obs.zM + hd],
        [obs.xM - hw, obs.zM + hd],
      ];

      // Transform corners
      const camCorners = corners.map(([x, z]) => worldToCamera(x, z, 0));
      // Average depth
      const avgZ = camCorners.reduce((sum, c) => sum + c.zCam, 0) / 4;

      if (avgZ > 0.1 && avgZ < 8.0) {
        renderQueue.push({
          depthZ: avgZ,
          draw: () => {
            const screenPts = camCorners.map(c => {
              const zSafe = Math.max(0.1, c.zCam);
              return {
                x: cx + (c.xCam / zSafe) * fx,
                yBottom: horizonY + ((0.12) / zSafe) * fy,
                yTop: horizonY - ((obs.heightM - 0.12) / zSafe) * fy,
              };
            });

            // Draw bounding quadrilateral for obstacle face
            ctx.fillStyle = obs.color || '#F97316';
            ctx.strokeStyle = '#0F172A';
            ctx.lineWidth = 1.5;

            // Simple front face projection
            const minX = Math.min(...screenPts.map(p => p.x));
            const maxX = Math.max(...screenPts.map(p => p.x));
            const minY = Math.min(...screenPts.map(p => p.yTop));
            const maxY = Math.max(...screenPts.map(p => p.yBottom));

            if (maxX > 0 && minX < width && maxY > 0 && minY < height) {
              const shade = Math.max(0.3, Math.min(1.0, 1.2 - avgZ / 5.0));
              ctx.globalAlpha = 0.95;
              ctx.fillStyle = obs.color || '#2563EB';
              ctx.beginPath();
              ctx.roundRect(minX, minY, maxX - minX, maxY - minY, 4);
              ctx.fill();
              ctx.stroke();

              // Darker top cap
              ctx.fillStyle = 'rgba(0,0,0,0.2)';
              ctx.fillRect(minX, minY, maxX - minX, Math.min(12, (maxY - minY) * 0.2));
              ctx.globalAlpha = 1.0;
            }
          },
        });
      }
    }

    // Render AprilTags on walls/markers
    for (const marker of map.markers) {
      const camP = worldToCamera(marker.xM, marker.zM, 0.15);
      if (camP.zCam > 0.15 && camP.zCam < 5.0) {
        renderQueue.push({
          depthZ: camP.zCam,
          draw: () => {
            const zSafe = camP.zCam;
            const sx = cx + (camP.xCam / zSafe) * fx;
            const sy = cy - (camP.yCam / zSafe) * fy;
            const tagSizePx = (marker.sizeM / zSafe) * fx;

            if (sx > -tagSizePx && sx < width + tagSizePx && sy > -tagSizePx && sy < height + tagSizePx) {
              const half = tagSizePx / 2;

              // White border
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(sx - half, sy - half, tagSizePx, tagSizePx);

              // Black outer frame
              const border = tagSizePx * 0.12;
              ctx.fillStyle = '#000000';
              ctx.fillRect(sx - half + border, sy - half + border, tagSizePx - 2 * border, tagSizePx - 2 * border);

              // White inner field
              const innerPad = tagSizePx * 0.22;
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(sx - half + innerPad, sy - half + innerPad, tagSizePx - 2 * innerPad, tagSizePx - 2 * innerPad);

              // Distinctive Tag ID pattern bits
              ctx.fillStyle = '#000000';
              const bitSize = (tagSizePx - 2 * innerPad) / 4;
              // Unique pattern based on marker ID
              if (marker.id === 0) {
                ctx.fillRect(sx - half + innerPad + bitSize, sy - half + innerPad + bitSize, bitSize * 2, bitSize * 2);
              } else if (marker.id === 1) {
                ctx.fillRect(sx - half + innerPad, sy - half + innerPad, bitSize * 2, bitSize * 2);
                ctx.fillRect(sx - half + innerPad + bitSize * 2, sy - half + innerPad + bitSize * 2, bitSize * 2, bitSize * 2);
              } else if (marker.id === 2) {
                ctx.fillRect(sx - half + innerPad, sy - half + innerPad + bitSize * 2, bitSize * 2, bitSize * 2);
                ctx.fillRect(sx - half + innerPad + bitSize * 2, sy - half + innerPad, bitSize * 2, bitSize * 2);
              } else {
                ctx.fillRect(sx - half + innerPad + bitSize, sy - half + innerPad, bitSize * 2, bitSize * 3);
              }

              // ID badge
              ctx.fillStyle = '#22C55E';
              ctx.font = 'bold 12px "JetBrains Mono"';
              ctx.fillText(`TAG ${marker.id}`, sx - 18, sy - half - 6);
            }
          },
        });
      }
    }

    // Sort back-to-front (Painter's algorithm)
    renderQueue.sort((a, b) => b.depthZ - a.depthZ);
    for (const obj of renderQueue) {
      obj.draw();
    }

    // 3. AprilTag Perception Detection Overlays (Bounding Boxes & SolvePnP Data)
    if (sensors.detectedTags.length > 0) {
      for (const det of sensors.detectedTags) {
        const [c0, c1, c2, c3] = det.cornersPx;
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(c0[0], c0[1]);
        ctx.lineTo(c1[0], c1[1]);
        ctx.lineTo(c2[0], c2[1]);
        ctx.lineTo(c3[0], c3[1]);
        ctx.closePath();
        ctx.stroke();

        // Tag Center Point
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(det.centerPx[0], det.centerPx[1], 4, 0, 2 * Math.PI);
        ctx.fill();

        // Tag Label Box
        const labelText = `id=${det.id} | z=${det.zM.toFixed(2)}m | x=${det.xM > 0 ? '+' : ''}${det.xM.toFixed(2)}m`;
        ctx.font = 'bold 12px "JetBrains Mono"';
        const textWidth = ctx.measureText(labelText).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(det.centerPx[0] - textWidth / 2 - 6, c0[1] - 26, textWidth + 12, 20);
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(labelText, det.centerPx[0] - textWidth / 2, c0[1] - 12);
      }
    }

    // 4. Camera HUD Crosshair & Overlays
    if (showHud) {
      // Crosshair Center
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy);
      ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16);
      ctx.lineTo(cx, cy + 16);
      ctx.stroke();

      // Top Info Banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(10, 10, 260, 46);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(10, 10, 260, 46);

      ctx.font = 'bold 11px "JetBrains Mono"';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('CAM0: CSI SONY IMX219 (640x480)', 18, 28);
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`FPS: 30.0 · Pan: ${(deviceState.servoPanRad * 180 / Math.PI).toFixed(1)}° · ${isCalibrated ? 'CALIBRATED' : 'RAW'}`, 18, 46);
    }
  }, [pose, sensors, deviceState, map, isCalibrated, showHud]);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 flex flex-col">
      {/* Viewport Top Bar */}
      <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Góc Nhìn Camera Robot (Robot POV 3D)
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
            LIVE 30 FPS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCalibrated(!isCalibrated)}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
              isCalibrated
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'bg-slate-800 text-slate-400'
            }`}
            title="Bật/tắt khử méo hình ảnh theo ma trận K trong camera_calibration.json"
          >
            {isCalibrated ? 'Đã Khử Méo (K, dist)' : 'Ảnh Gốc (Raw)'}
          </button>
          <button
            onClick={() => setShowHud(!showHud)}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              showHud ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Ẩn/hiện HUD ngắm tâm & thông số"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Perspective Render Canvas */}
      <div className="relative aspect-4/3 w-full bg-black flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />

        {/* Live Detection Bottom Tag */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 bg-slate-950/80 backdrop-blur-xs rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">AprilTag Perception:</span>
            {sensors.detectedTags.length > 0 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Phát hiện {sensors.detectedTags.length} tag (ID: {sensors.detectedTags.map(t => t.id).join(', ')})
              </span>
            ) : (
              <span className="text-slate-500">Không có tag trong tầm nhìn</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            z={sensors.frontRangeM.toFixed(2)}m
          </span>
        </div>
      </div>
    </div>
  );
};
