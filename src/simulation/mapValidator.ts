import { WorldMap } from '../types/map';

export interface MapValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a WorldMap against schema rules and physical sanity checks
 */
export function validateMapSchema(mapData: unknown): MapValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mapData || typeof mapData !== 'object') {
    return { isValid: false, errors: ['Dữ liệu bản đồ không phải là object hợp lệ.'], warnings: [] };
  }

  const map = mapData as Partial<WorldMap>;

  // 1. Check ID & Name
  if (!map.id || typeof map.id !== 'string') {
    errors.push('Bản đồ thiếu trường "id" (string bắt buộc).');
  }
  if (!map.name || typeof map.name !== 'string') {
    errors.push('Bản đồ thiếu trường "name" (string bắt buộc).');
  }

  // 2. Check Bounds
  if (!map.bounds || typeof map.bounds !== 'object') {
    errors.push('Bản đồ thiếu trường "bounds" (object bắt buộc).');
  } else {
    const { minX, maxX, minZ, maxZ } = map.bounds;
    if (typeof minX !== 'number' || typeof maxX !== 'number' || minX >= maxX) {
      errors.push(`Ranh giới trục X không hợp lệ: minX (${minX}) >= maxX (${maxX}).`);
    }
    if (typeof minZ !== 'number' || typeof maxZ !== 'number' || minZ >= maxZ) {
      errors.push(`Ranh giới trục Z không hợp lệ: minZ (${minZ}) >= maxZ (${maxZ}).`);
    }
    const width = (maxX ?? 0) - (minX ?? 0);
    const height = (maxZ ?? 0) - (minZ ?? 0);
    if (width > 50 || height > 50) {
      warnings.push(`Kích thước bản đồ lớn (${width}m x ${height}m), có thể ảnh hưởng hiệu năng.`);
    }
  }

  // 3. Check Spawn
  if (!map.spawn || typeof map.spawn !== 'object') {
    errors.push('Bản đồ thiếu trường "spawn" (điểm xuất phát robot).');
  } else if (map.bounds) {
    const { xM, zM } = map.spawn;
    if (typeof xM !== 'number' || typeof zM !== 'number') {
      errors.push('Tọa độ spawn (xM, zM) phải là số thực.');
    } else {
      if (xM < map.bounds.minX || xM > map.bounds.maxX || zM < map.bounds.minZ || zM > map.bounds.maxZ) {
        errors.push(`Điểm spawn (${xM}, ${zM}) nằm ngoài ranh giới bản đồ.`);
      }
    }
  }

  // 4. Check Obstacles
  if (!Array.isArray(map.obstacles)) {
    errors.push('Trường "obstacles" phải là mảng.');
  } else {
    map.obstacles.forEach((obs, idx) => {
      if (!obs.id) errors.push(`Vật cản thứ ${idx + 1} thiếu "id".`);
      if (typeof obs.xM !== 'number' || typeof obs.zM !== 'number') {
        errors.push(`Vật cản "${obs.id || idx}" thiếu tọa độ (xM, zM).`);
      }
      if (obs.type === 'circle') {
        if (!obs.radiusM || obs.radiusM <= 0) {
          errors.push(`Vật cản tròn "${obs.id}" có radiusM <= 0 không hợp lệ.`);
        }
      } else {
        if (!obs.widthM || obs.widthM <= 0 || !obs.depthM || obs.depthM <= 0) {
          errors.push(`Vật cản hộp "${obs.id}" có chiều rộng hoặc chiều sâu <= 0.`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
