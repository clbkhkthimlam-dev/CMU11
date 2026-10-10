import { RobotPose, RobotKinematics, SensorData, DeviceState, RobotDiagnosticMode } from '../types/robot';
import { WorldMap, MapObstacle } from '../types/map';

export interface RobotComponentInfo {
  id: string;
  name: string;
  vietnameseName: string;
  category: string;
  dimensionsMm: [number, number, number]; // [Rộng, Cao, Dài]
  massGrams: number;
  location: string;
  interfaces: string[];
  specs: Record<string, string>;
  description: string;
}

export const ROBOT_COMPONENTS_CATALOG: RobotComponentInfo[] = [
  {
    id: 'chassis_lower',
    name: 'Lower Chassis Frame',
    vietnameseName: 'Khung gầm chính dưới (Lower Chassis)',
    category: 'Cơ khí & Khung',
    dimensionsMm: [220, 35, 320],
    massGrams: 520,
    location: 'Đáy robot, cao độ 0.035m - 0.070m',
    interfaces: ['Cọc đồng M3 x 35mm (4 vị trí)', 'Lỗ bắt động cơ M3'],
    specs: {
      'Vật liệu': 'Hợp kim nhôm Anodized 6061-T6 dày 2.0mm',
      'Khoảng sáng gầm': '35 mm (0.035 m)',
      'Tải trọng tối đa': '5.0 kg',
      'Khối lượng': '520 g',
    },
    description: 'Khung gầm dập gân chịu lực định hình chữ U, gắn động cơ, khay pin và hệ thống treo bánh xích.',
  },
  {
    id: 'upper_deck',
    name: 'Upper Electronics Deck',
    vietnameseName: 'Sàn bo mạch trên (Upper Deck)',
    category: 'Cơ khí & Khung',
    dimensionsMm: [200, 3, 290],
    massGrams: 180,
    location: 'Tầng trên cao độ 0.070m, cách sàn dưới 35mm',
    interfaces: ['Lỗ bắt Jetson Nano B01', 'Lỗ bắt Motor Driver Hat', 'Lỗ gắn Gimbal Pan-Tilt'],
    specs: {
      'Vật liệu': 'Tấm Acrylic kỹ thuật chống tĩnh điện dày 3.0mm',
      'Khoảng cách 2 tầng': '35 mm (cọc đồng M3)',
      'Bề mặt': 'Xử lý mờ chống phản quang cảm biến',
    },
    description: 'Sàn lắp đặt cách điện an toàn cho Jetson Nano, mạch mở rộng GPIO, màn hình TM1637 và tháp LIDAR.',
  },
  {
    id: 'track_assembly',
    name: 'Dual Track & Wheel Assembly',
    vietnameseName: 'Cụm bánh xích & truyền động (Dual Tracks)',
    category: 'Hệ truyền động',
    dimensionsMm: [45, 70, 400],
    massGrams: 640,
    location: 'Hai bên sườn thân xe, khoảng cách tâm xích 0.20m',
    interfaces: ['Khớp nối trục nhôm Hex 4mm', 'Trục bi đỡ thép không gỉ'],
    specs: {
      'Dải xích': 'Cao su tổng hợp cốt sợi gai chịu mài mòn, bề rộng 45mm',
      'Bánh chủ động (Sprocket)': 'Đường kính 70mm (R=35mm), 14 răng hợp kim',
      'Bánh dẫn hướng (Idler)': 'Đường kính 70mm có lò xo tăng xích tự động',
      'Bánh tì chịu tải (Road wheels)': '4 cặp bánh tì đôi đường kính 50mm (R=25mm)',
      'Tốc độ tối đa': '0.50 m/s',
    },
    description: 'Hệ xích xe tăng bám đường vượt địa hình gồ ghề, dốc nghiêng và xoay tròn tại chỗ (spot turn).',
  },
  {
    id: 'dc_motors',
    name: 'Dual DC Encoder Gearmotors',
    vietnameseName: 'Động cơ giảm tốc kép có Encoder',
    category: 'Động cơ & Chấp hành',
    dimensionsMm: [37, 37, 75],
    massGrams: 340,
    location: 'Khoang gầm sau, hai bên trục truyền động',
    interfaces: ['Dây nguồn DC 12V', 'Dây tín hiệu Hall Encoder A/B Phase (3.3V)'],
    specs: {
      'Điện áp định mức': '12V DC (hoạt động 6V - 12V)',
      'Tỷ số truyền hộp số': '1:30 Metal Gearbox',
      'Tốc độ không tải': '330 RPM @ 12V',
      'Mô-men xoắn giữ': '3.2 kg.cm',
      'Độ phân giải Encoder': '11 xung/vòng motor × 30 = 330 xung/vòng bánh',
    },
    description: 'Hai động cơ điều khiển độc lập thông qua mạch cầu H kép, phản hồi vận tốc góc chính xác.',
  },
  {
    id: 'battery_pack',
    name: 'Li-ion Battery Pack (2S/3S)',
    vietnameseName: 'Khay pin nguồn Li-ion 7.4V / 11.1V',
    category: 'Hệ thống nguồn',
    dimensionsMm: [70, 25, 135],
    massGrams: 280,
    location: 'Trung tâm đáy khung xe (hạ thấp trọng tâm tối đa)',
    interfaces: ['Giắc cắm XT60 chịu dòng 30A', 'Cổng cân bằng sạc JST-XH 3P/4P'],
    specs: {
      'Cấu hình cell': '2S2P hoặc 3S1P Li-ion 18650 chính hãng',
      'Điện áp danh định': '7.4V DC (đầy 8.4V, cạn 6.4V)',
      'Dung lượng': '5200 mAh (38.5 Wh)',
      'Mạch bảo vệ': 'BMS tích hợp ngắt quá dòng, quá áp, ngắn mạch',
      'Thời lượng vận hành': 'Khoảng 2.5 - 3.5 giờ liên tục',
    },
    description: 'Cung cấp năng lượng ổn định cho bo mạch Jetson Nano, động cơ và toàn bộ cảm biến trên robot.',
  },
  {
    id: 'jetson_board',
    name: 'NVIDIA Jetson Nano Dev Kit B01',
    vietnameseName: 'Bo mạch máy tính nhúng Jetson Nano',
    category: 'Bộ xử lý trung tâm',
    dimensionsMm: [100, 29, 80],
    massGrams: 140,
    location: 'Tầng trên, vị trí trung tâm',
    interfaces: ['Cổng CSI Camera x 2', 'USB 3.0 x 4', 'Gigabit Ethernet', 'GPIO 40-pin', 'I2C/UART/SPI'],
    specs: {
      'GPU': '128-core NVIDIA Maxwell™ architecture',
      'CPU': 'Quad-core ARM® Cortex®-A57 MPCore @ 1.43 GHz',
      'RAM': '4 GB 64-bit LPDDR4 25.6 GB/s',
      'Tản nhiệt': 'Khối nhôm đúc đen rãnh sâu + quạt 40x40x10mm 5V PWM',
      'Mức tiêu thụ điện': '5W / 10W Power Mode',
    },
    description: 'Xử lý thị giác máy tính OpenCV, định vị AprilTag, mạng nơ-ron nhận diện vật thể và điều khiển thời gian thực.',
  },
  {
    id: 'rplidar_sensor',
    name: 'RPLIDAR A1 360° Laser Scanner',
    vietnameseName: 'Cảm biến Laser RPLIDAR A1 360°',
    category: 'Cảm biến định vị & SLAM',
    dimensionsMm: [70, 40, 97],
    massGrams: 170,
    location: 'Tháp trên cùng tầng 2 (tầm quét thoáng không bị che)',
    interfaces: ['UART Serial 115200 baud', 'Nguồn 5V DC Motor PWM'],
    specs: {
      'Góc quét': '360 độ mặt phẳng ngang',
      'Khoảng cách đo': '0.15 m đến 8.0 m (trong nhà)',
      'Tần số quét': '5.5 Hz - 10 Hz (xoay 360° theo vòng/giây)',
      'Tần số lấy mẫu': '8000 điểm đo/giây (8 kHz)',
      'Độ phân giải góc': '0.9 - 1.0 độ',
    },
    description: 'Quét toàn cảnh xung quanh tạo bản đồ 2D SLAM, phát hiện vật cản đa hướng và dẫn đường tự hành.',
  },
  {
    id: 'ultrasonic_sensor',
    name: 'HC-SR04 Ultrasonic Distance Sensor',
    vietnameseName: 'Cảm biến siêu âm HC-SR04 kép',
    category: 'Cảm biến cự ly',
    dimensionsMm: [45, 20, 15],
    massGrams: 12,
    location: 'Mặt trước cản trước (Front Bumper), cao độ 0.075m',
    interfaces: ['VCC 5V', 'Trig (Pin 16)', 'Echo (Pin 18 qua cầu phân áp)', 'GND'],
    specs: {
      'Dải đo cự ly': '2 cm đến 300 cm (0.02m - 3.0m)',
      'Góc mở chùm sóng': '15 độ hình nón',
      'Độ phân giải': '0.3 cm',
      'Mắt phát/thu': '2 đầu dò siêu âm 40 kHz mạ kim loại có lưới bảo vệ',
    },
    description: 'Đo khoảng cách vật cản trực tiếp trước mặt, hỗ trợ phanh khẩn cấp và thuật toán bám tường.',
  },
  {
    id: 'camera_gimbal',
    name: 'CSI IMX219 & 2-DOF Pan/Tilt Gimbal',
    vietnameseName: 'Camera CSI IMX219 & Khung Gimbal Pan/Tilt',
    category: 'Thị giác & Chấp hành',
    dimensionsMm: [45, 55, 45],
    massGrams: 65,
    location: 'Mép trước tầng trên, phía trên cảm biến siêu âm',
    interfaces: ['Cáp mềm Ribbon CSI 15-pin', '2 ngõ PWM Servo SG90 (Pin 32/33)'],
    specs: {
      'Cảm biến hình ảnh': 'Sony IMX219 8 Megapixel CMOS',
      'Góc mở ống kính (FOV)': '60° Horizontal, 45° Vertical',
      'Servo Pan (Trục ngang)': 'Góc xoay [-70°, +70°] (-1.22 rad đến +1.22 rad)',
      'Servo Tilt (Trục đứng)': 'Góc xoay [-20°, +30°] (-0.35 rad đến +0.52 rad)',
      'Độ phân giải video': '1080p @ 30fps / 720p @ 60fps',
    },
    description: 'Chủ động quan sát nhận diện biển báo, đọc AprilTag và bám theo đối tượng trong tầm nhìn.',
  },
  {
    id: 'peripherals_safety',
    name: 'Peripherals, RGB LED & Bumpers',
    vietnameseName: 'Đèn báo RGB, Màn hình LED & Cản bảo vệ',
    category: 'Ngoại vi & An toàn',
    dimensionsMm: [220, 30, 20],
    massGrams: 95,
    location: 'Cản trước, đuôi sau và mặt hông',
    interfaces: ['GPIO 11/13/23 (LED R/G/B)', 'I2C/DIO (TM1637 4-digit)', 'Buzzer (Pin 12)'],
    specs: {
      'Đèn LED 10mm RGB': 'Chỉ thị trạng thái: Xanh (RUN), Vàng (PAUSE), Đỏ (ESTOP)',
      'Màn hình TM1637': '4 số 7 đoạn LED đỏ hiển thị telemetry / mã lỗi',
      'Còi Buzzer chủ động': 'Phát âm báo va chạm và xác nhận lệnh',
      'Cản va hợp kim': 'Thanh nhôm gia cường phía trước và đuôi xe bảo vệ bánh xích',
    },
    description: 'Giao tiếp trạng thái trực quan với người vận hành và hấp thụ va đập khi xảy ra sự cố cơ học.',
  },
];

// ====================================================================
// 1. VẼ 2D MẶT CẮT TRÊN XUỐNG (TOP-DOWN MECHANICAL BLUEPRINT)
// ====================================================================
export function drawTrackedRobot2DMechanical(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  rx: number,
  ry: number,
  scale: number,
  showSensors: boolean,
  highlightComponentId?: string | null
) {
  const chassisL = 0.32 * scale; // 320mm
  const chassisW = 0.22 * scale; // 220mm
  const trackW = 0.045 * scale;  // 45mm
  const trackSpacing = 0.20 * scale; // 200mm center-to-center
  const trackL = 0.40 * scale;   // 400mm track assembly length

  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(pose.yawRad);

  // Vision cone
  if (showSensors) {
    const fovAngle = (60 * Math.PI) / 180;
    const fovLen = 2.4 * scale;
    ctx.save();
    // Quay theo servo pan
    ctx.rotate(dev.servoPanRad || 0);
    const grad = ctx.createRadialGradient(0, -chassisL * 0.35, 0, 0, -chassisL * 0.35, fovLen);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.01)');
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -chassisL * 0.35);
    ctx.arc(0, -chassisL * 0.35, fovLen, -Math.PI / 2 - fovAngle / 2, -Math.PI / 2 + fovAngle / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // --- BÓNG TIẾP XÚC DƯỚI GẦM (Ground Shadow) ---
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-trackSpacing / 2 - trackW, -trackL / 2 + 2, trackSpacing + trackW * 2, trackL, 10);
  ctx.fill();

  // --- CỤM XÍCH TRÁI VÀ PHẢI ---
  const drawSingleTrack2D = (trackCenterX: number, trackKin: { phase: number; speedMps: number; wheelAngleRad: number }, isLeft: boolean) => {
    const isHigh = highlightComponentId === 'track_assembly';
    ctx.save();

    // Vỏ dải xích cao su chính
    ctx.fillStyle = isHigh ? '#F59E0B' : '#1E293B';
    ctx.strokeStyle = isHigh ? '#FBBF24' : '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(trackCenterX - trackW / 2, -trackL / 2, trackW, trackL, 6);
    ctx.fill();
    ctx.stroke();

    // Bánh chủ động phía sau (Drive Sprocket - Sau xe: +Y)
    const sprockY = trackL / 2 - trackW * 0.7;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(trackCenterX, sprockY, trackW * 0.45, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Răng đĩa xích quay
    ctx.save();
    ctx.translate(trackCenterX, sprockY);
    ctx.rotate(trackKin.wheelAngleRad);
    ctx.fillStyle = '#CBD5E1';
    for (let t = 0; t < 6; t++) {
      ctx.rotate(Math.PI / 3);
      ctx.fillRect(-2, -trackW * 0.45, 4, 3);
    }
    ctx.restore();

    // Bánh chuyển hướng phía trước (Front Idler Wheel - Trước xe: -Y)
    const idlerY = -trackL / 2 + trackW * 0.7;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(trackCenterX, idlerY, trackW * 0.45, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4 bánh tì chịu lực ở giữa (4 Road Wheels)
    const numRoad = 4;
    const roadSpan = sprockY - idlerY - trackW * 0.8;
    for (let r = 0; r < numRoad; r++) {
      const rY = idlerY + trackW * 0.4 + (r / (numRoad - 1)) * roadSpan;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(trackCenterX, rY, trackW * 0.35, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Tâm trục
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(trackCenterX, rY, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Các vấu xích cao su chuyển động (Tread Cleats / Ribs cycling with phase)
    const numRibs = 10;
    ctx.strokeStyle = isHigh ? '#FEF08A' : '#64748B';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < numRibs; i++) {
      const ribFrac = ((i + trackKin.phase) % numRibs) / numRibs;
      const ribY = -trackL / 2 + 6 + ribFrac * (trackL - 12);
      ctx.beginPath();
      ctx.moveTo(trackCenterX - trackW / 2 + 2, ribY);
      ctx.lineTo(trackCenterX + trackW / 2 - 2, ribY);
      ctx.stroke();
    }

    ctx.restore();
  };

  drawSingleTrack2D(-trackSpacing / 2, kin.leftTrack, true);
  drawSingleTrack2D(trackSpacing / 2, kin.rightTrack, false);

  // --- ĐỘNG CƠ GIẢM TỐC DC KÉP & KHỚP NỐI (DC Motors) ---
  const isMotorHigh = highlightComponentId === 'dc_motors';
  ctx.save();
  [-1, 1].forEach(side => {
    const mx = side * (trackSpacing / 2 - 16);
    const my = chassisL * 0.22;
    // Thân motor vàng / bạc kim loại
    ctx.fillStyle = isMotorHigh ? '#F59E0B' : '#EAB308';
    ctx.beginPath();
    ctx.roundRect(mx - 10, my - 16, 20, 32, 3);
    ctx.fill();
    ctx.strokeStyle = '#A16207';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Khớp nối nhôm Coupler gắn sang trục xích
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(side > 0 ? mx + 10 : mx - 16, my - 5, 6, 10);
  });
  ctx.restore();

  // --- KHUNG GẦM DƯỚI (Lower Chassis Plate) ---
  const isChassisHigh = highlightComponentId === 'chassis_lower';
  ctx.fillStyle = isChassisHigh ? '#3B82F6' : '#1E293B';
  ctx.strokeStyle = isChassisHigh ? '#60A5FA' : '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-chassisW / 2, -chassisL / 2, chassisW, chassisL, 8);
  ctx.fill();
  ctx.stroke();

  // --- CẢN TRƯỚC VÀ CẢN SAU (Front & Rear Bumpers) ---
  const isBumperHigh = highlightComponentId === 'peripherals_safety';
  ctx.fillStyle = isBumperHigh ? '#EC4899' : '#334155';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  // Cản trước
  ctx.beginPath();
  ctx.roundRect(-chassisW / 2 - 4, -chassisL / 2 - 5, chassisW + 8, 8, 3);
  ctx.fill();
  ctx.stroke();
  // Cản sau
  ctx.beginPath();
  ctx.roundRect(-chassisW / 2 - 4, chassisL / 2 - 3, chassisW + 8, 8, 3);
  ctx.fill();
  ctx.stroke();

  // --- KHAY PIN LI-ION (Battery Pack) ---
  const isBatHigh = highlightComponentId === 'battery_pack';
  ctx.save();
  ctx.fillStyle = isBatHigh ? '#10B981' : '#047857';
  ctx.strokeStyle = '#065F46';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-chassisW * 0.28, chassisL * 0.05, chassisW * 0.56, chassisL * 0.28, 4);
  ctx.fill();
  ctx.stroke();
  // Nhãn cell pin
  ctx.fillStyle = '#A7F3D0';
  ctx.font = 'bold 8px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.fillText('LI-ION 7.4V', 0, chassisL * 0.21);
  ctx.restore();

  // --- CỌC ĐỒNG M3 NỐI TẦNG (4 Brass Standoffs) ---
  const stX = chassisW / 2 - 14;
  const stY = chassisL / 2 - 18;
  ctx.fillStyle = '#F59E0B';
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 1;
  [[-stX, -stY], [stX, -stY], [-stX, stY], [stX, stY]].forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  });

  // --- SÀN BO MẠCH TRÊN (Upper Deck Plate - Acrylic) ---
  const isDeckHigh = highlightComponentId === 'upper_deck';
  ctx.fillStyle = isDeckHigh ? 'rgba(59, 130, 246, 0.4)' : 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-chassisW / 2 + 8, -chassisL / 2 + 10, chassisW - 16, chassisL - 20, 6);
  ctx.fill();
  ctx.stroke();

  // --- BO MẠCH JETSON NANO (Compute Board) ---
  const isJetHigh = highlightComponentId === 'jetson_board';
  ctx.save();
  const jetW = chassisW * 0.65;
  const jetL = chassisL * 0.40;
  const jetY = -chassisL * 0.08;

  // PCB xanh sẫm
  ctx.fillStyle = isJetHigh ? '#10B981' : '#064E3B';
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-jetW / 2, jetY - jetL / 2, jetW, jetL, 4);
  ctx.fill();
  ctx.stroke();

  // Khối tản nhiệt nhôm đen có rãnh (Black Ribbed Heatsink)
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-jetW * 0.38, jetY - jetL * 0.38, jetW * 0.76, jetL * 0.76, 3);
  ctx.fill();
  ctx.stroke();

  // Các cánh tản nhiệt
  ctx.strokeStyle = '#1E293B';
  for (let f = -jetL * 0.3; f <= jetL * 0.3; f += 5) {
    ctx.beginPath();
    ctx.moveTo(-jetW * 0.35, jetY + f);
    ctx.lineTo(jetW * 0.35, jetY + f);
    ctx.stroke();
  }

  // Quạt tản nhiệt tròn ở giữa
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(0, jetY, 11, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.stroke();

  // Cổng I/O USB / Ethernet phía sau
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(-jetW / 2 + 4, jetY + jetL / 2 - 6, 14, 5);
  ctx.fillRect(-jetW / 2 + 22, jetY + jetL / 2 - 6, 12, 5);
  ctx.fillRect(-jetW / 2 + 38, jetY + jetL / 2 - 6, 12, 5);

  ctx.restore();

  // --- CẢM BIẾN SIÊU ÂM KÉP HC-SR04 (Front Ultrasonic Sensor) ---
  const isSonicHigh = highlightComponentId === 'ultrasonic_sensor';
  ctx.save();
  const usY = -chassisL / 2 - 2;
  // Bảng mạch siêu âm
  ctx.fillStyle = isSonicHigh ? '#06B6D4' : '#0284C7';
  ctx.beginPath();
  ctx.roundRect(-22, usY - 4, 44, 9, 2);
  ctx.fill();
  // 2 mắt dò tròn kim loại Transmitter & Receiver (T / R)
  [-11, 11].forEach(ux => {
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(ux, usY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Lưới mắt cáo
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(ux, usY, 3, 0, 2 * Math.PI);
    ctx.fill();
  });
  ctx.restore();

  // --- CỤM PAN-TILT GIMBAL CAMERA CSI IMX219 ---
  const isCamHigh = highlightComponentId === 'camera_gimbal';
  ctx.save();
  const camY = -chassisL * 0.34;
  // Khung đế servo pan
  ctx.fillStyle = isCamHigh ? '#A855F7' : '#2563EB';
  ctx.beginPath();
  ctx.roundRect(-14, camY - 10, 28, 20, 4);
  ctx.fill();
  ctx.strokeStyle = '#60A5FA';
  ctx.stroke();

  // Quay camera theo servo pan
  ctx.translate(0, camY);
  ctx.rotate(dev.servoPanRad || 0);

  // Đầu camera và ống kính hướng ra trước (-Y)
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-9, -12, 18, 10);
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.arc(0, -10, 4.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(0, -10, 2, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();

  // --- THÁP RPLIDAR A1 360° (LIDAR Puck on Top) ---
  const isLidarHigh = highlightComponentId === 'rplidar_sensor';
  ctx.save();
  const lidY = -chassisL * 0.08; // Đặt trên đỉnh trung tâm
  // Đế tròn LIDAR
  ctx.fillStyle = isLidarHigh ? '#06B6D4' : '#0F172A';
  ctx.beginPath();
  ctx.arc(0, lidY, 15, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = isLidarHigh ? '#67E8F9' : '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Nắp xoay LiDAR với vệt quang học
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(0, lidY, 10, 0, 2 * Math.PI);
  ctx.fill();

  // Vạch quét Laser xoay thời gian thực
  const scanSpin = (Date.now() / 150) % (2 * Math.PI);
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, lidY);
  ctx.lineTo(13 * Math.cos(scanSpin), lidY + 13 * Math.sin(scanSpin));
  ctx.stroke();

  ctx.restore();

  // --- ĐÈN LED RGB TRẠNG THÁI (RGB Status LED) ---
  const isLedHigh = highlightComponentId === 'peripherals_safety';
  const ledColors: Record<string, { fill: string; glow: string }> = {
    green: { fill: '#22C55E', glow: 'rgba(34, 197, 94, 0.6)' },
    amber: { fill: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },
    red: { fill: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' },
    off: { fill: '#64748B', glow: 'rgba(100, 116, 139, 0.1)' },
  };
  const activeLed = ledColors[dev.statusLED] || ledColors.off;

  ctx.save();
  const ledY = chassisL * 0.38;
  // Quầng sáng phát quang
  ctx.fillStyle = activeLed.glow;
  ctx.beginPath();
  ctx.arc(0, ledY, 10, 0, 2 * Math.PI);
  ctx.fill();

  // Bóng LED
  ctx.fillStyle = activeLed.fill;
  ctx.beginPath();
  ctx.arc(0, ledY, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // --- MÀN HÌNH 4 SỐ 7 ĐOẠN TM1637 ---
  ctx.save();
  const tmY = chassisL * 0.38;
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(-chassisW * 0.35, tmY - 7, 28, 14, 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.stroke();

  // LED đỏ 7 đoạn
  ctx.fillStyle = '#EF4444';
  ctx.font = 'bold 7px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.fillText(dev.tm1637Display?.rawString || '8888', -chassisW * 0.35 + 14, tmY + 3);
  ctx.restore();

  // --- MŨI TÊN ĐỊNH HƯỚNG MŨI XE (Heading Arrow) ---
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.moveTo(0, -chassisL / 2 + 10);
  ctx.lineTo(-6, -chassisL / 2 + 22);
  ctx.lineTo(6, -chassisL / 2 + 22);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ====================================================================
// 2. VẼ 3D ISOMETRIC CHUẨN CƠ KHÍ & ĐỒ HỌA THỂ TÍCH (SOLID 3D)
// ====================================================================

// Helper hàm chỉnh sắc độ màu theo hệ số chiếu sáng (Directional diffuse lighting)
export function shadeColor(hexOrRgb: string, factor: number): string {
  if (hexOrRgb.startsWith('rgba')) return hexOrRgb;
  if (hexOrRgb.startsWith('rgb(')) {
    const parts = hexOrRgb.replace('rgb(', '').replace(')', '').split(',').map(s => parseFloat(s.trim()));
    const r = Math.min(255, Math.max(0, Math.round(parts[0] * factor)));
    const g = Math.min(255, Math.max(0, Math.round(parts[1] * factor)));
    const b = Math.min(255, Math.max(0, Math.round(parts[2] * factor)));
    return `rgb(${r},${g},${b})`;
  }
  let c = hexOrRgb.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return hexOrRgb;
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.min(255, Math.max(0, Math.round(r * factor)));
  g = Math.min(255, Math.max(0, Math.round(g * factor)));
  b = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `rgb(${r},${g},${b})`;
}

export function drawTrackedRobot3DIsometric(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  sensors: SensorData,
  cx: number,
  cy: number,
  isoScale: number,
  highlightComponentId?: string | null,
  options?: {
    orbitYawRad?: number;
    lightDir?: [number, number, number];
    showShadow?: boolean;
    wireframeOnly?: boolean;
    showNormals?: boolean;
  }
) {
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);
  const orbitYaw = options?.orbitYawRad || 0;
  const isWire = options?.wireframeOnly || false;

  // Vector ánh sáng định hướng chuẩn (Directional Key Light from upper-left-front)
  const lx0 = options?.lightDir ? options.lightDir[0] : -0.45;
  const ly0 = options?.lightDir ? options.lightDir[1] : 0.82;
  const lz0 = options?.lightDir ? options.lightDir[2] : -0.35;
  const lLen = Math.sqrt(lx0 * lx0 + ly0 * ly0 + lz0 * lz0) || 1;
  const [Lx, Ly, Lz] = [lx0 / lLen, ly0 / lLen, lz0 / lLen];

  // Chiếu điểm cục bộ [lxM, lyM, lzM] theo yaw robot và góc xoay camera orbit
  const projectPoint = (lxM: number, lyM: number, lzM: number): [number, number] => {
    // 1. Xoay theo yaw robot (+Z forward, +X right, yaw quay thuận chiều kim đồng hồ tới +X)
    const cosY = Math.cos(pose.yawRad);
    const sinY = Math.sin(pose.yawRad);
    const rx = lxM * cosY + lzM * sinY;
    const rz = -lxM * sinY + lzM * cosY;
    const ry = lyM;

    // 2. Xoay theo góc orbit camera nếu có
    let rxO = rx;
    let rzO = rz;
    if (orbitYaw !== 0) {
      const cosO = Math.cos(orbitYaw);
      const sinO = Math.sin(orbitYaw);
      rxO = rx * cosO - rz * sinO;
      rzO = rx * sinO + rz * cosO;
    }

    // 3. Chiếu isometric
    const screenX = cx + (rxO - rzO) * cos30 * isoScale;
    const screenY = cy + (rxO + rzO) * sin30 * isoScale * 0.6 - ry * isoScale;
    return [screenX, screenY];
  };

  // Chiếu bóng đổ xuống sàn Y=0 theo vector nguồn sáng
  const projectShadowPoint = (lxM: number, lyM: number, lzM: number): [number, number] => {
    const cosY = Math.cos(pose.yawRad);
    const sinY = Math.sin(pose.yawRad);
    const rx = lxM * cosY + lzM * sinY;
    const rz = -lxM * sinY + lzM * cosY;
    const ry = Math.max(0, lyM);

    // Dời theo tia sáng xuống Y=0
    const shadowRx = rx - ry * (Lx / Ly);
    const shadowRz = rz - ry * (Lz / Ly);

    let rxO = shadowRx;
    let rzO = shadowRz;
    if (orbitYaw !== 0) {
      const cosO = Math.cos(orbitYaw);
      const sinO = Math.sin(orbitYaw);
      rxO = shadowRx * cosO - shadowRz * sinO;
      rzO = shadowRx * sinO + shadowRz * cosO;
    }

    const screenX = cx + (rxO - rzO) * cos30 * isoScale;
    const screenY = cy + (rxO + rzO) * sin30 * isoScale * 0.6;
    return [screenX, screenY];
  };

  // Tính độ sáng của một mặt có pháp tuyến cục bộ [nx, ny, nz]
  const calcFaceIntensity = (localNx: number, localNy: number, localNz: number): number => {
    // Xoay pháp tuyến theo yaw robot
    const cosY = Math.cos(pose.yawRad);
    const sinY = Math.sin(pose.yawRad);
    const wNx = localNx * cosY + localNz * sinY;
    const wNz = -localNx * sinY + localNz * cosY;
    const wNy = localNy;

    // Tích vô hướng N · L
    const dot = wNx * Lx + wNy * Ly + wNz * Lz;
    // Phong-Blinn diffuse + ambient
    const ambient = 0.36;
    const diffuse = 0.64;
    return Math.max(0.25, Math.min(1.25, ambient + diffuse * Math.max(0, dot)));
  };

  // Vẽ hình hộp 3D đầy đủ 6 mặt với diffuse shading và viền vát cạnh
  const drawIsoBox = (
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number,
    baseColor: string,
    borderColor?: string,
    isHighlighted?: boolean
  ) => {
    const p000 = projectPoint(minX, minY, minZ);
    const p100 = projectPoint(maxX, minY, minZ);
    const p101 = projectPoint(maxX, minY, maxZ);
    const p001 = projectPoint(minX, minY, maxZ);

    const p010 = projectPoint(minX, maxY, minZ);
    const p110 = projectPoint(maxX, maxY, minZ);
    const p111 = projectPoint(maxX, maxY, maxZ);
    const p011 = projectPoint(minX, maxY, maxZ);

    ctx.save();
    ctx.lineWidth = isHighlighted ? 2.5 : 1;
    ctx.strokeStyle = isHighlighted ? '#FBBF24' : (borderColor || '#0F172A');

    if (isWire) {
      ctx.beginPath();
      // Đáy
      ctx.moveTo(p000[0], p000[1]); ctx.lineTo(p100[0], p100[1]);
      ctx.lineTo(p101[0], p101[1]); ctx.lineTo(p001[0], p001[1]); ctx.closePath();
      // Nắp
      ctx.moveTo(p010[0], p010[1]); ctx.lineTo(p110[0], p110[1]);
      ctx.lineTo(p111[0], p111[1]); ctx.lineTo(p011[0], p011[1]); ctx.closePath();
      // 4 cọc đứng
      ctx.moveTo(p000[0], p000[1]); ctx.lineTo(p010[0], p010[1]);
      ctx.moveTo(p100[0], p100[1]); ctx.lineTo(p110[0], p110[1]);
      ctx.moveTo(p101[0], p101[1]); ctx.lineTo(p111[0], p111[1]);
      ctx.moveTo(p001[0], p001[1]); ctx.lineTo(p011[0], p011[1]);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 1. Mặt trước (+Z)
    const intFront = calcFaceIntensity(0, 0, 1);
    ctx.fillStyle = shadeColor(baseColor, isHighlighted ? Math.max(1.0, intFront) : intFront);
    ctx.beginPath();
    ctx.moveTo(p001[0], p001[1]);
    ctx.lineTo(p101[0], p101[1]);
    ctx.lineTo(p111[0], p111[1]);
    ctx.lineTo(p011[0], p011[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Mặt bên phải (+X)
    const intRight = calcFaceIntensity(1, 0, 0);
    ctx.fillStyle = shadeColor(baseColor, isHighlighted ? Math.max(1.0, intRight) : intRight);
    ctx.beginPath();
    ctx.moveTo(p100[0], p100[1]);
    ctx.lineTo(p101[0], p101[1]);
    ctx.lineTo(p111[0], p111[1]);
    ctx.lineTo(p110[0], p110[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Mặt trên (+Y)
    const intTop = calcFaceIntensity(0, 1, 0);
    ctx.fillStyle = shadeColor(baseColor, isHighlighted ? 1.15 : intTop);
    ctx.beginPath();
    ctx.moveTo(p010[0], p010[1]);
    ctx.lineTo(p110[0], p110[1]);
    ctx.lineTo(p111[0], p111[1]);
    ctx.lineTo(p011[0], p011[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  // ----------------------------------------------------
  // 1. BÓNG ĐỔ ĐỊNH HƯỚNG & TIẾP XÚC SÀN (GROUND SHADOWS)
  // ----------------------------------------------------
  if (!isWire && options?.showShadow !== false) {
    // Bóng tiếp xúc dưới 2 vệt xích (Contact Ambient Occlusion)
    const trackWidthM = 0.045;
    const trackSpacingM = 0.20;
    const trackLengthM = 0.40;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
    [-1, 1].forEach(side => {
      const cxTrack = side * (trackSpacingM / 2);
      const halfW = trackWidthM / 2 + 0.006;
      const halfL = trackLengthM / 2 + 0.005;
      const c1 = projectPoint(cxTrack - halfW, 0.001, -halfL);
      const c2 = projectPoint(cxTrack + halfW, 0.001, -halfL);
      const c3 = projectPoint(cxTrack + halfW, 0.001, halfL);
      const c4 = projectPoint(cxTrack - halfW, 0.001, halfL);
      ctx.beginPath();
      ctx.moveTo(c1[0], c1[1]);
      ctx.lineTo(c2[0], c2[1]);
      ctx.lineTo(c3[0], c3[1]);
      ctx.lineTo(c4[0], c4[1]);
      ctx.closePath();
      ctx.fill();
    });

    // Bóng đổ xiên theo hướng ánh sáng (Directional Cast Shadow)
    const shCorners = [
      projectShadowPoint(-0.13, 0.06, -0.21),
      projectShadowPoint(0.13, 0.06, -0.21),
      projectShadowPoint(0.13, 0.06, 0.21),
      projectShadowPoint(-0.13, 0.06, 0.21),
    ];
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.moveTo(shCorners[0][0], shCorners[0][1]);
    ctx.lineTo(shCorners[1][0], shCorners[1][1]);
    ctx.lineTo(shCorners[2][0], shCorners[2][1]);
    ctx.lineTo(shCorners[3][0], shCorners[3][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ----------------------------------------------------
  // 2. HAI CỤM BÁNH XÍCH & TRUYỀN ĐỘNG ĐỘNG (DUAL CONTINUOUS TRACKS)
  // ----------------------------------------------------
  const isTrkHigh = highlightComponentId === 'track_assembly';
  const trackSpacingM = 0.20; // 200mm tâm xích
  const trackWidthM = 0.045;  // 45mm bề rộng
  const trackHeightM = 0.07; // 70mm
  const trackLengthM = 0.40; // 400mm tổng chiều dài
  const wheelRadiusM = 0.035; // R=35mm cho Sprocket & Idler
  const roadWheelRadiusM = 0.025; // R=25mm cho 4 bánh tì chạm đất

  [-1, 1].forEach(side => {
    const isLeft = side < 0;
    const tCenter = side * (trackSpacingM / 2);
    const minX = tCenter - trackWidthM / 2;
    const maxX = tCenter + trackWidthM / 2;
    const trackKin = isLeft ? kin.leftTrack : kin.rightTrack;

    // Vỏ dải xích chính (Main Track Body)
    drawIsoBox(
      minX, maxX,
      0.002, trackHeightM,
      -trackLengthM / 2, trackLengthM / 2,
      isTrkHigh ? '#F59E0B' : '#1E293B',
      isTrkHigh ? '#FBBF24' : '#0F172A',
      isTrkHigh
    );

    // GAI XÍCH ĐỘNG (Moving Track Cleats / Treads)
    // 14 vấu xích cuộn chuyển động quanh chu vi dải xích
    if (!isWire) {
      const numCleats = 12;
      const perimeterM = 2 * (trackLengthM - wheelRadiusM * 2) + 2 * Math.PI * wheelRadiusM;
      const travelM = trackKin.travelDistanceM || (trackKin.wheelAngleRad * wheelRadiusM);
      const halfW = trackWidthM / 2;

      ctx.save();
      ctx.strokeStyle = isTrkHigh ? '#FDE68A' : '#475569';
      ctx.lineWidth = 1.8;
      for (let c = 0; c < numCleats; c++) {
        const offset = ((c / numCleats) * perimeterM + travelM) % perimeterM;
        const sNorm = (offset + perimeterM) % perimeterM;
        const straightLen = trackLengthM - wheelRadiusM * 2;

        let czM = 0;
        let cyM = trackHeightM;
        if (sNorm < straightLen) {
          // Đoạn trên cùng chạy từ sau ra trước (-Z đến +Z)
          czM = -trackLengthM / 2 + wheelRadiusM + sNorm;
          cyM = trackHeightM + 0.002;
        } else if (sNorm < straightLen + Math.PI * wheelRadiusM) {
          // Vòng cung trước (Front curve)
          const angle = (sNorm - straightLen) / wheelRadiusM;
          czM = trackLengthM / 2 - wheelRadiusM + wheelRadiusM * Math.sin(angle);
          cyM = wheelRadiusM + wheelRadiusM * Math.cos(angle);
        } else if (sNorm < straightLen * 2 + Math.PI * wheelRadiusM) {
          // Đoạn dưới cùng chạm sàn chạy từ trước về sau (+Z đến -Z)
          const dBot = sNorm - (straightLen + Math.PI * wheelRadiusM);
          czM = trackLengthM / 2 - wheelRadiusM - dBot;
          cyM = 0.002;
        } else {
          // Vòng cung sau (Rear curve)
          const angle = (sNorm - (straightLen * 2 + Math.PI * wheelRadiusM)) / wheelRadiusM;
          czM = -trackLengthM / 2 + wheelRadiusM - wheelRadiusM * Math.sin(angle);
          cyM = wheelRadiusM - wheelRadiusM * Math.cos(angle);
        }

        // Vẽ vấu xích cắt ngang
        const pt1 = projectPoint(tCenter - halfW * 0.9, cyM, czM);
        const pt2 = projectPoint(tCenter + halfW * 0.9, cyM, czM);
        ctx.beginPath();
        ctx.moveTo(pt1[0], pt1[1]);
        ctx.lineTo(pt2[0], pt2[1]);
        ctx.stroke();
      }
      ctx.restore();
    }

    // BÁNH CHỦ ĐỘNG PHÍA SAU (Rear Drive Sprocket Wheel R=35mm, Z = -0.165m)
    const sprockZ = -trackLengthM / 2 + wheelRadiusM;
    const sprockY = wheelRadiusM;
    const sprockCenter = projectPoint(tCenter + (side > 0 ? 0.002 : -0.002), sprockY, sprockZ);
    if (!isWire) {
      ctx.save();
      ctx.fillStyle = isTrkHigh ? '#F59E0B' : '#475569';
      ctx.beginPath();
      ctx.arc(sprockCenter[0], sprockCenter[1], wheelRadiusM * isoScale * 0.65, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Tâm trục bánh xích
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.arc(sprockCenter[0], sprockCenter[1], 3.5, 0, 2 * Math.PI);
      ctx.fill();

      // Răng đĩa xích quay theo wheelAngleRad
      ctx.save();
      ctx.translate(sprockCenter[0], sprockCenter[1]);
      ctx.rotate(trackKin.wheelAngleRad);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      for (let t = 0; t < 6; t++) {
        const ang = (t * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 4, Math.sin(ang) * 4);
        ctx.lineTo(Math.cos(ang) * (wheelRadiusM * isoScale * 0.6), Math.sin(ang) * (wheelRadiusM * isoScale * 0.6));
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    }

    // BÁNH DẪN HƯỚNG PHÍA TRƯỚC (Front Idler Wheel with Tensioner, Z = +0.165m)
    const idlerZ = trackLengthM / 2 - wheelRadiusM;
    const idlerCenter = projectPoint(tCenter + (side > 0 ? 0.002 : -0.002), sprockY, idlerZ);
    if (!isWire) {
      ctx.save();
      ctx.fillStyle = isTrkHigh ? '#F59E0B' : '#475569';
      ctx.beginPath();
      ctx.arc(idlerCenter[0], idlerCenter[1], wheelRadiusM * isoScale * 0.65, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.arc(idlerCenter[0], idlerCenter[1], 3.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // 4 CẶP BÁNH TÌ CHỊU TẢI (4 Road Wheels R=25mm touching ground)
    const numRoad = 4;
    const roadSpanZ = idlerZ - sprockZ - wheelRadiusM * 1.5;
    for (let r = 0; r < numRoad; r++) {
      const rwZ = sprockZ + wheelRadiusM * 0.75 + (r / (numRoad - 1)) * roadSpanZ;
      const rwCenter = projectPoint(tCenter + (side > 0 ? 0.003 : -0.003), roadWheelRadiusM, rwZ);
      if (!isWire) {
        ctx.save();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(rwCenter[0], rwCenter[1], roadWheelRadiusM * isoScale * 0.6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.0;
        ctx.stroke();
        // Vòng bi tâm
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.arc(rwCenter[0], rwCenter[1], 2.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    }
  });

  // ----------------------------------------------------
  // 3. KHUNG GẦM DƯỚI CHÍNH (Lower Chassis 6061-T6 Aluminum Tray)
  // ----------------------------------------------------
  const isChasHigh = highlightComponentId === 'chassis_lower';
  drawIsoBox(
    -0.10, 0.10,
    0.035, 0.065,
    -0.16, 0.16,
    isChasHigh ? '#60A5FA' : '#1E40AF',
    isChasHigh ? '#FBBF24' : '#1E3A8A',
    isChasHigh
  );

  // Thanh cản trước gia cường hợp kim (Front Alloy Bumper)
  drawIsoBox(
    -0.105, 0.105,
    0.038, 0.062,
    0.158, 0.170,
    '#334155',
    '#0F172A'
  );

  // Thanh cản sau (Rear Bumper)
  drawIsoBox(
    -0.105, 0.105,
    0.038, 0.062,
    -0.170, -0.158,
    '#334155',
    '#0F172A'
  );

  // ----------------------------------------------------
  // 4. ĐỘNG CƠ GIẢM TỐC & KHỐI PIN LI-ION 7.4V
  // ----------------------------------------------------
  const isBatHigh = highlightComponentId === 'battery_pack';
  drawIsoBox(
    -0.05, 0.05,
    0.038, 0.060,
    -0.08, 0.08,
    isBatHigh ? '#34D399' : '#047857',
    isBatHigh ? '#FBBF24' : '#064E3B',
    isBatHigh
  );

  // 2 Động cơ DC Encoder Gearmotors khoang gầm sau
  const isMotorHigh = highlightComponentId === 'dc_motors';
  [-0.07, 0.03].forEach(mx => {
    drawIsoBox(
      mx, mx + 0.04,
      0.038, 0.058,
      -0.14, -0.09,
      isMotorHigh ? '#F59E0B' : '#475569',
      '#0F172A',
      isMotorHigh
    );
  });

  // ----------------------------------------------------
  // 5. CỌC ĐỒNG NỐI TẦNG M3 X 35MM (Brass Standoffs)
  // ----------------------------------------------------
  const stCoords = [
    [-0.08, -0.14], [0.08, -0.14],
    [-0.08, 0.14], [0.08, 0.14]
  ];
  ctx.save();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.8;
  stCoords.forEach(([sx, sz]) => {
    const pBottom = projectPoint(sx, 0.065, sz);
    const pTop = projectPoint(sx, 0.095, sz);
    ctx.beginPath();
    ctx.moveTo(pBottom[0], pBottom[1]);
    ctx.lineTo(pTop[0], pTop[1]);
    ctx.stroke();
  });
  ctx.restore();

  // ----------------------------------------------------
  // 6. SÀN BO MẠCH TRÊN (Upper Acrylic Electronics Deck)
  // ----------------------------------------------------
  const isDeckHigh = highlightComponentId === 'upper_deck';
  drawIsoBox(
    -0.09, 0.09,
    0.095, 0.100,
    -0.15, 0.15,
    isDeckHigh ? '#93C5FD' : '#0284C7',
    isDeckHigh ? '#FBBF24' : '#0369A1',
    isDeckHigh
  );

  // ----------------------------------------------------
  // 7. JETSON NANO DEV KIT B01 VỚI HEATSINK RÃNH NHÔM ĐEN
  // ----------------------------------------------------
  const isJetHigh = highlightComponentId === 'jetson_board';
  // PCB Xanh lá
  drawIsoBox(
    -0.06, 0.06,
    0.100, 0.106,
    -0.07, 0.07,
    isJetHigh ? '#10B981' : '#065F46',
    isJetHigh ? '#FBBF24' : '#047857',
    isJetHigh
  );

  // Heatsink tản nhiệt rãnh sâu
  drawIsoBox(
    -0.045, 0.045,
    0.106, 0.126,
    -0.05, 0.05,
    isJetHigh ? '#64748B' : '#0F172A',
    '#1E293B',
    isJetHigh
  );

  // Cụm rãnh lá nhôm tản nhiệt (Heatsink Fins)
  if (!isWire) {
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.0;
    for (let f = -4; f <= 4; f++) {
      const fz = (f / 5) * 0.045;
      const fTop1 = projectPoint(-0.045, 0.126, fz);
      const fTop2 = projectPoint(0.045, 0.126, fz);
      ctx.beginPath();
      ctx.moveTo(fTop1[0], fTop1[1]);
      ctx.lineTo(fTop2[0], fTop2[1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Cụm I/O USB 3.0 / Ethernet phía sau bo mạch
  drawIsoBox(
    -0.055, -0.015,
    0.106, 0.120,
    -0.072, -0.065,
    '#2563EB',
    '#0F172A'
  );
  drawIsoBox(
    -0.010, 0.025,
    0.106, 0.120,
    -0.072, -0.065,
    '#475569',
    '#0F172A'
  );

  // ----------------------------------------------------
  // 8. CẢM BIẾN SIÊU ÂM KÉP HC-SR04 Ở CẢN TRƯỚC
  // ----------------------------------------------------
  const isUsHigh = highlightComponentId === 'ultrasonic_sensor';
  // PCB module siêu âm
  drawIsoBox(
    -0.035, 0.035,
    0.068, 0.088,
    0.165, 0.174,
    isUsHigh ? '#67E8F9' : '#0284C7',
    isUsHigh ? '#FBBF24' : '#0369A1',
    isUsHigh
  );
  // 2 đầu dò siêu âm kim loại tròn T & R
  if (!isWire) {
    [-0.018, 0.018].forEach(ux => {
      const uCenter = projectPoint(ux, 0.078, 0.178);
      ctx.save();
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(uCenter[0], uCenter[1], 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Lưới tâm
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.arc(uCenter[0], uCenter[1], 2.2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });
  }

  // ----------------------------------------------------
  // 9. CỤM PAN-TILT GIMBAL CAMERA CSI IMX219
  // ----------------------------------------------------
  const isCamHigh = highlightComponentId === 'camera_gimbal';
  // Khung đế xoay Servo Pan
  drawIsoBox(
    -0.020, 0.020,
    0.100, 0.122,
    0.110, 0.138,
    isCamHigh ? '#C084FC' : '#4F46E5',
    isCamHigh ? '#FBBF24' : '#3730A3',
    isCamHigh
  );

  // Đầu Camera xoay theo Pan servo và Tilt servo
  const panRad = dev.servoPanRad || 0;
  const tiltRad = dev.servoTiltRad || 0;
  const camLocalX = 0.015 * Math.sin(panRad);
  const camLocalZ = 0.138 + 0.015 * Math.cos(panRad);
  const camLocalY = 0.132 + 0.010 * Math.sin(tiltRad);

  drawIsoBox(
    camLocalX - 0.012, camLocalX + 0.012,
    camLocalY - 0.010, camLocalY + 0.010,
    camLocalZ - 0.010, camLocalZ + 0.010,
    isCamHigh ? '#A855F7' : '#1E1B4B',
    '#0F172A',
    isCamHigh
  );

  // Ống kính quang học Sony IMX219 hướng tới trước (+Z)
  if (!isWire) {
    const lensCenter = projectPoint(camLocalX, camLocalY, camLocalZ + 0.014);
    ctx.save();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(lensCenter[0], lensCenter[1], 5.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Phản xạ quang học thấu kính
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(lensCenter[0] - 1, lensCenter[1] - 1, 2.2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  // ----------------------------------------------------
  // 10. THÁP CẢM BIẾN RPLIDAR A1 360° (LIDAR PUCK ON TOP)
  // ----------------------------------------------------
  const isLidHigh = highlightComponentId === 'rplidar_sensor';
  // Trụ đế LIDAR
  drawIsoBox(
    -0.025, 0.025,
    0.100, 0.125,
    -0.025, 0.025,
    isLidHigh ? '#06B6D4' : '#1E293B',
    isLidHigh ? '#FBBF24' : '#0F172A',
    isLidHigh
  );

  // Nắp tròn LIDAR xoay quét 360°
  const lidBase = projectPoint(0, 0.125, 0);
  const lidTop = projectPoint(0, 0.155, 0);
  if (!isWire) {
    ctx.save();
    // Thân trụ tròn LIDAR
    ctx.fillStyle = isLidHigh ? '#0891B2' : '#0F172A';
    ctx.beginPath();
    ctx.ellipse(lidBase[0], lidBase[1], 15, 8, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Nắp xoay trên
    ctx.fillStyle = isLidHigh ? '#22D3EE' : '#1E293B';
    ctx.beginPath();
    ctx.ellipse(lidTop[0], lidTop[1], 15, 8, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tia quét Laser xoay thời gian thực
    const scanSpin = (Date.now() / 120) % (2 * Math.PI);
    const laserRayLen = 14;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(lidTop[0], lidTop[1]);
    ctx.lineTo(lidTop[0] + laserRayLen * Math.cos(scanSpin), lidTop[1] + laserRayLen * Math.sin(scanSpin) * 0.6);
    ctx.stroke();
    ctx.restore();
  }

  // ----------------------------------------------------
  // 11. ĐÈN LED RGB & MÀN HÌNH TM1637 TRÊN SÀN SAU
  // ----------------------------------------------------
  const isLedHigh = highlightComponentId === 'peripherals_safety';
  // Màn hình 4 số 7 đoạn TM1637
  drawIsoBox(
    -0.080, -0.035,
    0.100, 0.114,
    -0.145, -0.125,
    '#0F172A',
    '#334155'
  );

  // Đèn LED RGB 10mm với quầng sáng tỏa (Volumetric Glow)
  const ledPt = projectPoint(0.040, 0.106, -0.135);
  const ledColors: Record<string, { fill: string; glow: string }> = {
    green: { fill: '#22C55E', glow: 'rgba(34, 197, 94, 0.55)' },
    amber: { fill: '#F59E0B', glow: 'rgba(245, 158, 11, 0.55)' },
    red: { fill: '#EF4444', glow: 'rgba(239, 68, 68, 0.55)' },
    off: { fill: '#64748B', glow: 'rgba(100, 116, 139, 0.10)' },
  };
  const activeLed = ledColors[dev.statusLED] || ledColors.off;

  if (!isWire) {
    ctx.save();
    // Quầng sáng
    ctx.fillStyle = activeLed.glow;
    ctx.beginPath();
    ctx.arc(ledPt[0], ledPt[1], 9, 0, 2 * Math.PI);
    ctx.fill();
    // Bóng LED tròn
    ctx.fillStyle = activeLed.fill;
    ctx.beginPath();
    ctx.arc(ledPt[0], ledPt[1], 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
}

// ====================================================================
// 3. VẼ HÌNH CHIẾU CẠNH CƠ KHÍ CAD (SIDE PROFILE WITH DIMENSIONS)
// ====================================================================
export function drawSideProfileCAD(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  sensors: SensorData,
  w: number,
  h: number,
  scale: number,
  highlightComponentId?: string | null
) {
  ctx.fillStyle = '#0F172A'; // Nền xanh đen kỹ thuật CAD
  ctx.fillRect(0, 0, w, h);

  // Lưới tọa độ cơ khí CAD (Grid)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  const gridPx = 25;
  for (let x = 0; x < w; x += gridPx) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridPx) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const groundY = h * 0.72;
  const pScale = Math.max(280, scale * 3.2); // Pixels per meter

  // Đường mặt sàn (Ground Plane)
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, groundY);
  ctx.lineTo(w - 40, groundY);
  ctx.stroke();

  // Nét gạch chéo tiếp xúc đất
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.lineWidth = 1;
  for (let x = 40; x < w - 40; x += 15) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x - 10, groundY + 10);
    ctx.stroke();
  }

  const cx = w / 2;
  const rL = 0.32 * pScale;        // 320mm
  const rH = 0.12 * pScale;        // 120mm
  const trkL = 0.40 * pScale;      // 400mm
  const wheelR = 0.035 * pScale;   // 35mm
  const roadR = 0.025 * pScale;    // 25mm
  const clearance = 0.035 * pScale;// 35mm

  // 1. CỤM BÁNH XÍCH VÀ CÁC BÁNH LĂN CHIẾU CẠNH
  const isTrkHigh = highlightComponentId === 'track_assembly';
  ctx.save();
  // Vòng bao xích (Track outline với góc tiếp cận nghiêng)
  const rearAxleX = cx - trkL / 2 + wheelR;
  const frontAxleX = cx + trkL / 2 - wheelR;
  const axleY = groundY - wheelR;

  // Dải xích cao su khép kín
  ctx.strokeStyle = isTrkHigh ? '#F59E0B' : '#0284C7';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(rearAxleX - wheelR, groundY - wheelR * 2, trkL, wheelR * 2, wheelR);
  ctx.stroke();

  // Bánh chủ động phía sau (Drive Sprocket R=35mm)
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(rearAxleX, axleY, wheelR, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bánh chuyển hướng phía trước (Idler Wheel R=35mm)
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(frontAxleX, axleY, wheelR, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // 4 Bánh tì chịu lực ở giữa (4 Road Wheels R=25mm chạm đất)
  const numRoad = 4;
  const roadSpan = frontAxleX - rearAxleX - wheelR * 2;
  for (let i = 0; i < numRoad; i++) {
    const rx = rearAxleX + wheelR + (i / (numRoad - 1)) * roadSpan;
    const ry = groundY - roadR;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(rx, ry, roadR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Vòng bi tâm
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();

  // 2. KHUNG GẦM DƯỚI (Lower Chassis)
  const isChasHigh = highlightComponentId === 'chassis_lower';
  const chassisBottomY = groundY - clearance;
  const chassisLowerH = 0.035 * pScale;
  ctx.fillStyle = isChasHigh ? '#3B82F6' : '#1E293B';
  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - rL / 2, chassisBottomY - chassisLowerH, rL, chassisLowerH, 4);
  ctx.fill();
  ctx.stroke();

  // 3. KHAY PIN LI-ION
  const isBatHigh = highlightComponentId === 'battery_pack';
  ctx.fillStyle = isBatHigh ? '#10B981' : '#047857';
  ctx.fillRect(cx - rL * 0.25, chassisBottomY - chassisLowerH + 4, rL * 0.5, chassisLowerH - 8);

  // 4. CỌC ĐỒNG NỐI TẦNG (Standoffs)
  const standoffH = 0.035 * pScale;
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - rL * 0.4, chassisBottomY - chassisLowerH);
  ctx.lineTo(cx - rL * 0.4, chassisBottomY - chassisLowerH - standoffH);
  ctx.moveTo(cx + rL * 0.4, chassisBottomY - chassisLowerH);
  ctx.lineTo(cx + rL * 0.4, chassisBottomY - chassisLowerH - standoffH);
  ctx.stroke();

  // 5. SÀN TRÊN ACRYLIC (Upper Deck)
  const isDeckHigh = highlightComponentId === 'upper_deck';
  const deckY = chassisBottomY - chassisLowerH - standoffH;
  ctx.fillStyle = isDeckHigh ? '#38BDF8' : '#334155';
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - rL / 2 + 10, deckY - 6, rL - 20, 6);

  // 6. BO MẠCH JETSON NANO VỚI HEATSINK
  const isJetHigh = highlightComponentId === 'jetson_board';
  const jetH = 0.03 * pScale;
  ctx.fillStyle = isJetHigh ? '#10B981' : '#0F172A';
  ctx.fillRect(cx - 30, deckY - 6 - jetH, 60, jetH);
  ctx.strokeStyle = '#10B981';
  ctx.strokeRect(cx - 30, deckY - 6 - jetH, 60, jetH);

  // 7. THÁP RPLIDAR A1 TRÊN ĐỈNH
  const isLidHigh = highlightComponentId === 'rplidar_sensor';
  const lidH = 0.035 * pScale;
  ctx.fillStyle = isLidHigh ? '#06B6D4' : '#1E293B';
  ctx.beginPath();
  ctx.roundRect(cx - 18, deckY - 6 - jetH - lidH, 36, lidH, 4);
  ctx.fill();
  ctx.strokeStyle = '#06B6D4';
  ctx.stroke();

  // 8. CỤM CAMERA GIMBAL & SIÊU ÂM PHÍA TRƯỚC (Bên phải màn hình = Front)
  const isUsHigh = highlightComponentId === 'ultrasonic_sensor';
  // Siêu âm
  ctx.fillStyle = isUsHigh ? '#38BDF8' : '#0284C7';
  ctx.fillRect(cx + rL / 2 - 4, chassisBottomY - chassisLowerH + 2, 14, 18);
  // Camera gimbal
  const isCamHigh = highlightComponentId === 'camera_gimbal';
  ctx.fillStyle = isCamHigh ? '#C084FC' : '#4F46E5';
  ctx.fillRect(cx + rL * 0.35, deckY - 24, 20, 18);

  // ----------------------------------------------------
  // ĐƯỜNG KÍCH THƯỚC KỸ THUẬT CHUẨN CAD (CAD DIMENSIONS)
  // ----------------------------------------------------
  const drawDimensionH = (x1: number, x2: number, y: number, label: string) => {
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    // Mũi tên hai đầu
    ctx.moveTo(x1, y - 4);
    ctx.lineTo(x1, y + 4);
    ctx.moveTo(x2, y - 4);
    ctx.lineTo(x2, y + 4);
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 11px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, y - 6);
  };

  const drawDimensionV = (x: number, y1: number, y2: number, label: string) => {
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    // Mũi tên hai đầu
    ctx.moveTo(x - 4, y1);
    ctx.lineTo(x + 4, y1);
    ctx.moveTo(x - 4, y2);
    ctx.lineTo(x + 4, y2);
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 11px "JetBrains Mono"';
    ctx.textAlign = 'right';
    ctx.fillText(label, x - 8, (y1 + y2) / 2 + 4);
  };

  // Chiều dài khung: 320mm (0.32m)
  drawDimensionH(cx - rL / 2, cx + rL / 2, groundY + 28, 'Dài khung: 0.32m (320mm)');
  // Chiều dài dải xích: 400mm (0.40m)
  drawDimensionH(cx - trkL / 2, cx + trkL / 2, groundY + 52, 'Dài dải xích: 0.40m (400mm)');

  // Khoảng sáng gầm xe: 35mm (0.035m)
  drawDimensionV(cx - rL / 2 - 25, groundY, chassisBottomY, 'Gầm: 0.035m');

  // Chiều cao thân: 120mm (0.12m)
  drawDimensionV(cx - rL / 2 - 80, groundY, deckY, 'Cao thân: 0.12m');

  // Chiều cao tổng thể gồm LIDAR: 165mm
  drawDimensionV(cx - rL / 2 - 145, groundY, deckY - 6 - jetH - lidH, 'Tổng: 0.165m');

  // Tiêu đề HUD CAD
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 13px "JetBrains Mono"';
  ctx.textAlign = 'left';
  ctx.fillText('BẢN VẼ HÌNH CHIẾU CẠNH CƠ KHÍ CAD (MECHANICAL SIDE PROFILE)', 20, 40);
  ctx.font = '11px "JetBrains Mono"';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Tỷ lệ thực 1:1 · Khung 2 tầng hợp kim nhôm · Bánh xích dẫn hướng kép', 20, 60);
}

// ====================================================================
// 4. VẼ CHẾ ĐỘ PHÓNG TO CHI TIẾT ROBOT & CHẨN ĐOÁN (INSPECTOR MODE)
// ====================================================================
export function drawInspectorRobotDetailed(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  sensors: SensorData,
  w: number,
  h: number,
  orbitYawRad: number,
  diagMode: RobotDiagnosticMode,
  selectedComponentId?: string | null
) {
  ctx.fillStyle = '#0B132B';
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.45; // Để chừa lề phải cho bảng thông số
  const cy = h * 0.52;
  const zoomScale = Math.min(w, h) * 0.95; // Phóng đại cao

  // Chế độ tạo pose với góc quay orbit người dùng chỉnh
  const inspectorPose: RobotPose = {
    xM: 0,
    yM: 0,
    zM: 0,
    yawRad: orbitYawRad,
  };

  // Trục tọa độ cơ sở (Grid sàn nhỏ)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  const rad = 140;
  ctx.beginPath();
  ctx.arc(cx, cy + 80, rad, 0, 2 * Math.PI);
  ctx.stroke();

  // 1. Chế độ Wireframe (Khung dây)
  if (diagMode === 'wireframe') {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    // Vẽ khung dây thực tế
    drawTrackedRobot3DIsometric(ctx, inspectorPose, kin, dev, sensors, cx, cy, zoomScale * 0.65, selectedComponentId, { wireframeOnly: true });
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 12px "JetBrains Mono"';
    ctx.fillText('CHẾ ĐỘ KHUNG DÂY ĐA GIÁC (3D WIREFRAME MESH)', 20, 40);
  }
  // 2. Chế độ Vùng va chạm (Collision Hull)
  else if (diagMode === 'collision') {
    drawTrackedRobot3DIsometric(ctx, inspectorPose, kin, dev, sensors, cx, cy, zoomScale * 0.65, selectedComponentId);
    // Vẽ Hộp Bounding Box va chạm
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(cx - 95, cy - 80, 190, 160);
    ctx.setLineDash([]);
    // Hình trụ bán kính an toàn
    ctx.strokeStyle = '#F59E0B';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 70, 120, 60, 0, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 12px "JetBrains Mono"';
    ctx.fillText('VÙNG BAO VA CHẠM THỰC TẾ (COLLISION HULL & BOUNDING BOX)', 20, 40);
    ctx.font = '11px "JetBrains Mono"';
    ctx.fillStyle = '#FCA5A5';
    ctx.fillText('Kích thước bao: 0.22m × 0.32m × 0.12m · Bán kính bảo vệ: 0.194m', 20, 60);
  }
  // 3. Chế độ Trục tọa độ cục bộ (Local Coordinate Axes)
  else if (diagMode === 'axes') {
    drawTrackedRobot3DIsometric(ctx, inspectorPose, kin, dev, sensors, cx, cy, zoomScale * 0.65, selectedComponentId);

    const axisLen = 90;
    // Trục +Z (Forward - Xanh lam)
    const fwdX = cx + axisLen * Math.sin(orbitYawRad);
    const fwdY = cy - axisLen * Math.cos(orbitYawRad) * 0.6;
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(fwdX, fwdY);
    ctx.stroke();
    ctx.fillStyle = '#3B82F6';
    ctx.font = 'bold 12px "JetBrains Mono"';
    ctx.fillText('+Z (Forward)', fwdX + 8, fwdY);

    // Trục +X (Lateral Right - Đỏ)
    const rightX = cx + axisLen * Math.cos(orbitYawRad);
    const rightY = cy + axisLen * Math.sin(orbitYawRad) * 0.6;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(rightX, rightY);
    ctx.stroke();
    ctx.fillStyle = '#EF4444';
    ctx.fillText('+X (Right)', rightX + 8, rightY);

    // Trục +Y (Vertical Up - Xanh lục)
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - axisLen);
    ctx.stroke();
    ctx.fillStyle = '#10B981';
    ctx.fillText('+Y (Up)', cx + 8, cy - axisLen);

    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('HỆ TRỤC TỌA ĐỘ CỤC BỘ ROBOT (LOCAL FRAME: +X PHẢI, +Y LÊN, +Z TIẾN)', 20, 40);
  }
  // 4. Mặc định / Components / Realistic
  else {
    drawTrackedRobot3DIsometric(ctx, inspectorPose, kin, dev, sensors, cx, cy, zoomScale * 0.72, selectedComponentId);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 13px "JetBrains Mono"';
    ctx.fillText('CHẾ ĐỘ QUAN SÁT CHI TIẾT LINH KIỆN CƠ KHÍ (3D MECHANICAL INSPECTOR)', 20, 36);
    ctx.font = '11px "JetBrains Mono"';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Kéo chuột hoặc nhấn nút xoay để quan sát 360° · Nhấp chọn linh kiện để xem thông số', 20, 56);
  }
}

// ====================================================================
// 5. GÓC NHÌN BÁM ĐUÔI ROBOT 3D (CHASE CAMERA)
// ====================================================================
export function drawChaseCamRobot3D(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  w: number,
  h: number,
  highlightComponentId?: string | null
) {
  // Điểm đặt robot trên màn hình chase cam
  const rx = w / 2;
  const ry = h * 0.75;
  const scale = 220;

  ctx.save();
  // Bóng tiếp xúc
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(rx, ry + 16, 75, 20, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Hai cụm xích lăn phía sau
  const trackW = 34;
  const trackH = 46;
  const trackSpacing = 140;

  [-1, 1].forEach(side => {
    const tx = rx + side * (trackSpacing / 2);
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(tx - trackW / 2, ry - trackH / 2, trackW, trackH, 6);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vấu xích cuộn chuyển động
    const phase = side < 0 ? kin.leftTrack.phase : kin.rightTrack.phase;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const yRib = ry - trackH / 2 + (((i + phase) % 4) / 4) * trackH;
      ctx.beginPath();
      ctx.moveTo(tx - trackW / 2 + 3, yRib);
      ctx.lineTo(tx + trackW / 2 - 3, yRib);
      ctx.stroke();
    }
  });

  // Thân xe phía sau (Đuôi xe)
  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.roundRect(rx - 55, ry - 32, 110, 48, 6);
  ctx.fill();
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cản sau kim loại
  ctx.fillStyle = '#334155';
  ctx.fillRect(rx - 65, ry + 10, 130, 8);

  // Đèn LED trạng thái tỏa sáng ở đuôi
  const ledColors: Record<string, string> = {
    green: '#22C55E',
    amber: '#F59E0B',
    red: '#EF4444',
    off: '#64748B',
  };
  ctx.fillStyle = ledColors[dev.statusLED] || '#64748B';
  ctx.beginPath();
  ctx.arc(rx, ry - 6, 7, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Khối Heatsink Jetson Nano nhô lên
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(rx - 28, ry - 54, 56, 24);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(rx - 28, ry - 54, 56, 24);

  // Tháp RPLIDAR A1 trên nóc
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(rx, ry - 68, 18, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Đầu Gimbal Camera phía trước nhô lên (quay theo pan servo)
  const panOffset = (dev.servoPanRad || 0) * 22;
  ctx.fillStyle = '#4F46E5';
  ctx.beginPath();
  ctx.arc(rx + panOffset, ry - 42, 10, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();
}

// ====================================================================
// 6. GÓC NHÌN THỨ NHẤT & HUD CHIẾN THUẬT ROBOT (FIRST PERSON COCKPIT)
// ====================================================================
export function drawFirstPersonCockpitHUD(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  kin: RobotKinematics,
  dev: DeviceState,
  sensors: SensorData,
  w: number,
  h: number
) {
  const cx = w / 2;
  const cy = h / 2;

  // Khung ngắm chữ thập trung tâm (Crosshairs)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy);
  ctx.lineTo(cx - 8, cy);
  ctx.moveTo(cx + 8, cy);
  ctx.lineTo(cx + 30, cy);
  ctx.moveTo(cx, cy - 30);
  ctx.lineTo(cx, cy - 8);
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx, cy + 30);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
  ctx.stroke();

  // Vạch chân trời nhân tạo Artificial Horizon
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(40, cy);
  ctx.lineTo(cx - 45, cy);
  ctx.moveTo(cx + 45, cy);
  ctx.lineTo(w - 40, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Thước đo Servo Pan & Tilt
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(16, h - 86, 210, 70);
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1;
  ctx.strokeRect(16, h - 86, 210, 70);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 11px "JetBrains Mono"';
  ctx.fillText('CAMERA GIMBAL GÓC QUAY:', 26, h - 68);
  ctx.font = '10px "JetBrains Mono"';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText(`Pan:  ${((dev.servoPanRad || 0) * 180 / Math.PI).toFixed(1)}° (Trục ngang)`, 26, h - 50);
  ctx.fillText(`Tilt: ${((dev.servoTiltRad || 0) * 180 / Math.PI).toFixed(1)}° (Trục đứng)`, 26, h - 34);
  ctx.fillText(`Cự ly siêu âm: ${sensors.frontRangeM.toFixed(2)} m`, 26, h - 20);

  // Hiển thị các AprilTag phát hiện được
  if (sensors.detectedTags && sensors.detectedTags.length > 0) {
    sensors.detectedTags.forEach(tag => {
      const [tx, ty] = tag.centerPx;
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx - 35, ty - 35, 70, 70);

      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 10px "JetBrains Mono"';
      ctx.fillText(`TAG ID: #${tag.id}`, tx - 35, ty - 42);
      ctx.fillText(`Dist: ${tag.distanceM.toFixed(2)}m`, tx - 35, ty + 48);
    });
  }

  // Tiêu đề HUD
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 12px "JetBrains Mono"';
  ctx.fillText('GÓC NHÌN THỨ NHẤT CAMERA ROBOT (CSI IMX219 POV & HUD)', 16, 68);
}
