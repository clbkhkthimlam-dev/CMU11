import { WorldMap } from '../types/map';

export const BUILT_IN_MAPS: WorldMap[] = [
  // 1. Phòng thí nghiệm STEM (STEM Lab)
  {
    schemaVersion: 1,
    id: 'stem_lab',
    name: '1. Phòng Thí Nghiệm STEM (STEM Lab)',
    description: 'Khu vực thử nghiệm nghiên cứu sàn gạch trắng 8m × 6m, các trụ module quang học và bia hiệu chuẩn AprilTag.',
    units: 'm',
    backgroundTheme: 'stem_lab',
    backgroundColor: '#F8FAFC',
    bounds: { minX: -4.0, maxX: 4.0, minZ: -3.0, maxZ: 3.0 },
    gridStepM: 0.25,
    spawn: { xM: 0.0, zM: -2.0, yawRad: 0.0 },
    laneHalfWidthM: 0.40,
    lanePoints: [
      { xM: 0.0, zM: -2.0 },
      { xM: 0.0, zM: 0.0 },
      { xM: 0.0, zM: 2.0 },
    ],
    obstacles: [
      { id: 'wall_north', type: 'wall', xM: 0.0, zM: 3.0, widthM: 8.0, depthM: 0.15, heightM: 0.4, color: '#334155', enabled: true },
      { id: 'wall_south', type: 'wall', xM: 0.0, zM: -3.0, widthM: 8.0, depthM: 0.15, heightM: 0.4, color: '#334155', enabled: true },
      { id: 'wall_west', type: 'wall', xM: -4.0, zM: 0.0, widthM: 0.15, depthM: 6.0, heightM: 0.4, color: '#334155', enabled: true },
      { id: 'wall_east', type: 'wall', xM: 4.0, zM: 0.0, widthM: 0.15, depthM: 6.0, heightM: 0.4, color: '#334155', enabled: true },
      { id: 'bench_left', type: 'box', xM: -2.2, zM: 0.5, widthM: 1.0, depthM: 1.8, heightM: 0.35, color: '#2563EB', name: 'Bàn thí nghiệm 1', enabled: true },
      { id: 'bench_right', type: 'box', xM: 2.2, zM: 0.5, widthM: 1.0, depthM: 1.8, heightM: 0.35, color: '#2563EB', name: 'Bàn thí nghiệm 2', enabled: true },
      { id: 'optical_pillar', type: 'circle', xM: -1.2, zM: -1.0, widthM: 0.5, depthM: 0.5, radiusM: 0.25, heightM: 0.5, color: '#8B5CF6', name: 'Trụ quang học', enabled: true },
      { id: 'test_box', type: 'box', xM: 1.2, zM: -1.0, widthM: 0.6, depthM: 0.6, heightM: 0.4, color: '#F97316', name: 'Khối hộp thử nghiệm', enabled: true },
    ],
    waypoints: [
      { id: 'wp_01', xM: 0.0, zM: -1.0, name: 'Điểm đo 1' },
      { id: 'wp_02', xM: 0.0, zM: 0.5, name: 'Điểm đo 2' },
      { id: 'wp_03', xM: 0.0, zM: 2.2, name: 'Điểm mục tiêu' },
    ],
    markers: [
      { id: 0, xM: 0.0, zM: 2.9, yawRad: Math.PI, sizeM: 0.15, label: 'Tag #0 (Tường Bắc)' },
    ],
    metadata: { source: 'cmu_stem_lab', verifiedAsRealMap: true, createdDate: '2026-10-09' },
  },

  // 2. Sàn nhà hoặc hành lang (Floor & Corridor)
  {
    schemaVersion: 1,
    id: 'corridor',
    name: '2. Sàn Nhà & Hành Lang (Corridor)',
    description: 'Hành lang dài 12m × 4m với các cửa ra vào, cửa mở trượt và chướng ngại vật dọc lối đi.',
    units: 'm',
    backgroundTheme: 'corridor',
    backgroundColor: '#F1F5F9',
    bounds: { minX: -6.0, maxX: 6.0, minZ: -2.0, maxZ: 2.0 },
    gridStepM: 0.5,
    spawn: { xM: -5.0, zM: 0.0, yawRad: Math.PI / 2 },
    laneHalfWidthM: 0.5,
    lanePoints: [
      { xM: -5.0, zM: 0.0 },
      { xM: 0.0, zM: 0.0 },
      { xM: 5.0, zM: 0.0 },
    ],
    obstacles: [
      { id: 'c_wall_n', type: 'wall', xM: 0.0, zM: 2.0, widthM: 12.0, depthM: 0.15, heightM: 0.5, color: '#1E293B', enabled: true },
      { id: 'c_wall_s', type: 'wall', xM: 0.0, zM: -2.0, widthM: 12.0, depthM: 0.15, heightM: 0.5, color: '#1E293B', enabled: true },
      { id: 'c_wall_w', type: 'wall', xM: -6.0, zM: 0.0, widthM: 0.15, depthM: 4.0, heightM: 0.5, color: '#1E293B', enabled: true },
      { id: 'c_wall_e', type: 'wall', xM: 6.0, zM: 0.0, widthM: 0.15, depthM: 4.0, heightM: 0.5, color: '#1E293B', enabled: true },
      // Sliding door
      { id: 'door_sliding', type: 'door', xM: 0.0, zM: 0.6, widthM: 0.15, depthM: 1.2, heightM: 0.45, color: '#0EA5E9', name: 'Cửa trượt hành lang', enabled: true, isOpen: false },
      // Office partitions
      { id: 'plant_pot', type: 'circle', xM: -2.5, zM: -1.2, widthM: 0.6, depthM: 0.6, radiusM: 0.3, heightM: 0.4, color: '#22C55E', name: 'Chậu cây cảnh', enabled: true },
      { id: 'cabinet', type: 'box', xM: 2.5, zM: 1.3, widthM: 1.2, depthM: 0.6, heightM: 0.45, color: '#854D0E', name: 'Tủ tài liệu', enabled: true },
      // Dynamic cleaning cart obstacle
      { id: 'cleaning_cart', type: 'box', xM: 3.5, zM: -0.6, widthM: 0.8, depthM: 0.5, heightM: 0.35, color: '#E11D48', name: 'Xe đẩy tuần tra', isDynamic: true, patrol: { p1: [3.5, -0.8], p2: [3.5, 0.8], speedMps: 0.15 }, enabled: true },
    ],
    waypoints: [
      { id: 'wp_c1', xM: -3.0, zM: 0.0, name: 'Đoạn 1' },
      { id: 'wp_c2', xM: 0.0, zM: -0.3, name: 'Qua cửa' },
      { id: 'wp_c3', xM: 4.5, zM: 0.0, name: 'Cuối hành lang' },
    ],
    markers: [
      { id: 1, xM: 5.9, zM: 0.0, yawRad: -Math.PI / 2, sizeM: 0.15, label: 'Tag #1 (Cuối hành lang)' },
    ],
    metadata: { source: 'cmu_corridor', verifiedAsRealMap: true, createdDate: '2026-10-09' },
  },

  // 3. Đường chạy robot (Track Course)
  {
    schemaVersion: 1,
    id: 'track_course',
    name: '3. Đường Chạy Robot (Track Course)',
    description: 'Đường đua nhựa đường uốn lượn 10m × 7m có vạch tim đường và hành lang cảnh báo lệch làn ±0.35m.',
    units: 'm',
    backgroundTheme: 'track',
    backgroundColor: '#334155',
    bounds: { minX: -5.0, maxX: 5.0, minZ: -3.5, maxZ: 3.5 },
    gridStepM: 0.5,
    spawn: { xM: -3.5, zM: -2.2, yawRad: 0.0 },
    laneHalfWidthM: 0.35,
    lanePoints: [
      { xM: -3.5, zM: -2.2 },
      { xM: -3.5, zM: -0.5 },
      { xM: -2.8, zM: 1.2 },
      { xM: -1.0, zM: 2.2 },
      { xM: 1.0, zM: 2.2 },
      { xM: 2.8, zM: 1.2 },
      { xM: 3.5, zM: -0.5 },
      { xM: 3.5, zM: -2.2 },
      { xM: 1.5, zM: -2.5 },
      { xM: -0.5, zM: -1.5 },
      { xM: 0.0, zM: 0.0 },
    ],
    obstacles: [
      { id: 't_wall_n', type: 'wall', xM: 0.0, zM: 3.5, widthM: 10.0, depthM: 0.15, heightM: 0.4, color: '#1E293B', enabled: true },
      { id: 't_wall_s', type: 'wall', xM: 0.0, zM: -3.5, widthM: 10.0, depthM: 0.15, heightM: 0.4, color: '#1E293B', enabled: true },
      { id: 't_wall_w', type: 'wall', xM: -5.0, zM: 0.0, widthM: 0.15, depthM: 7.0, heightM: 0.4, color: '#1E293B', enabled: true },
      { id: 't_wall_e', type: 'wall', xM: 5.0, zM: 0.0, widthM: 0.15, depthM: 7.0, heightM: 0.4, color: '#1E293B', enabled: true },
      { id: 'center_island', type: 'box', xM: 0.0, zM: 0.6, widthM: 2.4, depthM: 1.4, heightM: 0.4, color: '#64748B', name: 'Đảo trung tâm', enabled: true },
      { id: 'cone_1', type: 'circle', xM: -2.0, zM: 0.0, widthM: 0.3, depthM: 0.3, radiusM: 0.15, heightM: 0.35, color: '#EA580C', name: 'Cọc tiêu 1', enabled: true },
      { id: 'cone_2', type: 'circle', xM: 2.0, zM: 0.0, widthM: 0.3, depthM: 0.3, radiusM: 0.15, heightM: 0.35, color: '#EA580C', name: 'Cọc tiêu 2', enabled: true },
    ],
    waypoints: [
      { id: 'wp_s', xM: -3.5, zM: -0.5, name: 'Khởi đầu' },
      { id: 'wp_c1', xM: -1.0, zM: 2.2, name: 'Cua 1' },
      { id: 'wp_apex', xM: 1.0, zM: 2.2, name: 'Đỉnh cua' },
      { id: 'wp_c2', xM: 3.5, zM: -0.5, name: 'Cua 2' },
      { id: 'wp_fin', xM: 0.0, zM: 0.0, name: 'Về đích' },
    ],
    markers: [
      { id: 1, xM: 0.0, zM: 3.4, yawRad: Math.PI, sizeM: 0.15, label: 'Tag #1 (Bắc)' },
      { id: 2, xM: 4.9, zM: 0.0, yawRad: -Math.PI / 2, sizeM: 0.15, label: 'Tag #2 (Đông)' },
    ],
    metadata: { source: 'cmu_track', verifiedAsRealMap: true, createdDate: '2026-10-09' },
  },

  // 4. Mê cung (AprilTag Maze)
  {
    schemaVersion: 1,
    id: 'maze_apriltag',
    name: '4. Mê Cung AprilTag (Maze Challenge)',
    description: 'Sa bàn mê cung chuẩn Tiết 31–34: TAG 0 (Bắc) → TAG 1 (Đông) → TAG 2 (Nam) → TAG 3 (Tây - Đích).',
    units: 'm',
    backgroundTheme: 'maze',
    backgroundColor: '#0F172A',
    bounds: { minX: -3.5, maxX: 3.5, minZ: -3.0, maxZ: 3.0 },
    gridStepM: 0.25,
    spawn: { xM: 0.0, zM: -2.2, yawRad: 0.0 },
    laneHalfWidthM: 0.35,
    lanePoints: [
      { xM: 0.0, zM: -2.2 },
      { xM: 0.0, zM: 1.5 },
      { xM: 2.0, zM: 1.5 },
      { xM: 2.0, zM: -1.5 },
      { xM: 0.0, zM: -1.5 },
      { xM: -2.0, zM: -1.5 },
      { xM: -2.0, zM: 0.5 },
    ],
    obstacles: [
      { id: 'm_wall_n', type: 'wall', xM: 0.0, zM: 2.8, widthM: 6.8, depthM: 0.15, heightM: 0.5, color: '#334155', enabled: true },
      { id: 'm_wall_s', type: 'wall', xM: 0.0, zM: -2.8, widthM: 6.8, depthM: 0.15, heightM: 0.5, color: '#334155', enabled: true },
      { id: 'm_wall_w', type: 'wall', xM: -3.4, zM: 0.0, widthM: 0.15, depthM: 5.6, heightM: 0.5, color: '#334155', enabled: true },
      { id: 'm_wall_e', type: 'wall', xM: 3.4, zM: 0.0, widthM: 0.15, depthM: 5.6, heightM: 0.5, color: '#334155', enabled: true },
      // Internal maze divider walls
      { id: 'maze_div_1', type: 'wall', xM: -1.1, zM: 0.4, widthM: 0.15, depthM: 2.8, heightM: 0.45, color: '#475569', enabled: true },
      { id: 'maze_div_2', type: 'wall', xM: 1.1, zM: -0.4, widthM: 0.15, depthM: 2.8, heightM: 0.45, color: '#475569', enabled: true },
      { id: 'maze_div_3', type: 'wall', xM: -1.8, zM: -0.9, widthM: 1.5, depthM: 0.15, heightM: 0.45, color: '#475569', enabled: true },
      { id: 'maze_div_4', type: 'wall', xM: 1.8, zM: 0.9, widthM: 1.5, depthM: 0.15, heightM: 0.45, color: '#475569', enabled: true },
    ],
    waypoints: [
      { id: 'wp_tag0', xM: 0.0, zM: 2.2, name: 'Trạm 1: TAG 0', targetTagId: 0, desiredDistanceM: 0.40, direction: 'left', forwardSpeed: 0.20, pauseAfterS: 0.8 },
      { id: 'wp_tag1', xM: 2.6, zM: 0.9, name: 'Trạm 2: TAG 1', targetTagId: 1, desiredDistanceM: 0.40, direction: 'right', forwardSpeed: 0.20, pauseAfterS: 0.8 },
      { id: 'wp_tag2', xM: 0.0, zM: -2.2, name: 'Trạm 3: TAG 2', targetTagId: 2, desiredDistanceM: 0.40, direction: 'left', forwardSpeed: 0.20, pauseAfterS: 0.8 },
      { id: 'wp_tag3', xM: -2.6, zM: 0.0, name: 'Trạm 4: TAG 3 (ĐÍCH)', targetTagId: 3, desiredDistanceM: 0.30, direction: 'left', forwardSpeed: 0.15, pauseAfterS: 0.0 },
    ],
    markers: [
      { id: 0, xM: 0.0, zM: 2.7, yawRad: Math.PI, sizeM: 0.15, label: 'TAG 0 (Bắc)' },
      { id: 1, xM: 3.3, zM: 0.9, yawRad: -Math.PI / 2, sizeM: 0.15, label: 'TAG 1 (Đông)' },
      { id: 2, xM: 0.0, zM: -2.7, yawRad: 0.0, sizeM: 0.15, label: 'TAG 2 (Nam)' },
      { id: 3, xM: -3.3, zM: 0.0, yawRad: Math.PI / 2, sizeM: 0.15, label: 'TAG 3 (Tây - Đích)' },
    ],
    metadata: { source: 'Tiet_31_32_33_34_apriltag_maze_challenge.ipynb', verifiedAsRealMap: true, createdDate: '2026-10-09' },
  },

  // 5. Nhà kho (Warehouse / Logistics)
  {
    schemaVersion: 1,
    id: 'warehouse',
    name: '5. Nhà Kho Thông Minh (Warehouse Logistics)',
    description: 'Kho hàng logistics 12m × 9m có các dãy kệ hàng (pallet racks), khu vực xếp dỡ và xe nâng tự hành tuần tra.',
    units: 'm',
    backgroundTheme: 'warehouse',
    backgroundColor: '#E2E8F0',
    bounds: { minX: -6.0, maxX: 6.0, minZ: -4.5, maxZ: 4.5 },
    gridStepM: 0.5,
    spawn: { xM: -4.5, zM: -3.5, yawRad: 0.0 },
    laneHalfWidthM: 0.6,
    lanePoints: [
      { xM: -4.5, zM: -3.5 },
      { xM: -4.5, zM: 3.0 },
      { xM: 0.0, zM: 3.0 },
      { xM: 0.0, zM: -3.0 },
      { xM: 4.5, zM: -3.0 },
      { xM: 4.5, zM: 3.0 },
    ],
    obstacles: [
      { id: 'w_wall_n', type: 'wall', xM: 0.0, zM: 4.5, widthM: 12.0, depthM: 0.2, heightM: 0.5, color: '#1E293B', enabled: true },
      { id: 'w_wall_s', type: 'wall', xM: 0.0, zM: -4.5, widthM: 12.0, depthM: 0.2, heightM: 0.5, color: '#1E293B', enabled: true },
      { id: 'w_wall_w', type: 'wall', xM: -6.0, zM: 0.0, widthM: 0.2, depthM: 9.0, heightM: 0.5, color: '#1E293B', enabled: true },
      { id: 'w_wall_e', type: 'wall', xM: 6.0, zM: 0.0, widthM: 0.2, depthM: 9.0, heightM: 0.5, color: '#1E293B', enabled: true },
      // Pallet Racks (Kệ hàng)
      { id: 'rack_1', type: 'box', xM: -2.4, zM: 0.0, widthM: 1.4, depthM: 5.0, heightM: 0.6, color: '#0284C7', name: 'Dãy kệ kho A', enabled: true },
      { id: 'rack_2', type: 'box', xM: 2.4, zM: 0.0, widthM: 1.4, depthM: 5.0, heightM: 0.6, color: '#0284C7', name: 'Dãy kệ kho B', enabled: true },
      // Loading crates
      { id: 'crate_pile_1', type: 'box', xM: -4.5, zM: 0.5, widthM: 1.0, depthM: 1.0, heightM: 0.4, color: '#D97706', name: 'Kiện hàng 1', enabled: true },
      { id: 'crate_pile_2', type: 'box', xM: 4.5, zM: -0.5, widthM: 1.0, depthM: 1.0, heightM: 0.4, color: '#D97706', name: 'Kiện hàng 2', enabled: true },
      // Dynamic automated forklift
      { id: 'agv_patrol', type: 'box', xM: 0.0, zM: 0.0, widthM: 0.9, depthM: 0.7, heightM: 0.45, color: '#E11D48', name: 'Robot AGV tuần tra', isDynamic: true, patrol: { p1: [0.0, -2.5], p2: [0.0, 2.5], speedMps: 0.25 }, enabled: true },
    ],
    waypoints: [
      { id: 'wp_w1', xM: -4.5, zM: 3.0, name: 'Lối rẽ A' },
      { id: 'wp_w2', xM: 0.0, zM: 3.0, name: 'Hành lang giữa' },
      { id: 'wp_w3', xM: 4.5, zM: 3.0, name: 'Cửa xuất kho' },
    ],
    markers: [
      { id: 4, xM: 0.0, zM: 4.4, yawRad: Math.PI, sizeM: 0.15, label: 'Tag #4 (Kệ xuất)' },
    ],
    metadata: { source: 'cmu_warehouse', verifiedAsRealMap: true, createdDate: '2026-10-09' },
  },

  // 6. Khu vực có đường đi, ngã rẽ và giao lộ (Intersection)
  {
    schemaVersion: 1,
    id: 'intersection',
    name: '6. Ngã Tư & Giao Lộ Giao Thông (City Crossing)',
    description: 'Giao lộ ngã tư 10m × 10m có vạch kẻ người đi bộ, đảo phân luồng giao thông và các trụ đèn tín hiệu.',
    units: 'm',
    backgroundTheme: 'intersection',
    backgroundColor: '#1E293B',
    bounds: { minX: -5.0, maxX: 5.0, minZ: -5.0, maxZ: 5.0 },
    gridStepM: 0.5,
    spawn: { xM: 0.0, zM: -4.0, yawRad: 0.0 },
    laneHalfWidthM: 0.5,
    lanePoints: [
      { xM: 0.0, zM: -4.0 },
      { xM: 0.0, zM: 0.0 },
      { xM: 3.5, zM: 0.0 },
    ],
    obstacles: [
      { id: 'i_wall_n', type: 'wall', xM: 0.0, zM: 5.0, widthM: 10.0, depthM: 0.2, heightM: 0.4, color: '#0F172A', enabled: true },
      { id: 'i_wall_s', type: 'wall', xM: 0.0, zM: -5.0, widthM: 10.0, depthM: 0.2, heightM: 0.4, color: '#0F172A', enabled: true },
      { id: 'i_wall_w', type: 'wall', xM: -5.0, zM: 0.0, widthM: 0.2, depthM: 10.0, heightM: 0.4, color: '#0F172A', enabled: true },
      { id: 'i_wall_e', type: 'wall', xM: 5.0, zM: 0.0, widthM: 0.2, depthM: 10.0, heightM: 0.4, color: '#0F172A', enabled: true },
      // Corner building blocks (4 blocks around intersection)
      { id: 'building_nw', type: 'box', xM: -3.2, zM: 3.2, widthM: 3.2, depthM: 3.2, heightM: 0.6, color: '#475569', name: 'Tòa nhà Tây Bắc', enabled: true },
      { id: 'building_ne', type: 'box', xM: 3.2, zM: 3.2, widthM: 3.2, depthM: 3.2, heightM: 0.6, color: '#475569', name: 'Tòa nhà Đông Bắc', enabled: true },
      { id: 'building_sw', type: 'box', xM: -3.2, zM: -3.2, widthM: 3.2, depthM: 3.2, heightM: 0.6, color: '#475569', name: 'Tòa nhà Tây Nam', enabled: true },
      { id: 'building_se', type: 'box', xM: 3.2, zM: -3.2, widthM: 3.2, depthM: 3.2, heightM: 0.6, color: '#475569', name: 'Tòa nhà Đông Nam', enabled: true },
      // Traffic light posts
      { id: 'light_post_1', type: 'circle', xM: -1.4, zM: -1.4, widthM: 0.3, depthM: 0.3, radiusM: 0.15, heightM: 0.6, color: '#FACC15', name: 'Trụ đèn góc TN', enabled: true },
      { id: 'light_post_2', type: 'circle', xM: 1.4, zM: 1.4, widthM: 0.3, depthM: 0.3, radiusM: 0.15, heightM: 0.6, color: '#FACC15', name: 'Trụ đèn góc ĐB', enabled: true },
    ],
    waypoints: [
      { id: 'wp_int_entry', xM: 0.0, zM: -2.0, name: 'Vào ngã tư' },
      { id: 'wp_int_center', xM: 0.0, zM: 0.0, name: 'Tâm giao lộ' },
      { id: 'wp_int_exit', xM: 3.0, zM: 0.0, name: 'Rẽ phải sang Đông' },
    ],
    markers: [
      { id: 2, xM: 4.8, zM: 0.0, yawRad: -Math.PI / 2, sizeM: 0.15, label: 'Tag #2 (Làn Đông)' },
    ],
    metadata: { source: 'cmu_intersection', verifiedAsRealMap: true, createdDate: '2026-10-09' },
  },

  // 7. Khu vực ngoài trời (Outdoor Terrain)
  {
    schemaVersion: 1,
    id: 'outdoor',
    name: '7. Khu Vực Ngoài Trời (Outdoor Terrain)',
    description: 'Địa hình thảm cỏ tự nhiên 12m × 8m với các tảng đá gồ ghề, bãi cát và cây cối cản trở di chuyển.',
    units: 'm',
    backgroundTheme: 'outdoor',
    backgroundColor: '#14532D',
    bounds: { minX: -6.0, maxX: 6.0, minZ: -4.0, maxZ: 4.0 },
    gridStepM: 0.5,
    spawn: { xM: -4.5, zM: -2.5, yawRad: 0.2 },
    laneHalfWidthM: 0.5,
    lanePoints: [
      { xM: -4.5, zM: -2.5 },
      { xM: -2.0, zM: 0.0 },
      { xM: 1.5, zM: 1.5 },
      { xM: 4.5, zM: -1.0 },
    ],
    obstacles: [
      { id: 'o_fence_n', type: 'wall', xM: 0.0, zM: 4.0, widthM: 12.0, depthM: 0.15, heightM: 0.4, color: '#166534', enabled: true },
      { id: 'o_fence_s', type: 'wall', xM: 0.0, zM: -4.0, widthM: 12.0, depthM: 0.15, heightM: 0.4, color: '#166534', enabled: true },
      { id: 'o_fence_w', type: 'wall', xM: -6.0, zM: 0.0, widthM: 0.15, depthM: 8.0, heightM: 0.4, color: '#166534', enabled: true },
      { id: 'o_fence_e', type: 'wall', xM: 6.0, zM: 0.0, widthM: 0.15, depthM: 8.0, heightM: 0.4, color: '#166534', enabled: true },
      // Natural boulders / rocks
      { id: 'boulder_1', type: 'circle', xM: -1.5, zM: -1.5, widthM: 1.2, depthM: 1.2, radiusM: 0.6, heightM: 0.4, color: '#78716C', name: 'Tảng đá lớn 1', enabled: true },
      { id: 'boulder_2', type: 'circle', xM: 0.5, zM: -0.5, widthM: 0.8, depthM: 0.8, radiusM: 0.4, heightM: 0.35, color: '#78716C', name: 'Tảng đá 2', enabled: true },
      { id: 'tree_trunk', type: 'circle', xM: 2.2, zM: 2.0, widthM: 0.8, depthM: 0.8, radiusM: 0.4, heightM: 0.6, color: '#854D0E', name: 'Gốc cây', enabled: true },
      { id: 'log_barrier', type: 'box', xM: -2.8, zM: 1.8, widthM: 2.2, depthM: 0.4, heightM: 0.3, color: '#713F12', name: 'Thân cây gỗ đổ', enabled: true },
    ],
    waypoints: [
      { id: 'wp_out1', xM: -2.0, zM: 0.0, name: 'Đoạn đá 1' },
      { id: 'wp_out2', xM: 1.5, zM: 1.5, name: 'Khu đồi cát' },
      { id: 'wp_out3', xM: 4.5, zM: -1.0, name: 'Về trạm lều' },
    ],
    markers: [
      { id: 3, xM: 5.8, zM: -1.0, yawRad: -Math.PI / 2, sizeM: 0.15, label: 'Tag #3 (Đích ngoài trời)' },
    ],
    metadata: { source: 'cmu_outdoor', verifiedAsRealMap: true, createdDate: '2026-10-09' },
  },

  // 8. Bản đồ tự thiết kế (Custom User Map)
  {
    schemaVersion: 1,
    id: 'custom_user',
    name: '8. Bản Đồ Tự Thiết Kế (Custom User Sandbox)',
    description: 'Không gian mở 8m × 6m để học sinh tự do thêm, sửa, di chuyển và lập trình với các khối vật thể.',
    units: 'm',
    backgroundTheme: 'custom',
    backgroundColor: '#FAFAFA',
    bounds: { minX: -4.0, maxX: 4.0, minZ: -3.0, maxZ: 3.0 },
    gridStepM: 0.25,
    spawn: { xM: 0.0, zM: -2.0, yawRad: 0.0 },
    laneHalfWidthM: 0.4,
    lanePoints: [],
    obstacles: [
      { id: 'custom_wall_n', type: 'wall', xM: 0.0, zM: 3.0, widthM: 8.0, depthM: 0.15, heightM: 0.4, color: '#334155', enabled: true },
      { id: 'custom_wall_s', type: 'wall', xM: 0.0, zM: -3.0, widthM: 8.0, depthM: 0.15, heightM: 0.4, color: '#334155', enabled: true },
      { id: 'custom_wall_w', type: 'wall', xM: -4.0, zM: 0.0, widthM: 0.15, depthM: 6.0, heightM: 0.4, color: '#334155', enabled: true },
      { id: 'custom_wall_e', type: 'wall', xM: 4.0, zM: 0.0, widthM: 0.15, depthM: 6.0, heightM: 0.4, color: '#334155', enabled: true },
      { id: 'user_box_1', type: 'box', xM: -1.5, zM: 0.0, widthM: 0.8, depthM: 0.8, heightM: 0.4, color: '#EC4899', name: 'Khối hộp A', enabled: true },
      { id: 'user_box_2', type: 'box', xM: 1.5, zM: 0.0, widthM: 0.8, depthM: 0.8, heightM: 0.4, color: '#14B8A6', name: 'Khối hộp B', enabled: true },
    ],
    waypoints: [
      { id: 'wp_u1', xM: 0.0, zM: 0.0, name: 'Điểm trung tâm' },
      { id: 'wp_u2', xM: 0.0, zM: 1.8, name: 'Điểm cuối' },
    ],
    markers: [
      { id: 0, xM: 0.0, zM: 2.8, yawRad: Math.PI, sizeM: 0.15, label: 'Bia AprilTag 0' },
    ],
    metadata: { source: 'user_custom', verifiedAsRealMap: true, createdDate: '2026-10-09' },
  },
];
