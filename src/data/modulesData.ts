import { ModuleLesson, SyllabusItem, CLOItem } from '../types/modules';

export const MODULES_DATA: ModuleLesson[] = [
  {
    id: 'M01',
    title: 'LED / GPIO Cơ Bản trên Jetson Nano',
    shortDesc: 'Bật/tắt LED, lập trình nhấp nháy 0.5s và chu kỳ 3s sáng / 1s tắt bằng Jetson.GPIO.',
    sourceFile: '1_led_test.ipynb',
    hardwareRequirements: ['1 LED', '1 Điện trở 330Ω (khuyến nghị)', 'Dây jumper + Breadboard', 'Jetson Nano 4GB'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Pin 11 (GPIO)', to: 'Điện trở 330Ω', note: 'Chân tín hiệu điều khiển' },
        { from: 'Điện trở 330Ω', to: 'LED Anode (+)', note: 'Hạn dòng bảo vệ LED' },
        { from: 'LED Cathode (-)', to: 'Pin 14 (GND)', note: 'Đóng mạch về đất' },
      ],
      description: 'Pin 11 ──── Điện trở 330Ω ──── LED (+) ──── LED (-) ──── Pin 14 (GND)',
    },
    learningOutcomes: ['LO11', 'LO13', 'LO14', 'LO17', 'LO19', 'LO20'],
    keyConcepts: ['Jetson.GPIO', 'GPIO.BOARD', 'GPIO.setup(11, GPIO.OUT)', 'GPIO.output(11, GPIO.HIGH/LOW)', 'GPIO.cleanup()', 'time.sleep()'],
    codeCellSource: `import Jetson.GPIO as GPIO
import time

GPIO.setmode(GPIO.BOARD)
GPIO.setup(11, GPIO.OUT)

print("LED ON (Sáng 2s)")
GPIO.output(11, GPIO.HIGH)
time.sleep(2)

print("LED OFF")
GPIO.output(11, GPIO.LOW)

# Nháy LED chu kỳ 3s sáng / 1s tắt
try:
    while True:
        GPIO.output(11, GPIO.HIGH)
        time.sleep(3)
        GPIO.output(11, GPIO.LOW)
        time.sleep(1)
except KeyboardInterrupt:
    GPIO.cleanup()
    print("GPIO đã cleanup an toàn.")`,
    interactiveType: 'gpio_led',
    simulatedRobotCode: `# Điều khiển đèn LED trạng thái trên Robot Ảo
robot.set_led("status", "green")
time.sleep(2.0)
robot.set_led("status", "off")
time.sleep(1.0)
robot.set_led("status", "amber")`,
    notes: [
      'Luôn gọi GPIO.cleanup() khi kết thúc để reset trạng thái pin.',
      'Cảnh báo "Carrier board is not from a Jetson Developer Kit" trên Jetson.GPIO là bình thường.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M02',
    title: 'Đèn Giao Thông Ba Màu (Traffic Light)',
    shortDesc: 'Điều khiển tuần tự 3 LED đỏ-vàng-xanh theo chu kỳ Xanh (10s) → Vàng (3s) → Đỏ (10s).',
    sourceFile: '2_traffic_light.ipynb',
    hardwareRequirements: ['3 LED (Đỏ, Vàng, Xanh)', '3 Điện trở 330Ω', 'Dây jumper + Breadboard'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Pin 11', to: 'LED Đỏ (+) qua 330Ω', note: 'Đèn Dừng' },
        { from: 'Pin 13', to: 'LED Vàng (+) qua 330Ω', note: 'Đèn Chuẩn Bị' },
        { from: 'Pin 23', to: 'LED Xanh (+) qua 330Ω', note: 'Đèn Đi' },
        { from: 'LED (-)', to: 'Pin 14 (GND)', note: 'Nối đất chung' },
      ],
      description: 'Pin 11 (Đỏ) | Pin 13 (Vàng) | Pin 23 (Xanh) ──── 330Ω ──── Pin 14 (GND)',
    },
    learningOutcomes: ['LO9', 'LO11', 'LO12', 'LO13', 'LO14', 'LO27'],
    keyConcepts: ['all_off()', 'Vòng lặp trạng thái vô hạn (State Machine)', 'KeyboardInterrupt', 'Biến thời gian XANH=10, VANG=3, DO=10'],
    codeCellSource: `import Jetson.GPIO as GPIO
import time

GPIO.setmode(GPIO.BOARD)
GPIO.setup(11, GPIO.OUT)  # Đỏ
GPIO.setup(13, GPIO.OUT)  # Vàng
GPIO.setup(23, GPIO.OUT)  # Xanh

def all_off():
    GPIO.output(11, GPIO.LOW)
    GPIO.output(13, GPIO.LOW)
    GPIO.output(23, GPIO.LOW)

XANH = 10
VANG = 3
DO = 10

try:
    while True:
        all_off()
        GPIO.output(23, GPIO.HIGH)
        print(f"🟢 Xanh - Đi ({XANH}s)")
        time.sleep(XANH)

        all_off()
        GPIO.output(13, GPIO.HIGH)
        print(f"🟡 Vàng - Chuẩn bị ({VANG}s)")
        time.sleep(VANG)

        all_off()
        GPIO.output(11, GPIO.HIGH)
        print(f"🔴 Đỏ - Dừng ({DO}s)")
        time.sleep(DO)
except KeyboardInterrupt:
    all_off()
    GPIO.cleanup()
    print("Đã dừng an toàn.")`,
    interactiveType: 'traffic_light',
    simulatedRobotCode: `# Điều khiển Robot phản ứng theo pha đèn giao thông
robot.set_led("status", "green")
robot.drive(0.25, 0.0, 3.0)  # Xanh: Chạy
robot.set_led("status", "amber")
robot.drive(0.10, 0.0, 1.5)  # Vàng: Giảm tốc
robot.set_led("status", "red")
robot.stop()                 # Đỏ: Dừng hẳn`,
    notes: [
      'Hàm all_off() tắt tất cả đèn trước khi chuyển trạng thái để đảm bảo không bị bật trùng 2 đèn.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M03',
    title: 'Nút Nhấn Điều Khiển LED (Button & Debounce)',
    shortDesc: 'Đọc tín hiệu nút bấm GPIO.IN với điện trở kéo lên PUD_UP. Chế độ nhấn-giữ và chế độ Toggle bật/tắt chống dội phím (debounce).',
    sourceFile: '3_button_test.ipynb',
    hardwareRequirements: ['1 LED (Pin 11)', '1 Nút nhấn (Push button, Pin 16)', 'Điện trở 330Ω', 'Dây nối'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Pin 11', to: 'Điện trở 330Ω ──── LED (+)', note: 'Đầu ra LED' },
        { from: 'Pin 16', to: 'Chân nút nhấn ──── Pin 14 (GND)', note: 'Đầu vào pull-up (LOW khi nhấn)' },
      ],
      description: 'Pin 11 ──── 330Ω ──── LED (+) ──── GND; Pin 16 ──── Nút ──── GND',
    },
    learningOutcomes: ['LO3', 'LO4', 'LO9', 'LO11', 'LO12', 'LO13', 'LO27'],
    keyConcepts: ['GPIO.IN', 'GPIO.PUD_UP', 'GPIO.input(16) == GPIO.LOW', 'Debounce bằng time.sleep(0.3)', 'Trạng thái boolean led_state'],
    codeCellSource: `import Jetson.GPIO as GPIO
import time

GPIO.setmode(GPIO.BOARD)
GPIO.setup(11, GPIO.OUT)
GPIO.setup(16, GPIO.IN, pull_up_down=GPIO.PUD_UP)

led_state = False

try:
    while True:
        if GPIO.input(16) == GPIO.LOW:  # Người dùng nhấn nút
            led_state = not led_state   # Đảo trạng thái (Toggle)
            GPIO.output(11, GPIO.HIGH if led_state else GPIO.LOW)
            print("LED ON" if led_state else "LED OFF")
            time.sleep(0.3)             # Chống rung nút (Debounce)
        time.sleep(0.05)
except KeyboardInterrupt:
    GPIO.output(11, GPIO.LOW)
    GPIO.cleanup()
    print("Done")`,
    interactiveType: 'button_led',
    simulatedRobotCode: `# Toggle chế độ robot bằng nút bấm ảo
robot.set_led("status", "green")
robot.drive(0.20, 0.0, 2.0)
robot.stop()`,
    notes: [
      'Nút nhấn nối GND với cấu hình pull-up nên trạng thái bình thường là HIGH, khi nhấn nút chuyển về LOW.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M04',
    title: 'Điều Khiển Màn Hình 7 Đoạn 4 Số TM1637',
    shortDesc: 'Lập trình driver giao tiếp bit-banging qua CLK (Pin 18) và DIO (Pin 22). Hiển thị số 0..9999 và đếm ngược.',
    sourceFile: '4_tm1637_test.ipynb',
    hardwareRequirements: ['Module TM1637 4-digit display', 'Cáp jumper (VCC 5V Pin 2, GND Pin 6, CLK Pin 18, DIO Pin 22)'],
    wiringDiagram: {
      pinConnections: [
        { from: 'VCC', to: 'Pin 2 (5V)', note: 'Nguồn cấp' },
        { from: 'GND', to: 'Pin 6 (GND)', note: 'Đất' },
        { from: 'CLK', to: 'Pin 18 (GPIO)', note: 'Clock xung dữ liệu' },
        { from: 'DIO', to: 'Pin 22 (GPIO)', note: 'Dữ liệu nối tiếp' },
      ],
      description: 'VCC ── Pin 2; GND ── Pin 6; CLK ── Pin 18; DIO ── Pin 22',
    },
    learningOutcomes: ['LO11', 'LO12', 'LO13', 'LO14', 'LO17', 'LO19', 'LO20'],
    keyConcepts: ['Giao thức Bit-bang', 'start_tm() / stop_tm()', 'write_byte(data)', 'Mảng mã 7 đoạn DIGITS = [0x3F, 0x06...]', 'Tách hàng ngàn, trăm, chục, đơn vị'],
    codeCellSource: `import Jetson.GPIO as GPIO
import time

CLK = 18
DIO = 22
DIGITS = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F]

GPIO.setmode(GPIO.BOARD)
GPIO.setup(CLK, GPIO.OUT)
GPIO.setup(DIO, GPIO.OUT)

def start_tm():
    GPIO.output(DIO, GPIO.HIGH); GPIO.output(CLK, GPIO.HIGH); time.sleep(0.001)
    GPIO.output(DIO, GPIO.LOW);  time.sleep(0.001)
    GPIO.output(CLK, GPIO.LOW);  time.sleep(0.001)

def stop_tm():
    GPIO.output(CLK, GPIO.LOW);  GPIO.output(DIO, GPIO.LOW);  time.sleep(0.001)
    GPIO.output(CLK, GPIO.HIGH); time.sleep(0.001)
    GPIO.output(DIO, GPIO.HIGH); time.sleep(0.001)

def write_byte(data):
    for i in range(8):
        GPIO.output(CLK, GPIO.LOW); time.sleep(0.001)
        GPIO.output(DIO, GPIO.HIGH if (data & 0x01) else GPIO.LOW)
        data >>= 1; time.sleep(0.001)
        GPIO.output(CLK, GPIO.HIGH); time.sleep(0.001)
    GPIO.output(CLK, GPIO.LOW); GPIO.output(DIO, GPIO.HIGH); time.sleep(0.001)
    GPIO.output(CLK, GPIO.HIGH); time.sleep(0.001)
    GPIO.output(CLK, GPIO.LOW);  time.sleep(0.001)

def show_number(num):
    digits = [num // 1000, (num // 100) % 10, (num // 10) % 10, num % 10]
    start_tm(); write_byte(0x40); stop_tm()
    start_tm(); write_byte(0xC0)
    for d in digits:
        write_byte(DIGITS[d])
    stop_tm()
    start_tm(); write_byte(0x8F); stop_tm()

show_number(1234)
time.sleep(2)
show_number(0)
GPIO.cleanup()`,
    interactiveType: 'tm1637',
    simulatedRobotCode: `show_number(2026)
robot.drive(0.20, 0.0, 2.0)
show_number(0)
robot.stop()`,
    notes: [
      'Giao tiếp bit-bang TM1637 gửi LSB trước (data & 0x01 sau đó data >>= 1).',
      'Lệnh 0x40 cấu hình ghi dữ liệu, 0xC0 chọn thanh ghi địa chỉ đầu tiên, 0x8F bật màn hình ở độ sáng tối đa.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M05',
    title: 'Đồng Hồ Bấm Giờ (Stopwatch)',
    shortDesc: 'Kết hợp TM1637 và 2 nút bấm: Nút 1 (Pin 19) Bắt đầu / Tạm dừng, Nút 2 (Pin 26) Đặt lại về 0.',
    sourceFile: '5_stopwatch.ipynb',
    hardwareRequirements: ['TM1637 Display', '2 Nút bấm (BTN_START=19, BTN_RESET=26)', 'Breadboard'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Pin 19', to: 'Nút Start/Stop ──── GND (Pin 14)', note: 'Điều khiển chạy/dừng' },
        { from: 'Pin 26', to: 'Nút Reset ──── GND (Pin 14)', note: 'Xóa về 0' },
        { from: 'TM1637', to: 'CLK=Pin 18, DIO=Pin 22', note: 'Màn hình 4 số' },
      ],
      description: 'Pin 19 (Start/Stop); Pin 26 (Reset); TM1637 (CLK=18, DIO=22)',
    },
    learningOutcomes: ['LO3', 'LO4', 'LO9', 'LO10', 'LO11', 'LO12', 'LO13'],
    keyConcepts: ['time.time()', 'elapsed = time.time() - start_time', 'Xử lý nút cạnh sườn', 'Hiển thị giây 0..9999'],
    codeCellSource: `import Jetson.GPIO as GPIO
import time

CLK = 18; DIO = 22
BTN_START = 19; BTN_RESET = 26

GPIO.setmode(GPIO.BOARD)
GPIO.setup(CLK, GPIO.OUT); GPIO.setup(DIO, GPIO.OUT)
GPIO.setup(BTN_START, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(BTN_RESET, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# (Kèm theo driver show_number từ M04)
running = False; elapsed = 0; start_time = 0

try:
    while True:
        if GPIO.input(BTN_START) == GPIO.LOW:
            running = not running
            if running: start_time = time.time() - elapsed
            time.sleep(0.3)
        if GPIO.input(BTN_RESET) == GPIO.LOW:
            running = False; elapsed = 0; show_number(0); time.sleep(0.3)
        if running:
            elapsed = time.time() - start_time
            show_number(min(int(elapsed), 9999))
        time.sleep(0.05)
except KeyboardInterrupt:
    show_number(0); GPIO.cleanup()`,
    interactiveType: 'stopwatch',
    notes: ['Bộ đếm tính theo giây thực tế time.time() - start_time không bị trôi số.'],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M06',
    title: 'Đồng Hồ Đếm Ngược (Countdown Timer)',
    shortDesc: 'Đếm từ COUNT về 0 sau khi nhấn nút. Khi hết giờ màn hình nhấp nháy 8888 báo hiệu.',
    sourceFile: '6_countdown.ipynb',
    hardwareRequirements: ['TM1637 Display', 'Nút bấm Start (Pin 19)'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Pin 19', to: 'Nút Start ──── GND (Pin 14)', note: 'Bắt đầu đếm ngược' },
        { from: 'TM1637', to: 'CLK Pin 18, DIO Pin 22', note: 'Hiển thị' },
      ],
      description: 'Pin 19 (Nút Start) ──── GND; TM1637 ──── CLK 18, DIO 22',
    },
    learningOutcomes: ['LO3', 'LO4', 'LO6', 'LO9', 'LO10', 'LO11', 'LO12', 'LO13'],
    keyConcepts: ['for i in range(COUNT, -1, -1)', 'Cảnh báo hết giờ 8888 nhấp nháy 5 lần'],
    codeCellSource: `import Jetson.GPIO as GPIO
import time

CLK = 18; DIO = 22; BTN_START = 19
COUNT = 10  # Số giây đếm ngược

GPIO.setmode(GPIO.BOARD)
GPIO.setup(CLK, GPIO.OUT); GPIO.setup(DIO, GPIO.OUT)
GPIO.setup(BTN_START, GPIO.IN, pull_up_down=GPIO.PUD_UP)

show_number(COUNT)
print("Chờ nhấn nút để bắt đầu...")
while GPIO.input(BTN_START) == GPIO.HIGH:
    time.sleep(0.05)

print("Bắt đầu đếm ngược!")
for i in range(COUNT, -1, -1):
    show_number(i)
    time.sleep(1)

print("Hết giờ!")
for _ in range(5):
    show_number(0); time.sleep(0.3)
    show_number(8888); time.sleep(0.3)

show_number(0)
GPIO.cleanup()`,
    interactiveType: 'countdown',
    notes: ['Giới hạn COUNT trong khoảng 1 đến 9999 giây.'],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M07',
    title: 'Đèn Giao Thông Tích Hợp Đếm Ngược TM1637',
    shortDesc: 'Kết hợp 3 đèn LED đỏ-vàng-xanh với màn hình TM1637 đếm lùi thời gian từng pha tín hiệu.',
    sourceFile: '7_traffic_tm1637.ipynb',
    hardwareRequirements: ['3 LED (Đỏ=11, Vàng=13, Xanh=21)', 'TM1637 (CLK=18, DIO=22)', 'Điện trở 330Ω'],
    wiringDiagram: {
      pinConnections: [
        { from: 'LED Đỏ', to: 'Pin 11 qua 330Ω', note: 'Pha Đỏ (10s)' },
        { from: 'LED Vàng', to: 'Pin 13 qua 330Ω', note: 'Pha Vàng (3s)' },
        { from: 'LED Xanh', to: 'Pin 21 qua 330Ω', note: 'Pha Xanh (10s)' },
        { from: 'TM1637', to: 'CLK 18, DIO 22', note: 'Màn hình đếm lùi từng giây' },
      ],
      description: 'LED Đỏ 11 | Vàng 13 | Xanh 21; TM1637 CLK 18, DIO 22',
    },
    learningOutcomes: ['LO3', 'LO4', 'LO6', 'LO9', 'LO10', 'LO11', 'LO12', 'LO13'],
    keyConcepts: ['countdown(seconds) lồng ghép trạng thái LED', 'GREEN_TIME=10, YELLOW_TIME=3, RED_TIME=10'],
    codeCellSource: `import Jetson.GPIO as GPIO
import time

LED_RED = 11; LED_YELLOW = 13; LED_GREEN = 21
CLK = 18; DIO = 22
GREEN_TIME = 10; YELLOW_TIME = 3; RED_TIME = 10

def countdown(seconds):
    for i in range(seconds, -1, -1):
        show_number(i)
        time.sleep(1)

try:
    while True:
        all_off(); GPIO.output(LED_GREEN, GPIO.HIGH)
        print(f"Xanh - Đi ({GREEN_TIME}s)")
        countdown(GREEN_TIME)

        all_off(); GPIO.output(LED_YELLOW, GPIO.HIGH)
        print(f"Vàng - Chuẩn bị ({YELLOW_TIME}s)")
        countdown(YELLOW_TIME)

        all_off(); GPIO.output(LED_RED, GPIO.HIGH)
        print(f"Đỏ - Dừng ({RED_TIME}s)")
        countdown(RED_TIME)
except KeyboardInterrupt:
    all_off(); show_number(0); GPIO.cleanup()`,
    interactiveType: 'traffic_tm1637',
    notes: ['Tích hợp đồng bộ tín hiệu thị giác (màu đèn) và dữ liệu định lượng (số giây còn lại).'],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M08',
    title: 'Đèn Giao Thông Nhập Thời Gian Tùy Chỉnh',
    shortDesc: 'Nhập thời gian xanh/vàng/đỏ linh hoạt từ bàn phím qua input() trước khi chạy chu kỳ.',
    sourceFile: '8_traffic_tm1637_input.ipynb',
    hardwareRequirements: ['3 LED (Đỏ=11, Vàng=13, Xanh=21)', 'TM1637 (CLK=18, DIO=22)'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Hệ thống LED + TM1637', to: 'Cấu hình tương tự M07', note: 'Mở rộng tính năng nhập số' },
      ],
      description: 'LED Đỏ 11, Vàng 13, Xanh 21 + TM1637 CLK 18, DIO 22',
    },
    learningOutcomes: ['LO3', 'LO4', 'LO6', 'LO9', 'LO10', 'LO11', 'LO12', 'LO13', 'LO28'],
    keyConcepts: ['input() ép kiểu int()', 'GREEN_TIME, YELLOW_TIME, RED_TIME người dùng chỉ định'],
    codeCellSource: `GREEN_TIME = int(input("Thời gian xanh (giây): "))
YELLOW_TIME = int(input("Thời gian vàng (giây): "))
RED_TIME = int(input("Thời gian đỏ (giây): "))

print(f"Cấu hình: Xanh {GREEN_TIME}s | Vàng {YELLOW_TIME}s | Đỏ {RED_TIME}s")
# Tiếp tục chu kỳ lặp đèn tự động như M07`,
    interactiveType: 'traffic_tm1637_input',
    notes: ['Giúp học sinh thử nghiệm tình huống giao thông cao điểm hoặc đường ưu tiên.'],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M09',
    title: 'Tổng Quan LIDAR RPLIDAR A1 & ROS Topic /scan',
    shortDesc: 'Khởi động rplidar.launch, đọc dữ liệu đám mây điểm 360° qua /scan, trực quan hóa trên RViz và mapping.',
    sourceFile: '9_lidar_huongdan.md',
    hardwareRequirements: ['RPLIDAR A1 (cổng USB /dev/ttyUSB0)', 'JetBot Waveshare (Jetson Nano 4GB)', 'ROS Melodic trên Host OS'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Cáp micro-USB RPLIDAR A1', to: 'Cổng USB Jetson Nano', note: 'Nhận dạng /dev/ttyUSB0' },
      ],
      description: 'RPLIDAR A1 ──── USB ──── Jetson Nano (/dev/ttyUSB0, 360° scan)',
    },
    learningOutcomes: ['LO13', 'LO14', 'LO17', 'LO18', 'LO19', 'LO20'],
    keyConcepts: ['ROS Node & Topic', 'Topic /scan (sensor_msgs/LaserScan)', 'angle_min/max', 'ranges[]', 'rviz Fixed Frame = laser'],
    codeCellSource: `# Terminal 1: Khởi động LIDAR
roslaunch rplidar_ros rplidar.launch

# Terminal 2: Đọc dữ liệu topic /scan
rostopic echo /scan | head -30

# Terminal 3: Mở trực quan hóa đồ họa
rosrun rviz rviz`,
    interactiveType: 'lidar_ros',
    simulatedRobotCode: `# Đọc dữ liệu cảm biến khoảng cách và LIDAR trên robot ảo
dist = robot.read_range()
print(f"Khoảng cách vật cản trước mặt: {dist:.2f} m")
if dist > 0.40:
    robot.drive(0.25, 0.0, 2.0)
else:
    robot.drive(0.0, 1.0, 1.0) # Quẹo tránh vật cản`,
    notes: [
      'ROS Melodic chạy trên Host OS của JetBot, không chạy trong Jupyter Docker container.',
      'Góc quét 360 độ từ -π đến +π, tầm đo vật lý tối đa 12.0m, tần số 10Hz.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M10',
    title: 'Điều Khiển JetBot Bằng Tay Cầm 2.4G (Joystick Teleop)',
    shortDesc: 'Chuyển đổi dữ liệu trục cần gạt từ topic /joy sang lệnh vận tốc /cmd_vel với tỷ lệ LINEAR_SCALE=0.3 m/s và ANGULAR_SCALE=1.0 rad/s.',
    sourceFile: '10_joystick_teleop_huongdan.md',
    hardwareRequirements: ['Tay cầm không dây 2.4G (USB Dongle /dev/input/js0)', 'Package joy trên ROS Melodic'],
    wiringDiagram: {
      pinConnections: [
        { from: 'USB Dongle 2.4G', to: 'Cổng USB JetBot', note: 'Thiết bị /dev/input/js0' },
      ],
      description: 'Dongle 2.4G ── USB ── Jetson Nano (/dev/input/js0)',
    },
    learningOutcomes: ['LO3', 'LO4', 'LO13', 'LO17', 'LO19', 'LO20'],
    keyConcepts: ['sensor_msgs/Joy', 'geometry_msgs/Twist', 'twist.linear.x = joy.axes[1] * LINEAR_SCALE', 'twist.angular.z = joy.axes[0] * ANGULAR_SCALE', 'Watchdog 10Hz'],
    codeCellSource: `#!/usr/bin/env python
import rospy
from sensor_msgs.msg import Joy
from geometry_msgs.msg import Twist

pub = None
LINEAR_SCALE = 0.3   # m/s - tốc độ tiến/lùi tối đa
ANGULAR_SCALE = 1.0  # rad/s - tốc độ xoay tối đa
twist = Twist()

def callback(joy):
    global twist
    twist.linear.x = joy.axes[1] * LINEAR_SCALE
    twist.angular.z = joy.axes[0] * ANGULAR_SCALE

if __name__ == '__main__':
    rospy.init_node('joy_to_cmdvel')
    pub = rospy.Publisher('/cmd_vel', Twist, queue_size=1)
    rospy.Subscriber('/joy', Joy, callback)
    rate = rospy.Rate(10) # 10Hz tránh watchdog ngắt motor
    while not rospy.is_shutdown():
        pub.publish(twist)
        rate.sleep()`,
    interactiveType: 'joystick_teleop',
    simulatedRobotCode: `# Điều khiển /cmd_vel mô phỏng
robot.drive(linear=0.30, angular=0.0, duration=2.0)
robot.drive(linear=0.0, angular=1.0, duration=1.57) # Xoay 90 độ
robot.stop()`,
    notes: [
      'Publish liên tục ở tần số 10Hz để mạch điều khiển JetBot không kích hoạt watchdog tự dừng khi giữ nguyên cần gạt.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M11',
    title: 'Quy Trình Tích Hợp: Lập Bản Đồ gmapping & Điều Khiển Tay Cầm',
    shortDesc: 'Quy trình phối hợp 5 terminal đồng thời: jetbot.launch (motor/odom), rplidar.launch, gmapping.launch, static_transform và joy_teleop.',
    sourceFile: '11_quytrinh_tichhop_mapping_joystick.md',
    hardwareRequirements: ['JetBot', 'RPLIDAR A1', 'Tay cầm 2.4G', 'Màn hình 7 inch'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Toàn bộ hệ thống phần cứng', to: 'JetBot tích hợp', note: 'Chạy đồng bộ các node' },
      ],
      description: 'LIDAR + Motor + Encoder + IMU + Dongle 2.4G + Màn hình 7 inch',
    },
    learningOutcomes: ['LO2', 'LO3', 'LO4', 'LO5', 'LO12', 'LO13', 'LO17', 'LO18', 'LO19', 'LO20'],
    keyConcepts: ['Gốc bản đồ (0,0,0)', 'Không nhấc robot lên khi đang gmapping', 'Sửa frame_id "odom"', 'map_saver lưu map.pgm và map.yaml'],
    codeCellSource: `# Terminal 1: Motor + Encoder + IMU
roslaunch jetbot_pro jetbot.launch

# Terminal 2: RPLIDAR
roslaunch rplidar_ros rplidar.launch

# Terminal 3: Thuật toán Gmapping
roslaunch jetbot_pro gmapping.launch

# Terminal 4: TF laser
rosrun tf static_transform_publisher 0 0 0 0 0 0 base_footprint laser 100

# Terminal 5: Điều khiển tay cầm
roslaunch jetbot_pro joy_teleop.launch

# Lưu bản đồ khi hoàn thành
rosrun map_server map_saver -f ~/map_gmapping`,
    interactiveType: 'slam_mapping',
    notes: [
      'Vị trí lúc chạy jetbot.launch chính là gốc (0,0,0) của bản đồ.',
      'Bánh xe phải lăn thật trên sàn để encoder đo chính xác; không bê robot trên không.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M12',
    title: 'Thiết Lập Camera CSI IMX219 Trên JetBot',
    shortDesc: 'Khởi động camera CSI IMX219 qua GStreamer/nvargus-daemon và hiển thị live feed trực tiếp trong JupyterLab.',
    sourceFile: 'Tiet_25_setup_camera.ipynb',
    hardwareRequirements: ['Camera CSI Sony IMX219 (gắn qua cáp ribbon FPC)', 'Jetson Nano 4GB'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Cáp MIPI-CSI', to: 'Cổng CAM0 trên Jetson Nano', note: 'Mặt tiếp xúc quay về phía bo mạch' },
      ],
      description: 'Camera CSI IMX219 ──── Cáp FPC ──── Cổng CAM0 Jetson Nano',
    },
    learningOutcomes: ['LO13', 'LO14', 'LO19', 'LO20', 'LO25', 'LO27'],
    keyConcepts: ['Camera.instance(width=640, height=480)', 'traitlets.dlink', 'nvargus-daemon', 'Giải phóng camera unobserve_all()'],
    codeCellSource: `import cv2, numpy as np
from jetbot import Camera
import ipywidgets as widgets
from IPython.display import display
import traitlets

camera = Camera.instance(width=640, height=480)
image_widget = widgets.Image(format="jpeg", width=640, height=480)

def transform(frame):
    _, jpeg = cv2.imencode(".jpg", frame)
    return bytes(jpeg)

camera_link = traitlets.dlink(
    (camera, "value"),
    (image_widget, "value"),
    transform=transform
)

display(image_widget)
print("Camera CSI 640x480 đang chạy!")`,
    interactiveType: 'camera_setup',
    notes: [
      'Bắt buộc reboot JetBot trước khi chạy để nvargus-daemon khởi động sạch.',
      'Camera CSI chỉ được sử dụng bởi duy nhất 1 kernel tại một thời điểm.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M13',
    title: 'Hiệu Chỉnh Camera Cho AprilTag (Calibration)',
    shortDesc: 'Sử dụng bảng ô cờ (checkerboard 10x7 góc trong), tìm góc bằng cv2.findChessboardCorners, tính ma trận nội K và hệ số méo.',
    sourceFile: 'Tiet_26_27_camera_calibration.ipynb',
    hardwareRequirements: ['Camera CSI IMX219', 'Bảng checkerboard in chuẩn (10x7 góc trong)'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Camera CSI', to: 'Khoảng cách 20-50cm trước bảng ô cờ', note: 'Chụp 10-15 góc độ khác nhau' },
      ],
      description: 'Camera CSI ──── Chụp Checkerboard (10, 7) ──── camera_calibration.json',
    },
    learningOutcomes: ['LO1', 'LO4', 'LO5', 'LO9', 'LO10', 'LO11', 'LO12', 'LO13', 'LO14'],
    keyConcepts: ['CHECKERBOARD = (10, 7)', 'cv2.findChessboardCorners', 'cv2.calibrateCamera', 'Ma trận nội K (fx, fy, cx, cy)', 'cv2.undistort'],
    codeCellSource: `import cv2, numpy as np, json
CHECKERBOARD = (10, 7)
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

# Khi chụp đủ >= 10 frames:
rms, K, dist_c, rvecs, tvecs = cv2.calibrateCamera(
    objpoints, imgpoints, (640, 480), None, None
)

calib = {
    "fx": float(K[0,0]), "fy": float(K[1,1]),
    "cx": float(K[0,2]), "cy": float(K[1,2]),
    "dist_coeffs": dist_c.ravel().tolist(),
    "rms_error": float(rms)
}

with open("camera_calibration.json", "w") as f:
    json.dump(calib, f, indent=4)

print(f"Hiệu chỉnh thành công! RMS error: {rms:.4f} px")`,
    interactiveType: 'camera_calibration',
    notes: [
      'RMS error nhỏ hơn 0.5px là kết quả rất tốt.',
      'File camera_calibration.json được dùng xuyên suốt cho các bài phát hiện AprilTag.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M14',
    title: 'Nhận Diện AprilTag (Perception & Pose Estimation)',
    shortDesc: 'Phát hiện mã AprilTag family tag36h11, giải bài toán solvePnP để tính khoảng cách và tọa độ không gian (x, y, z).',
    sourceFile: 'Tiet_28_apriltag_perception.ipynb',
    hardwareRequirements: ['Camera CSI IMX219', 'File camera_calibration.json', 'Thẻ AprilTag in kích thước 15cm (tag36h11)'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Camera CSI', to: 'Bia AprilTag tag36h11', note: 'TAG_SIZE_M = 0.15m' },
      ],
      description: 'Camera ──── Khử méo K, dist ──── apriltag.Detector ──── solvePnP (x,y,z)',
    },
    learningOutcomes: ['LO2', 'LO4', 'LO13', 'LO14', 'LO15', 'LO18', 'LO19', 'LO20', 'LO27'],
    keyConcepts: ['apriltag.DetectorOptions(families="tag36h11")', 'cv2.solvePnP', 'TAG_SIZE_M = 0.15', 'Khoảng cách norm(tvec)', 'Tâm (cx, cy) và 4 góc'],
    codeCellSource: `import apriltag, cv2, numpy as np

detector = apriltag.Detector(apriltag.DetectorOptions(families="tag36h11"))
TAG_SIZE_M = 0.15

def get_tag_distance(detection):
    tag_pts = np.array([
        [-TAG_SIZE_M/2,  TAG_SIZE_M/2, 0],
        [ TAG_SIZE_M/2,  TAG_SIZE_M/2, 0],
        [ TAG_SIZE_M/2, -TAG_SIZE_M/2, 0],
        [-TAG_SIZE_M/2, -TAG_SIZE_M/2, 0],
    ], dtype=np.float32)
    img_pts = detection.corners.astype(np.float32)
    cam_mat = np.array([[fx, 0, cx], [0, fy, cy], [0, 0, 1]], dtype=np.float32)
    _, rvec, tvec = cv2.solvePnP(tag_pts, img_pts, cam_mat, dist)
    return float(np.linalg.norm(tvec)), float(tvec[0]), float(tvec[1]), float(tvec[2])

# Trong vòng lặp update frame:
# detections = detector.detect(gray)
# for det in detections: vẽ khung xanh, ID, khoảng cách`,
    interactiveType: 'apriltag_perception',
    notes: [
      'AprilTag family tag36h11 có 36 bit dữ liệu với khoảng cách Hamming tối thiểu là 11, chống phát hiện nhầm rất cao.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M15',
    title: 'Điều Hướng Bằng AprilTag (Autonomous Tag Navigation)',
    shortDesc: 'Xây dựng thuật toán scan_for_tag() xoay tìm tag mục tiêu và approach_tag() căn chỉnh tâm rồi tiến lại gần điểm dừng mong muốn.',
    sourceFile: 'Tiet_29_30_apriltag_navigation.ipynb',
    hardwareRequirements: ['JetBot', 'Camera CSI', 'Thẻ AprilTag ID 1'],
    wiringDiagram: {
      pinConnections: [
        { from: 'JetBot AI Kit', to: 'Sa bàn thử nghiệm', note: 'Căn chỉnh theo tọa độ tag_state' },
      ],
      description: 'TagState (seen, id, x_m, z_m) ──> scan_for_tag() ──> approach_tag() ──> robot.stop()',
    },
    learningOutcomes: ['LO3', 'LO4', 'LO6', 'LO8', 'LO11', 'LO13', 'LO14', 'LO19', 'LO20', 'LO22', 'LO28'],
    keyConcepts: ['class TagState', 'scan_for_tag(target_tag_id, direction, turn_speed)', 'approach_tag(desired_z_m=0.3, forward_speed=0.2)', 'Sai số z_err và x_err'],
    codeCellSource: `def scan_for_tag(tag_state, target_tag_id=1, direction="left", turn_speed=0.06, timeout=30.0):
    t_start = time.time()
    l, r = (-turn_speed, turn_speed) if direction == "left" else (turn_speed, -turn_speed)
    while time.time() - t_start < timeout:
        if tag_state.seen and tag_state.tag_id == target_tag_id:
            robot.stop()
            return True
        robot.set_motors(l, r)
        time.sleep(0.2)
    robot.stop()
    return False

def approach_tag(tag_state, target_tag_id=1, desired_z_m=0.3, forward_speed=0.2, center_margin=0.1, stop_tol=0.04):
    while True:
        if not tag_state.seen: robot.stop(); continue
        z_err = tag_state.z_m - desired_z_m
        x_err = tag_state.x_m
        if abs(z_err) <= stop_tol and abs(x_err) <= center_margin:
            robot.stop(); return True
        if abs(x_err) > center_margin:
            # Căn chỉnh ngang trước
            if x_err > 0: robot.set_motors(0.04, -0.04) # Quẹo phải
            else: robot.set_motors(-0.04, 0.04)         # Quẹo trái
            time.sleep(0.05); continue
        # Tiến hoặc lùi
        if z_err > 0: robot.set_motors(forward_speed, forward_speed)
        else: robot.set_motors(-forward_speed * 0.5, -forward_speed * 0.5)
        time.sleep(0.05)`,
    interactiveType: 'apriltag_navigation',
    simulatedRobotCode: `# Chạy chuỗi điều hướng AprilTag mục tiêu ID 0
scan_for_tag(target_tag_id=0, direction="left", turn_speed=0.06)
time.sleep(0.5)
approach_tag(target_tag_id=0, desired_z_m=0.40, forward_speed=0.20)`,
    notes: [
      'Ưu tiên căn chỉnh sai số góc x_err trước khi tiến tới để tránh đâm lệch bia.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
  {
    id: 'M16',
    title: 'Thử Thách Mê Cung AprilTag (Maze Challenge)',
    shortDesc: 'Hoàn thành hành trình tuần tự qua 4 trạm đánh dấu TAG 0 → TAG 1 → TAG 2 → TAG 3, đo tổng thời gian và tinh chỉnh tham số bám cua.',
    sourceFile: 'Tiet_31_32_33_34_apriltag_maze_challenge.ipynb',
    hardwareRequirements: ['Sa bàn mê cung Baseplates', '4 thẻ AprilTag ID 0, 1, 2, 3 gắn tại các góc tường'],
    wiringDiagram: {
      pinConnections: [
        { from: 'Vị trí START', to: 'Lộ trình: TAG 0 (Bắc) → TAG 1 (Đông) → TAG 2 (Nam) → TAG 3 (Tây - ĐÍCH)', note: 'Toàn bộ mê cung' },
      ],
      description: '[START] ──> TAG 0 ──> TAG 1 ──> TAG 2 ──> TAG 3 [FINISH]',
    },
    learningOutcomes: ['LO1', 'LO2', 'LO3', 'LO4', 'LO5', 'LO6', 'LO9', 'LO10', 'LO11', 'LO12', 'LO13', 'LO14', 'LO30'],
    keyConcepts: ['Cấu hình WAYPOINTS mảng các từ điển tham số', 'scan_timeout & approach_timeout', 'desired_z_m theo góc hẹp', 'Bảng ghi chép KET_QUA'],
    codeCellSource: `WAYPOINTS = [
    {"tag_id": 0, "direction": "left",  "turn_speed": 0.06, "desired_z_m": 0.40, "forward_speed": 0.20, "pause_after": 0.8},
    {"tag_id": 1, "direction": "right", "turn_speed": 0.06, "desired_z_m": 0.40, "forward_speed": 0.20, "pause_after": 0.8},
    {"tag_id": 2, "direction": "left",  "turn_speed": 0.06, "desired_z_m": 0.40, "forward_speed": 0.20, "pause_after": 0.8},
    {"tag_id": 3, "direction": "left",  "turn_speed": 0.06, "desired_z_m": 0.30, "forward_speed": 0.15, "pause_after": 0.0},
]

for step, wp in enumerate(WAYPOINTS):
    tag_id = wp["tag_id"]
    print(f"Bước {step+1}: Tìm TAG {tag_id}")
    found = scan_for_tag(target_tag_id=tag_id, direction=wp["direction"], turn_speed=wp["turn_speed"])
    if not found: break
    reached = approach_tag(target_tag_id=tag_id, desired_z_m=wp["desired_z_m"], forward_speed=wp["forward_speed"])
    if not reached: break
    if wp["pause_after"] > 0: time.sleep(wp["pause_after"])

print("🏆 HOÀN THÀNH THỬ THÁCH MÊ CUNG!")`,
    interactiveType: 'apriltag_maze',
    simulatedRobotCode: `# Chạy tự động thử thách mê cung trên bản đồ maze_apriltag
# Trạm 1: TAG 0
scan_for_tag(target_tag_id=0, direction="left", turn_speed=0.06)
approach_tag(target_tag_id=0, desired_z_m=0.40, forward_speed=0.20)
time.sleep(0.8)

# Trạm 2: TAG 1
scan_for_tag(target_tag_id=1, direction="right", turn_speed=0.06)
approach_tag(target_tag_id=1, desired_z_m=0.40, forward_speed=0.20)
time.sleep(0.8)

# Trạm 3: TAG 2
scan_for_tag(target_tag_id=2, direction="left", turn_speed=0.06)
approach_tag(target_tag_id=2, desired_z_m=0.40, forward_speed=0.20)
time.sleep(0.8)

# Trạm 4: TAG 3
scan_for_tag(target_tag_id=3, direction="left", turn_speed=0.06)
approach_tag(target_tag_id=3, desired_z_m=0.30, forward_speed=0.15)
robot.stop()`,
    notes: [
      'Góc hẹp tăng desired_z_m lên 0.4-0.5m để tránh robot quẹt phải góc tường.',
      'Đích đến TAG 3 giảm forward_speed về 0.15 m/s để dừng chính xác không bị trượt quán tính.',
    ],
    verificationStatus: 'VERIFIED_IN_SIMULATION',
  },
];

export const SYLLABUS_DATA: SyllabusItem[] = [
  { sessionNo: 1, topic: 'Giới thiệu Sensabot, GPIO & Breadboard trên Jetson Nano', learningOutcomes: 'LO11, LO13, LO14, LO17, LO19, LO20', teachingType: 'Khác', materials: 'JetBot ROS AI Kit / Kế hoạch bài giảng', notes: 'Khái niệm Sensabot, chân GPIO Jetson Nano, nguyên lý Breadboard' },
  { sessionNo: 2, topic: 'Điều khiển LED (tiết 1)', learningOutcomes: 'LO9, LO11, LO12, LO13, LO14, LO19, LO20, LO27', teachingType: 'Khác', materials: 'Kit + Linh kiện', notes: 'Mạch điện trở, LED, GND; lập trình bật/tắt bằng Jetson.GPIO' },
  { sessionNo: 3, topic: 'Điều khiển LED (tiết 2)', learningOutcomes: 'LO3, LO4, LO9, LO11, LO12, LO13, LO19, LO20, LO21, LO22', teachingType: 'Khác', materials: 'Kit + Linh kiện', notes: 'Nháy LED chu kỳ tùy chỉnh; mở rộng 3s sáng / 1s tắt' },
  { sessionNo: 4, topic: 'Điều khiển nhiều LED', learningOutcomes: 'LO9, LO11, LO12, LO13, LO14, LO16, LO19, LO20, LO25, LO27', teachingType: 'Khác', materials: 'Kit + Linh kiện', notes: 'Lắp ráp mạch 3 LED; nguyên lý đèn tín hiệu giao thông' },
  { sessionNo: 5, topic: 'Nút nhấn (tiết 1)', learningOutcomes: 'LO3, LO4, LO9, LO11, LO12, LO13, LO19, LO20, LO21, LO22, LO27', teachingType: 'Khác', materials: 'Kit + Nút nhấn', notes: 'Nguyên lý pull-up resistor; đọc tín hiệu nhấn giữ thì LED sáng' },
  { sessionNo: 6, topic: 'Nút nhấn (tiết 2)', learningOutcomes: 'LO11, LO12, LO13, LO14, LO17, LO19, LO20', teachingType: 'Khác', materials: 'Kit + Nút nhấn', notes: 'Lập trình toggle nhấn bật/nhấn tắt; xử lý chống rung (debounce)' },
  { sessionNo: 7, topic: 'TM1637 - Điều khiển LED 7 đoạn (tiết 1)', learningOutcomes: 'LO3, LO4, LO11, LO12, LO13, LO19, LO20, LO21, LO22', teachingType: 'Khác', materials: 'TM1637 Display', notes: 'Nguyên lý LED 7 đoạn 4 số; giao thức bit-banging CLK/DIO' },
  { sessionNo: 8, topic: 'TM1637 - Điều khiển LED 7 đoạn (tiết 2)', learningOutcomes: 'LO3, LO4, LO9, LO10, LO11, LO12, LO13, LO19, LO20, LO21, LO22', teachingType: 'Khác', materials: 'TM1637 Display', notes: 'Hiển thị số tùy ý, đếm tiến 0->9999 và đếm lùi' },
  { sessionNo: 9, topic: 'Đồng hồ bấm giờ (tiết 1)', learningOutcomes: 'LO3, LO4, LO6, LO9, LO10, LO11, LO12, LO13, LO19, LO20, LO21, LO22', teachingType: 'Khác', materials: 'TM1637 + 2 nút', notes: 'Thiết kế logic Start/Stop/Reset; lắp ráp và lập trình' },
  { sessionNo: 10, topic: 'Đồng hồ bấm giờ (tiết 2)', learningOutcomes: 'LO3, LO4, LO9, LO10, LO11, LO12, LO13, LO19, LO20, LO21, LO22', teachingType: 'Khác', materials: 'TM1637 + 2 nút', notes: 'Mở rộng hiển thị phút giây, kiểm thử các tình huống biên' },
  { sessionNo: 11, topic: 'Đồng hồ đếm ngược', learningOutcomes: 'LO3, LO4, LO6, LO9, LO10, LO11, LO12, LO13, LO19, LO20, LO21, LO22', teachingType: 'Khác', materials: 'TM1637 + nút', notes: 'Nhập thời gian đếm ngược; nhấp nháy 8888 khi hết giờ' },
  { sessionNo: 12, topic: 'Đèn giao thông (tiết 1)', learningOutcomes: 'LO3, LO4, LO6, LO9, LO10, LO11, LO12, LO13, LO16, LO19, LO20, LO21, LO22, LO27', teachingType: 'Khác', materials: '3 LED + TM1637', notes: 'Chu kỳ tự động Xanh->Vàng->Đỏ tích hợp đếm ngược TM1637' },
  { sessionNo: 13, topic: 'Đèn giao thông (tiết 2)', learningOutcomes: 'LO3, LO4, LO6, LO9, LO10, LO11, LO12, LO13, LO16, LO19, LO20, LO21, LO22, LO27, LO28', teachingType: 'Khác', materials: '3 LED + TM1637', notes: 'Nhập thời gian tùy chỉnh qua bàn phím; debug toàn hệ thống' },
  { sessionNo: 14, topic: 'Dự án GPIO (tiết 1) - Lên ý tưởng & thiết kế', learningOutcomes: 'LO1, LO2, LO3, LO6, LO8, LO9, LO10, LO11, LO14, LO20, LO30', teachingType: 'Dự án', materials: 'Kit thực hành', notes: 'Ý tưởng mô hình hệ thống tín hiệu giao thông thông minh' },
  { sessionNo: 15, topic: 'Dự án GPIO (tiết 2) - Lắp ráp & lập trình', learningOutcomes: 'LO3, LO4, LO6, LO9, LO10, LO11, LO12, LO13, LO14, LO16, LO20, LO21, LO22, LO30', teachingType: 'Dự án', materials: 'Kit thực hành', notes: 'Hoàn thiện sản phẩm theo tiêu chí đánh giá' },
  { sessionNo: 16, topic: 'Dự án GPIO (tiết 3) - Báo cáo & phản biện', learningOutcomes: 'LO1, LO3, LO4, LO5, LO6, LO7, LO8, LO9, LO10, LO11, LO12, LO13, LO14, LO20, LO30', teachingType: 'Dự án', materials: 'Sản phẩm nhóm', notes: 'Thuyết trình mạch và logic; đánh giá chéo giữa các nhóm' },
  { sessionNo: 17, topic: 'Báo cáo dự án giữa kỳ & Khởi động LIDAR', learningOutcomes: 'LO13, LO14, LO17, LO19, LO20', teachingType: 'Khác', materials: 'RPLIDAR A1', notes: 'Kết nối RPLIDAR A1 qua USB; phân tích topic /scan' },
  { sessionNo: 18, topic: 'Trực quan hoá dữ liệu LIDAR bằng RViz', learningOutcomes: 'LO13, LO14, LO17, LO18, LO19, LO20', teachingType: 'Khác', materials: 'RPLIDAR A1 + RViz', notes: 'Cấu hình Fixed Frame = laser; quan sát đám mây điểm 360°' },
  { sessionNo: 19, topic: 'Thuật toán lập bản đồ Hector Mapping', learningOutcomes: 'LO2, LO13, LO14, LO17, LO18, LO19, LO20', teachingType: 'Khác', materials: 'hector_mapping', notes: 'Nguyên lý scan-matching không cần encoder; cấu hình base_frame' },
  { sessionNo: 20, topic: 'Thực hành tạo bản đồ môi trường bằng Hector', learningOutcomes: 'LO3, LO4, LO5, LO12, LO13, LO17, LO18, LO19, LO20, LO21, LO22', teachingType: 'Khác', materials: 'hector_mapping', notes: 'Di chuyển robot, quan sát bản đồ cập nhật thời gian thực' },
  { sessionNo: 21, topic: 'Thuật toán lập bản đồ Gmapping', learningOutcomes: 'LO3, LO4, LO5, LO7, LO11, LO12, LO13, LO17, LO18, LO19, LO20, LO21, LO22, LO25, LO30', teachingType: 'Khác', materials: 'gmapping.launch', notes: 'Kết hợp LIDAR + Encoder + IMU; khắc phục hiện tượng drift' },
  { sessionNo: 22, topic: 'Điều khiển JetBot bằng tay cầm 2.4G', learningOutcomes: 'LO4, LO5, LO7, LO11, LO12, LO13, LO17, LO18, LO19, LO20, LO21, LO22, LO25, LO30', teachingType: 'Khác', materials: 'Tay cầm 2.4G', notes: 'Chuyển đổi Joy sang /cmd_vel; lăn bánh robot trên sàn' },
  { sessionNo: 23, topic: 'Thử thách: Vẽ bản đồ môi trường hoàn chỉnh', learningOutcomes: 'LO3, LO4, LO13, LO14, LO17, LO20, LO29', teachingType: 'Khác', materials: 'map_saver', notes: 'Lưu map.pgm và map.yaml; đánh giá độ chính xác biên dạng' },
  { sessionNo: 24, topic: 'Robotic Laser Coating Removal & AprilTags', learningOutcomes: 'LO11, LO12, LO13, LO14, LO17, LO19, LO20, LO25, LO26, LO27, LO28', teachingType: 'Khác', materials: 'Bài giảng PPT', notes: 'Ứng dụng AprilTag trong công nghiệp tẩy sơn laser tự động' },
  { sessionNo: 25, topic: 'Cấu hình môi trường & test Camera CSI', learningOutcomes: 'LO13, LO14, LO19, LO20, LO25, LO27', teachingType: 'Khác', materials: 'Camera IMX219', notes: 'Khởi động nvargus-daemon; hiển thị widget live feed' },
  { sessionNo: 26, topic: 'Hiệu chỉnh Camera cho AprilTag (tiết 1)', learningOutcomes: 'LO1, LO4, LO5, LO6, LO8, LO9, LO10, LO11, LO12, LO13, LO14, LO15', teachingType: 'Khác', materials: 'Checkerboard', notes: 'Chụp 10-15 khung hình ô cờ ở các góc độ và khoảng cách' },
  { sessionNo: 27, topic: 'Hiệu chỉnh Camera cho AprilTag (tiết 2)', learningOutcomes: 'LO9, LO13, LO14, LO19, LO20, LO25, LO27', teachingType: 'Khác', materials: 'OpenCV calib', notes: 'Tính toán ma trận K, hệ số méo; lưu camera_calibration.json' },
  { sessionNo: 28, topic: 'Nhận diện AprilTag (AprilTag Perception)', learningOutcomes: 'LO2, LO4, LO13, LO14, LO15, LO18, LO19, LO20, LO27', teachingType: 'Khác', materials: 'apriltag lib', notes: 'Phát hiện thẻ tag36h11; tính toán khoảng cách và góc lệch' },
  { sessionNo: 29, topic: 'Điều hướng AprilTag (tiết 1) - scan_for_tag', learningOutcomes: 'LO3, LO4, LO6, LO8, LO11, LO13, LO14, LO19, LO20, LO22, LO28', teachingType: 'Khác', materials: 'JetBot + Tag', notes: 'Lập trình xoay tìm kiếm tag theo hướng và tốc độ' },
  { sessionNo: 30, topic: 'Điều hướng AprilTag (tiết 2) - approach_tag', learningOutcomes: 'LO3, LO4, LO6, LO8, LO9, LO10, LO11, LO12, LO13, LO14, LO18', teachingType: 'Khác', materials: 'JetBot + Tag', notes: 'Căn chỉnh lệch ngang x_err và tiến tới khoảng cách đích desired_z_m' },
  { sessionNo: 31, topic: 'Thử thách Mê cung AprilTag (tiết 1) - Khảo sát', learningOutcomes: 'LO1, LO2, LO3, LO4, LO5, LO6, LO9, LO10, LO11, LO12, LO13, LO14', teachingType: 'Thực hành', materials: 'Sa bàn mê cung', notes: 'Bố trí thẻ TAG 0, 1, 2, 3; lập kế hoạch di chuyển' },
  { sessionNo: 32, topic: 'Thử thách Mê cung AprilTag (tiết 2) - Lập trình lộ trình', learningOutcomes: 'LO1, LO2, LO3, LO4, LO5, LO6, LO9, LO10, LO11, LO12, LO13, LO14', teachingType: 'Thực hành', materials: 'Sa bàn mê cung', notes: 'Cấu hình mảng WAYPOINTS; chạy thử nghiệm từng trạm' },
  { sessionNo: 33, topic: 'Thử thách Mê cung AprilTag (tiết 3) - Tinh chỉnh tham số', learningOutcomes: 'LO1, LO2, LO3, LO4, LO5, LO6, LO7, LO8, LO9, LO10, LO11, LO12', teachingType: 'Thực hành', materials: 'Sa bàn mê cung', notes: 'Tối ưu hóa tốc độ, góc dừng, tránh đâm quẹt tường' },
  { sessionNo: 34, topic: 'Thử thách Mê cung AprilTag (tiết 4) - Chấm điểm thử thách', learningOutcomes: 'LO1, LO2, LO3, LO4, LO5, LO6, LO7, LO8, LO9, LO10, LO11, LO12', teachingType: 'Thực hành', materials: 'Sa bàn mê cung', notes: 'Thi đấu vượt mê cung tính thời gian và độ chính xác' },
  { sessionNo: 35, topic: 'Quiz tổng kết & Đánh giá cuối kỳ', learningOutcomes: 'LO3, LO4, LO13, LO14, LO20, LO29', teachingType: 'Đánh giá', materials: 'Đề thi trắc nghiệm', notes: 'Tổng kết kiến thức toàn khóa Robotics Lớp 11 CMU' },
];

export const CLOS_DATA: CLOItem[] = [
  { id: 'LO 1', title: 'Xác định vấn đề', description: 'Đặt ra câu hỏi thú vị, thách thức và xác định vấn đề cần giải quyết trong cuộc sống hàng ngày.', mapping: 'STEM.2' },
  { id: 'LO 2', title: 'Mô hình hóa', description: 'Hình dung và dự đoán các hiện tượng tự nhiên cũng như các hệ thống kỹ thuật phức tạp.', mapping: 'STEM.1.2 ; STEM.1.4' },
  { id: 'LO 3', title: 'Thiết kế thí nghiệm', description: 'Thiết kế các thí nghiệm khoa học và cuộc điều tra kỹ thuật từ lập kế hoạch đến thu thập dữ liệu.', mapping: 'STEM.4.1 ; STEM.4.3' },
  { id: 'LO 4', title: 'Tư duy tính toán', description: 'Toán học và tư duy tính toán phân tích dữ liệu và giải quyết bài toán phức tạp trong phát triển mô hình.', mapping: 'STEM.3 ; CODI.4' },
  { id: 'LO 5', title: 'Phân tích dữ liệu', description: 'Phân tích dữ liệu thu thập được để rút ra kết luận có giá trị và ý nghĩa.', mapping: 'STEM.4.3 ; STEM.5' },
  { id: 'LO 6', title: 'Thiết kế giải pháp', description: 'Xây dựng giải thích khoa học và thiết kế giải pháp kỹ thuật dựa trên bằng chứng và lý thuyết.', mapping: 'STEM.2 ; ROBO.1' },
  { id: 'LO 11', title: 'Đánh giá giải pháp kỹ thuật', description: 'Đánh giá giải pháp dựa trên tiêu chí an toàn, độ tin cậy, chi phí và tác động xã hội.', mapping: 'STEM.5.3 ; STEM.2.3' },
  { id: 'LO 12', title: 'Mô phỏng máy tính', description: 'Sử dụng mô phỏng máy tính để mô hình hóa tác động của các giải pháp đối với bài toán thực tế.', mapping: 'STEM.1.4 ; ROBO.4.3' },
  { id: 'LO 17', title: 'Cảm biến máy tính', description: 'Mô tả những hạn chế và ưu điểm của các loại cảm biến máy tính (LIDAR, Sonar, Camera).', mapping: 'ROBO.3.1 ; ROBO.3.3' },
  { id: 'LO 18', title: 'Trích xuất đặc trưng', description: 'Giải thích cách trích xuất các tính năng từ dạng sóng và hình ảnh.', mapping: 'STEM.7.2 ; STEM.7.3' },
  { id: 'LO 20', title: 'Cấu trúc biểu diễn tri thức', description: 'Hiểu cách máy tính biểu hiện và lập luận thông qua biểu diễn đồ thị tri thức.', mapping: 'CODI.4.1 ; CODI.4.2' },
];
