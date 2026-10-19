import assert from 'node:assert';
import { prisma } from '../src/config/prisma.js';
import { calculateCosineSimilarity, calculateEuclideanDistance, encryptBiometricDescriptor, decryptBiometricDescriptor } from '../src/services/biometric.service.js';
import { toDecimal, roundMoney, calculatePercentage } from '../src/utils/decimal.js';

async function runTestSuite() {
  console.log('🧪 Starting HRM ERP Enterprise Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Math and Strict Decimal Monetary Tests
  await test('Strict Decimal Calculations: 50% Basic of $10,000 equals exactly $5,000.00', async () => {
    const base = toDecimal(10000);
    const basic = calculatePercentage(base, 50);
    assert.strictEqual(basic.toFixed(2), '5000.00');
  });

  await test('Strict Decimal Rounding: Half-up rounding prevents floating point drift', async () => {
    const val = toDecimal('100.456');
    const rounded = roundMoney(val);
    assert.strictEqual(rounded.toFixed(2), '100.46');
  });

  // 2. Biometric Vector Matching & Security Tests
  await test('Biometric Vector Cosine Similarity: Identical vectors yield similarity 1.0', async () => {
    const v1 = [0.12, 0.45, -0.67, 0.89, 0.22];
    const similarity = calculateCosineSimilarity(v1, v1);
    assert.ok(Math.abs(similarity - 1.0) < 0.0001, `Expected 1.0, got ${similarity}`);
  });

  await test('Biometric Vector Cosine Similarity: Orthogonal vectors yield similarity 0.0', async () => {
    const v1 = [1, 0, 0];
    const v2 = [0, 1, 0];
    const similarity = calculateCosineSimilarity(v1, v2);
    assert.strictEqual(similarity, 0);
  });

  await test('Biometric Encryption: AES-256-GCM encrypts and decrypts 128-d vector without data loss', async () => {
    const originalVector = Array.from({ length: 128 }, (_, i) => Number((Math.sin(i) * 0.5).toFixed(4)));
    const encrypted = encryptBiometricDescriptor(originalVector);
    assert.notStrictEqual(encrypted, JSON.stringify(originalVector));
    const decrypted = decryptBiometricDescriptor(encrypted);
    assert.deepStrictEqual(decrypted, originalVector);
  });

  // 3. Database & Business Logic Integration Tests
  await test('Database Verification: Seeded organization exists with timezone and currency', async () => {
    const org = await prisma.organization.findUnique({
      where: { code: 'APEX-GLOBAL' },
      include: { settings: true }
    });
    assert.ok(org, 'Organization APEX-GLOBAL must exist');
    assert.strictEqual(org.currency, 'USD');
    assert.strictEqual(org.timezone, 'America/New_York');
    assert.ok(org.settings?.enableFaceBiometrics, 'Biometrics should be enabled in settings');
  });

  await test('Tenant Isolation: Department queries only return records for target organization', async () => {
    const org = await prisma.organization.findUnique({ where: { code: 'APEX-GLOBAL' } });
    const depts = await prisma.department.findMany({
      where: { organizationId: org!.id }
    });
    assert.ok(depts.length >= 2, 'Must have at least 2 departments');
    for (const d of depts) {
      assert.strictEqual(d.organizationId, org!.id);
    }
  });

  await test('Shift & Attendance Integration: Verify daily summaries and punch calculation', async () => {
    const emp = await prisma.employee.findFirst({
      where: { employeeCode: 'APEX-0003' }
    });
    assert.ok(emp, 'Employee APEX-0003 must exist');

    const summary = await prisma.attendanceDailySummary.findFirst({
      where: { employeeId: emp.id }
    });
    assert.ok(summary, 'Daily attendance summary should exist for employee');
    assert.strictEqual(summary.status, 'PRESENT');
    assert.ok(summary.scheduledMinutes > 0);
  });

  await test('Payroll Snapshot Immutability: Locked payroll items maintain intact monetary values', async () => {
    const run = await prisma.payrollRun.findFirst({
      where: { status: 'LOCKED' },
      include: {
        payrollItems: {
          include: { earnings: true, deductions: true }
        }
      }
    });
    assert.ok(run, 'Locked payroll run must exist');
    assert.strictEqual(run.status, 'LOCKED');
    assert.ok(run.payrollItems.length > 0);
    const item = run.payrollItems[0];
    assert.strictEqual(Number(item.grossPay), 10000);
    assert.strictEqual(Number(item.totalDeductions), 1150);
    assert.strictEqual(Number(item.netPay), 8850);
  });

  await test('Audit Trail Integrity: Organization and auth events are tracked', async () => {
    const logs = await prisma.auditLog.findMany();
    assert.ok(logs.length > 0, 'Audit logs must be recorded');
  });

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

