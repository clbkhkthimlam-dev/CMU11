import { MapBounds } from '../types/map';
import { SafetyState, RobotKinematics } from '../types/robot';

/**
 * Projects physical world coordinates (meters) to canvas screen pixels
 */
export function projectWorldToCanvas(
  xM: number,
  zM: number,
  bounds: MapBounds,
  fitScale: number,
  zoom: number,
  panX: number,
  panZ: number,
  canvasWidth: number,
  canvasHeight: number
): [number, number] {
  const totalScale = fitScale * zoom;
  const mapCenterX = (bounds.minX + bounds.maxX) / 2;
  const mapCenterZ = (bounds.minZ + bounds.maxZ) / 2;
  const originCanvasX = canvasWidth / 2 + panX;
  const originCanvasY = canvasHeight / 2 + panZ;

  const px = originCanvasX + (xM - mapCenterX) * totalScale;
  const py = originCanvasY - (zM - mapCenterZ) * totalScale;
  return [px, py];
}

/**
 * Unprojects canvas screen pixels back to physical world coordinates (meters)
 */
export function unprojectCanvasToWorld(
  px: number,
  py: number,
  bounds: MapBounds,
  fitScale: number,
  zoom: number,
  panX: number,
  panZ: number,
  canvasWidth: number,
  canvasHeight: number
): [number, number] {
  const totalScale = fitScale * zoom;
  const mapCenterX = (bounds.minX + bounds.maxX) / 2;
  const mapCenterZ = (bounds.minZ + bounds.maxZ) / 2;
  const originCanvasX = canvasWidth / 2 + panX;
  const originCanvasY = canvasHeight / 2 + panZ;

  const xM = mapCenterX + (px - originCanvasX) / totalScale;
  const zM = mapCenterZ - (py - originCanvasY) / totalScale;
  return [xM, zM];
}

/**
 * Computes optimal fit scale so the entire map bounding box fits inside canvas with padding
 */
export function computeFitScale(
  canvasWidth: number,
  canvasHeight: number,
  bounds: MapBounds,
  padding: number = 40
): number {
  const mapW = bounds.maxX - bounds.minX;
  const mapH = bounds.maxZ - bounds.minZ;
  if (mapW <= 0 || mapH <= 0) return 50;

  const availableW = Math.max(10, canvasWidth - padding * 2);
  const availableH = Math.max(10, canvasHeight - padding * 2);

  const scaleX = availableW / mapW;
  const scaleZ = availableH / mapH;
  return Math.min(scaleX, scaleZ);
}

export interface LEDStateOutput {
  color: 'off' | 'green' | 'amber' | 'red';
  labelVi: string;
  accessibleText: string;
}

/**
 * Resolves robot LED status with multi-level safety priority and accessibility text
 */
export function resolveRobotLEDState(
  safety: SafetyState,
  kinematics: RobotKinematics,
  explicitColor: 'off' | 'green' | 'amber' | 'red' = 'off'
): LEDStateOutput {
  if (safety.isEmergencyStopped) {
    return {
      color: 'red',
      labelVi: 'DỪNG KHẨN CẤP (E-STOP)',
      accessibleText: 'Trạng thái Đỏ: Dừng khẩn cấp đang được kích hoạt, toàn bộ động cơ bị khóa cứng.',
    };
  }

  if (safety.isCollision) {
    return {
      color: 'red',
      labelVi: 'CẢNH BÁO VA CHẠM',
      accessibleText: 'Trạng thái Đỏ nhấp nháy: Đã xảy ra va chạm với vật cản hoặc tường bao thế giới.',
    };
  }

  if (safety.isOutsideLane) {
    return {
      color: 'amber',
      labelVi: 'CẢNH BÁO LỆCH LÀN',
      accessibleText: 'Trạng thái Vàng: Độ lệch tim đường vượt quá hành lang an toàn 0.35m.',
    };
  }

  if (Math.abs(kinematics.linearSpeedMps) > 0.01 || Math.abs(kinematics.angularSpeedRadps) > 0.05) {
    return {
      color: 'green',
      labelVi: 'ĐANG CHUYỂN ĐỘNG',
      accessibleText: 'Trạng thái Xanh: Hai dải xích đang vận hành bình thường theo lệnh điều khiển.',
    };
  }

  if (explicitColor !== 'off') {
    return {
      color: explicitColor,
      labelVi: `CHẾ ĐỘ TỰ CHỌN (${explicitColor.toUpperCase()})`,
      accessibleText: `Trạng thái LED thủ công được đặt bởi lệnh người dùng: ${explicitColor}.`,
    };
  }

  return {
    color: 'off',
    labelVi: 'CHỜ LỆNH (IDLE)',
    accessibleText: 'Trạng thái Tắt (Off): Robot sẵn sàng nhận lệnh mới.',
  };
}
