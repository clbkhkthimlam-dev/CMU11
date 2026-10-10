import { runQuantitativeTests } from '../src/simulation/testRunner';

async function main() {
  console.log('=== CMU10 VERIFICATION, ENDURANCE, PERFORMANCE & READINESS SUITE (T01 - T50) ===\n');
  const results = await runQuantitativeTests();
  let passCount = 0;
  let failCount = 0;

  results.forEach(r => {
    if (r.status === 'PASS') {
      passCount++;
      console.log(`✅ [${r.id}] PASS: ${r.name}`);
    } else {
      failCount++;
      console.log(`❌ [${r.id}] FAIL: ${r.name}`);
    }
    console.log(`   - Mục tiêu: ${r.targetCriteria}`);
    console.log(`   - Thực tế:  ${r.measuredResult}`);
    console.log(`   - Chi tiết: ${r.details}`);
    console.log('');
  });

  console.log('--------------------------------------------------');
  console.log(`KẾT QUẢ TỔNG HỢP: PASS: ${passCount} | FAIL: ${failCount} | TỔNG CỘNG: ${results.length}`);
  console.log('--------------------------------------------------');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Lỗi thực thi test suite:', err);
  process.exit(1);
});
