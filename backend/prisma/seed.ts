import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Enterprise HRM Database Seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.helpdeskTicket.deleteMany();
  await prisma.assetAssignment.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.trainingAssignment.deleteMany();
  await prisma.trainingCourse.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.performanceGoal.deleteMany();
  await prisma.performanceCycle.deleteMany();
  await prisma.jobOffer.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobRequisition.deleteMany();
  await prisma.loanRepayment.deleteMany();
  await prisma.employeeLoan.deleteMany();
  await prisma.expenseClaim.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payrollDeduction.deleteMany();
  await prisma.payrollEarning.deleteMany();
  await prisma.payrollItem.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.payrollPeriod.deleteMany();
  await prisma.employeeSalaryAssignment.deleteMany();
  await prisma.salaryComponent.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.leaveTransaction.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.biometricTemplate.deleteMany();
  await prisma.biometricConsentRecord.deleteMany();
  await prisma.attendanceCorrectionRequest.deleteMany();
  await prisma.attendanceDailySummary.deleteMany();
  await prisma.attendanceEvent.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.workCalendar.deleteMany();
  await prisma.shiftSwapRequest.deleteMany();
  await prisma.shiftAssignment.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.managerAssignment.deleteMany();
  await prisma.employeeEmergencyContact.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.employmentHistory.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.department.deleteMany();
  await prisma.workLocation.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.organizationSettings.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      code: 'APEX-GLOBAL',
      name: 'Apex Global Enterprises',
      legalName: 'Apex Global Technologies & Systems Inc.',
      taxId: 'US-EIN-987654321',
      contactEmail: 'contact@apexglobal.io',
      contactPhone: '+1 (555) 019-2834',
      address: '100 Enterprise Boulevard, Suite 500',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      timezone: 'America/New_York',
      currency: 'USD',
      weekStartDay: 1, // Monday
      fiscalYearStart: 1, // January
      settings: {
        create: {
          enableFaceBiometrics: true,
          biometricThreshold: 0.60,
          requireLivenessCheck: true,
          allowManualAttendance: true,
          autoApproveOvertime: false,
          overtimeGraceMinutes: 15,
          maxCarryForwardDays: 10,
          brandingPrimaryColor: '#2563eb'
        }
      }
    }
  });

  // 2. Branches & Work Locations
  const branchHQ = await prisma.branch.create({
    data: {
      organizationId: org.id,
      code: 'BR-NYC',
      name: 'New York Headquarters',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      timezone: 'America/New_York'
    }
  });

  const branchSF = await prisma.branch.create({
    data: {
      organizationId: org.id,
      code: 'BR-SFO',
      name: 'San Francisco Innovation Lab',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      timezone: 'America/Los_Angeles'
    }
  });

  const locHQ = await prisma.workLocation.create({
    data: {
      organizationId: org.id,
      branchId: branchHQ.id,
      name: 'Floor 12 - Apex Tower NY',
      latitude: 40.7128,
      longitude: -74.0060,
      radiusMeters: 300
    }
  });

  // 3. Cost Centers
  const ccEngineering = await prisma.costCenter.create({
    data: {
      organizationId: org.id,
      code: 'CC-ENG',
      name: 'Engineering & Technology R&D',
      budget: 2500000.00
    }
  });

  const ccHR = await prisma.costCenter.create({
    data: {
      organizationId: org.id,
      code: 'CC-HR',
      name: 'People Operations & Culture',
      budget: 600000.00
    }
  });

  // 4. Departments & Designations
  const deptEng = await prisma.department.create({
    data: {
      organizationId: org.id,
      code: 'ENG',
      name: 'Engineering',
      description: 'Software development, cloud architecture and IT operations',
      costCenterId: ccEngineering.id
    }
  });

  const deptHR = await prisma.department.create({
    data: {
      organizationId: org.id,
      code: 'HR',
      name: 'Human Resources',
      description: 'Talent acquisition, employee experience, and statutory compliance',
      costCenterId: ccHR.id
    }
  });

  const desigVP = await prisma.designation.create({
    data: { organizationId: org.id, code: 'VP-ENG', title: 'VP of Engineering', level: 6 }
  });

  const desigEM = await prisma.designation.create({
    data: { organizationId: org.id, code: 'ENG-MGR', title: 'Engineering Manager', level: 5 }
  });

  const desigSeniorDev = await prisma.designation.create({
    data: { organizationId: org.id, code: 'SR-SWE', title: 'Senior Full Stack Engineer', level: 4 }
  });

  const desigHRGeneralist = await prisma.designation.create({
    data: { organizationId: org.id, code: 'HR-GEN', title: 'HR Operations Manager', level: 4 }
  });

  // 5. Teams
  const teamCloud = await prisma.team.create({
    data: {
      organizationId: org.id,
      name: 'Platform Core & Cloud Services',
      description: 'Distributed infrastructure and backend microservices'
    }
  });

  // 6. Permissions and Roles
  const permissionCodes = [
    { code: 'employee:read', module: 'EMPLOYEES', action: 'READ' },
    { code: 'employee:write', module: 'EMPLOYEES', action: 'WRITE' },
    { code: 'attendance:read', module: 'ATTENDANCE', action: 'READ' },
    { code: 'attendance:punch', module: 'ATTENDANCE', action: 'PUNCH' },
    { code: 'attendance:approve', module: 'ATTENDANCE', action: 'APPROVE' },
    { code: 'leave:apply', module: 'LEAVES', action: 'APPLY' },
    { code: 'leave:approve', module: 'LEAVES', action: 'APPROVE' },
    { code: 'payroll:read', module: 'PAYROLL', action: 'READ' },
    { code: 'payroll:process', module: 'PAYROLL', action: 'PROCESS' },
    { code: 'expense:claim', module: 'EXPENSES', action: 'CLAIM' },
    { code: 'expense:approve', module: 'EXPENSES', action: 'APPROVE' },
    { code: 'recruitment:manage', module: 'RECRUITMENT', action: 'MANAGE' },
    { code: 'reports:view', module: 'REPORTS', action: 'VIEW' },
    { code: 'settings:manage', module: 'SETTINGS', action: 'MANAGE' },
  ];

  const permissions = [];
  for (const perm of permissionCodes) {
    const p = await prisma.permission.create({
      data: {
        code: perm.code,
        module: perm.module,
        action: perm.action,
        description: `Permission for ${perm.module} ${perm.action}`
      }
    });
    permissions.push(p);
  }

  const roleSuperAdmin = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Super Admin',
      description: 'Full unconstrained system administrator access',
      isSystem: true
    }
  });

  const roleDeptManager = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Department Manager',
      description: 'Team oversight, shift approvals, and performance reviews',
      isSystem: true
    }
  });

  const roleEmployee = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'Employee',
      description: 'Employee self-service and personal records access',
      isSystem: true
    }
  });

  // Assign all permissions to Super Admin
  for (const p of permissions) {
    await prisma.rolePermission.create({
      data: { roleId: roleSuperAdmin.id, permissionId: p.id }
    });
  }

  // 7. Users and Employees
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // User 1: Super Admin (Admin)
  const userAdmin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@apexglobal.io',
      passwordHash,
      isActive: true,
      isEmailVerified: true
    }
  });
  await prisma.userRole.create({
    data: { userId: userAdmin.id, roleId: roleSuperAdmin.id }
  });

  const empAdmin = await prisma.employee.create({
    data: {
      organizationId: org.id,
      userId: userAdmin.id,
      employeeCode: 'APEX-0001',
      firstName: 'Eleanor',
      lastName: 'Vance',
      workEmail: 'admin@apexglobal.io',
      phone: '+1 (555) 234-5678',
      gender: 'FEMALE',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: new Date('2022-01-10'),
      branchId: branchHQ.id,
      workLocationId: locHQ.id,
      departmentId: deptHR.id,
      designationId: desigHRGeneralist.id,
      city: 'New York',
      state: 'NY',
      country: 'USA'
    }
  });

  // User 2: Department Manager (Alex Morgan)
  const userManager = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'manager@apexglobal.io',
      passwordHash,
      isActive: true,
      isEmailVerified: true
    }
  });
  await prisma.userRole.create({
    data: { userId: userManager.id, roleId: roleDeptManager.id }
  });

  const empManager = await prisma.employee.create({
    data: {
      organizationId: org.id,
      userId: userManager.id,
      employeeCode: 'APEX-0002',
      firstName: 'Alex',
      lastName: 'Morgan',
      workEmail: 'manager@apexglobal.io',
      phone: '+1 (555) 345-6789',
      gender: 'MALE',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: new Date('2022-03-15'),
      branchId: branchHQ.id,
      workLocationId: locHQ.id,
      departmentId: deptEng.id,
      designationId: desigEM.id,
      teamId: teamCloud.id,
      city: 'New York',
      state: 'NY',
      country: 'USA'
    }
  });

  // User 3: Senior Developer (John Doe)
  const userEmp1 = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'john.doe@apexglobal.io',
      passwordHash,
      isActive: true,
      isEmailVerified: true
    }
  });
  await prisma.userRole.create({
    data: { userId: userEmp1.id, roleId: roleEmployee.id }
  });

  const empDev1 = await prisma.employee.create({
    data: {
      organizationId: org.id,
      userId: userEmp1.id,
      employeeCode: 'APEX-0003',
      firstName: 'John',
      lastName: 'Doe',
      workEmail: 'john.doe@apexglobal.io',
      phone: '+1 (555) 456-7890',
      gender: 'MALE',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: new Date('2023-02-01'),
      managerId: empManager.id,
      branchId: branchHQ.id,
      workLocationId: locHQ.id,
      departmentId: deptEng.id,
      designationId: desigSeniorDev.id,
      teamId: teamCloud.id,
      city: 'Brooklyn',
      state: 'NY',
      country: 'USA'
    }
  });

  // User 4: Senior Developer 2 (Jane Smith)
  const userEmp2 = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'jane.smith@apexglobal.io',
      passwordHash,
      isActive: true,
      isEmailVerified: true
    }
  });
  await prisma.userRole.create({
    data: { userId: userEmp2.id, roleId: roleEmployee.id }
  });

  const empDev2 = await prisma.employee.create({
    data: {
      organizationId: org.id,
      userId: userEmp2.id,
      employeeCode: 'APEX-0004',
      firstName: 'Jane',
      lastName: 'Smith',
      workEmail: 'jane.smith@apexglobal.io',
      phone: '+1 (555) 567-8901',
      gender: 'FEMALE',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: new Date('2023-06-12'),
      managerId: empManager.id,
      branchId: branchSF.id,
      departmentId: deptEng.id,
      designationId: desigSeniorDev.id,
      city: 'San Francisco',
      state: 'CA',
      country: 'USA'
    }
  });

  // 8. Shifts Configuration
  const shiftGeneral = await prisma.shift.create({
    data: {
      organizationId: org.id,
      code: 'GEN-0918',
      name: 'General Standard Shift',
      shiftType: 'FIXED',
      startTime: '09:00',
      endTime: '18:00',
      isOvernight: false,
      expectedMinutes: 480,
      breakMinutes: 60,
      isBreakPaid: false,
      graceMinutes: 15,
      lateThresholdMinutes: 30,
      earlyCheckoutMinutes: 30,
      overtimeEligible: true,
      colorTag: '#3b82f6'
    }
  });

  const shiftMorning = await prisma.shift.create({
    data: {
      organizationId: org.id,
      code: 'MORN-0614',
      name: 'Morning Shift',
      shiftType: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      isOvernight: false,
      expectedMinutes: 480,
      breakMinutes: 30,
      colorTag: '#10b981'
    }
  });

  const shiftNight = await prisma.shift.create({
    data: {
      organizationId: org.id,
      code: 'NGHT-2206',
      name: 'Overnight Shift (Graveyard)',
      shiftType: 'FIXED',
      startTime: '22:00',
      endTime: '06:00',
      isOvernight: true,
      expectedMinutes: 480,
      breakMinutes: 45,
      colorTag: '#8b5cf6'
    }
  });

  // Assign shifts to employees
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31);

  await prisma.shiftAssignment.create({
    data: {
      employeeId: empDev1.id,
      shiftId: shiftGeneral.id,
      startDate: startOfYear,
      endDate: endOfYear
    }
  });

  await prisma.shiftAssignment.create({
    data: {
      employeeId: empDev2.id,
      shiftId: shiftGeneral.id,
      startDate: startOfYear,
      endDate: endOfYear
    }
  });

  // 9. Attendance Seed Records
  const todayDateOnly = new Date(today.toISOString().split('T')[0]);

  // Dev 1 has checked in today on time
  const checkInTime = new Date(todayDateOnly);
  checkInTime.setHours(9, 5, 0, 0);

  await prisma.attendanceEvent.create({
    data: {
      employeeId: empDev1.id,
      timestamp: checkInTime,
      eventType: 'CHECK_IN',
      source: 'FACIAL_RECOGNITION',
      biometricMatch: true,
      similarityScore: 0.942,
      notes: 'Face verification verified successfully'
    }
  });

  await prisma.attendanceDailySummary.create({
    data: {
      employeeId: empDev1.id,
      date: todayDateOnly,
      status: 'PRESENT',
      firstCheckIn: checkInTime,
      scheduledMinutes: 480,
      actualMinutes: 240,
      paidMinutes: 240,
      lateMinutes: 5,
      earlyDepartMinutes: 0
    }
  });

  // Biometric Consent & Template Sample for John Doe
  await prisma.biometricConsentRecord.create({
    data: {
      employeeId: empDev1.id,
      hasConsented: true,
      consentText: 'I consent to the collection and use of 128-dimensional facial biometric descriptors strictly for workplace attendance verification.'
    }
  });

  // Generate sample 128-d normalized vector representation
  const sampleDescriptor = Array.from({ length: 128 }, () => Number((Math.random() * 0.1 - 0.05).toFixed(5)));
  await prisma.biometricTemplate.create({
    data: {
      employeeId: empDev1.id,
      modelVersion: 'ssd_mobilenet_v1_128d',
      embeddingData: JSON.stringify(sampleDescriptor),
      isActive: true
    }
  });

  // 10. Leave Types & Balances
  const leaveAnnual = await prisma.leaveType.create({
    data: {
      organizationId: org.id,
      code: 'ANNUAL',
      name: 'Paid Annual Vacation',
      annualQuota: 20,
      isPaid: true,
      allowCarryOver: true,
      maxCarryOver: 10
    }
  });

  const leaveSick = await prisma.leaveType.create({
    data: {
      organizationId: org.id,
      code: 'SICK',
      name: 'Medical & Sick Leave',
      annualQuota: 12,
      isPaid: true,
      requiresDoc: true
    }
  });

  const leaveCasual = await prisma.leaveType.create({
    data: {
      organizationId: org.id,
      code: 'CASUAL',
      name: 'Casual / Personal Leave',
      annualQuota: 8,
      isPaid: true
    }
  });

  // Balances for John Doe
  await prisma.leaveBalance.create({
    data: {
      employeeId: empDev1.id,
      leaveTypeId: leaveAnnual.id,
      year: today.getFullYear(),
      opening: 20,
      accrued: 15,
      taken: 3,
      balance: 17
    }
  });

  await prisma.leaveBalance.create({
    data: {
      employeeId: empDev1.id,
      leaveTypeId: leaveSick.id,
      year: today.getFullYear(),
      opening: 12,
      accrued: 10,
      taken: 1,
      balance: 11
    }
  });

  // Leave Request
  const leaveStart = new Date(today.getFullYear(), today.getMonth(), 25);
  const leaveEnd = new Date(today.getFullYear(), today.getMonth(), 27);
  await prisma.leaveRequest.create({
    data: {
      employeeId: empDev1.id,
      leaveTypeId: leaveAnnual.id,
      startDate: leaveStart,
      endDate: leaveEnd,
      daysCount: 3,
      reason: 'Attending family wedding and annual rest',
      status: 'APPROVED',
      approvedById: empManager.id,
      approvedAt: new Date()
    }
  });

  // 11. Salary Structure & Payroll
  const salaryStructure = await prisma.salaryStructure.create({
    data: {
      organizationId: org.id,
      name: 'Standard Tech Engineering Grade 4',
      description: 'Salaried package for senior software engineers',
      currency: 'USD'
    }
  });

  // Basic Pay: 50%
  await prisma.salaryComponent.create({
    data: {
      salaryStructureId: salaryStructure.id,
      name: 'Basic Pay',
      code: 'BASIC',
      type: 'EARNING',
      percentageOfBasic: 50,
      isTaxable: true,
      displayOrder: 1
    }
  });

  // Housing Allowance (HRA): 30%
  await prisma.salaryComponent.create({
    data: {
      salaryStructureId: salaryStructure.id,
      name: 'House Rent Allowance (HRA)',
      code: 'HRA',
      type: 'EARNING',
      percentageOfBasic: 30,
      isTaxable: true,
      displayOrder: 2
    }
  });

  // Special Allowance: 20%
  await prisma.salaryComponent.create({
    data: {
      salaryStructureId: salaryStructure.id,
      name: 'Special Allowance',
      code: 'SPECIAL_ALLOWANCE',
      type: 'EARNING',
      percentageOfBasic: 20,
      isTaxable: true,
      displayOrder: 3
    }
  });

  // Medical Insurance Deduction: Fixed $150
  await prisma.salaryComponent.create({
    data: {
      salaryStructureId: salaryStructure.id,
      name: 'Health & Dental Insurance',
      code: 'HEALTH_INS',
      type: 'DEDUCTION',
      fixedAmount: 150.00,
      isTaxable: false,
      displayOrder: 4
    }
  });

  // Assign Salary to John Doe: $120,000 / year = $10,000 / month
  await prisma.employeeSalaryAssignment.create({
    data: {
      employeeId: empDev1.id,
      salaryStructureId: salaryStructure.id,
      baseSalary: 10000.00,
      effectiveFrom: new Date('2023-02-01')
    }
  });

  // Payroll Period & Run for last month
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const payrollPeriod = await prisma.payrollPeriod.create({
    data: {
      organizationId: org.id,
      name: `September 2026 Payroll`,
      startDate: lastMonth,
      endDate: lastMonthEnd,
      payDate: lastMonthEnd,
      isClosed: true
    }
  });

  const payrollRun = await prisma.payrollRun.create({
    data: {
      organizationId: org.id,
      periodId: payrollPeriod.id,
      runNumber: 'PR-2026-09-001',
      totalGross: 10000.00,
      totalDeductions: 1150.00,
      totalNet: 8850.00,
      status: 'LOCKED',
      approvedById: empAdmin.id,
      approvedAt: lastMonthEnd,
      lockedAt: lastMonthEnd
    }
  });

  const payrollItem1 = await prisma.payrollItem.create({
    data: {
      payrollRunId: payrollRun.id,
      employeeId: empDev1.id,
      payableDays: 22,
      unpaidDays: 0,
      grossPay: 10000.00,
      totalDeductions: 1150.00,
      netPay: 8850.00,
      overtimePay: 0
    }
  });

  await prisma.payrollEarning.create({
    data: { payrollItemId: payrollItem1.id, name: 'Basic Pay', amount: 5000.00 }
  });
  await prisma.payrollEarning.create({
    data: { payrollItemId: payrollItem1.id, name: 'House Rent Allowance (HRA)', amount: 3000.00 }
  });
  await prisma.payrollEarning.create({
    data: { payrollItemId: payrollItem1.id, name: 'Special Allowance', amount: 2000.00 }
  });
  await prisma.payrollDeduction.create({
    data: { payrollItemId: payrollItem1.id, name: 'Income Tax (Statutory)', amount: 1000.00 }
  });
  await prisma.payrollDeduction.create({
    data: { payrollItemId: payrollItem1.id, name: 'Health & Dental Insurance', amount: 150.00 }
  });

  // Payslip
  await prisma.payslip.create({
    data: {
      payrollItemId: payrollItem1.id,
      employeeId: empDev1.id,
      payslipNumber: 'SLIP-202609-0003',
      month: 9,
      year: 2026,
      isPublished: true
    }
  });

  // 12. Expense Category & Claims
  const expTravel = await prisma.expenseCategory.create({
    data: {
      organizationId: org.id,
      name: 'Travel & Client Transportation',
      maxLimit: 1500.00
    }
  });

  const expSoftware = await prisma.expenseCategory.create({
    data: {
      organizationId: org.id,
      name: 'Developer Tools & SaaS Subscriptions',
      maxLimit: 500.00
    }
  });

  await prisma.expenseClaim.create({
    data: {
      employeeId: empDev1.id,
      categoryId: expSoftware.id,
      amount: 149.00,
      claimDate: new Date(),
      description: 'Annual JetBrains All Products Pack subscription for engineering work',
      status: 'APPROVED',
      approvedById: empManager.id,
      approvedAt: new Date()
    }
  });

  // 13. Recruitment & ATS
  const jobReq = await prisma.jobRequisition.create({
    data: {
      organizationId: org.id,
      title: 'Senior Distributed Systems Architect',
      departmentId: deptEng.id,
      designationId: desigSeniorDev.id,
      openings: 2,
      jobType: 'FULL_TIME',
      experienceYears: 6,
      description: 'Architect and scale low-latency distributed cloud infrastructure.',
      status: 'OPEN'
    }
  });

  const candidate = await prisma.candidate.create({
    data: {
      requisitionId: jobReq.id,
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller.tech@example.com',
      phone: '+1 (555) 789-0123',
      stage: 'INTERVIEW',
      source: 'LINKEDIN',
      rating: 5
    }
  });

  await prisma.interview.create({
    data: {
      candidateId: candidate.id,
      interviewerId: empDev1.id,
      scheduledAt: new Date(Date.now() + 86400000 * 2),
      interviewType: 'TECHNICAL_SYSTEMS_DESIGN',
      status: 'SCHEDULED'
    }
  });

  // 14. Performance & Training
  const perfCycle = await prisma.performanceCycle.create({
    data: {
      organizationId: org.id,
      title: 'H2 2026 Engineering & Leadership Review',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE'
    }
  });

  await prisma.performanceGoal.create({
    data: {
      cycleId: perfCycle.id,
      employeeId: empDev1.id,
      title: 'Migrate Core Services to Microservice Mesh with 99.99% Uptime',
      description: 'Zero customer downtime migration and automated canary deployment pipelines.',
      weightage: 50,
      progress: 75,
      status: 'IN_PROGRESS'
    }
  });

  const courseSecurity = await prisma.trainingCourse.create({
    data: {
      organizationId: org.id,
      title: 'SOC2 Type II & OWASP Enterprise Security Best Practices',
      description: 'Mandatory annual information security, access control, and GDPR compliance training',
      durationHours: 4,
      isMandatory: true
    }
  });

  await prisma.trainingAssignment.create({
    data: {
      courseId: courseSecurity.id,
      employeeId: empDev1.id,
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });

  // 15. Assets
  const assetLaptop = await prisma.asset.create({
    data: {
      organizationId: org.id,
      assetTag: 'APX-LPT-2024-0089',
      name: 'Apple MacBook Pro 16" M3 Max 64GB',
      category: 'LAPTOP',
      serialNumber: 'C02G9988H77A',
      cost: 3899.00,
      status: 'ALLOCATED'
    }
  });

  await prisma.assetAssignment.create({
    data: {
      assetId: assetLaptop.id,
      employeeId: empDev1.id,
      allocatedAt: new Date('2023-02-01'),
      condition: 'EXCELLENT',
      notes: 'Issued with AC adapter and carrying sleeve'
    }
  });

  // 16. Helpdesk Ticket
  const ticket = await prisma.helpdeskTicket.create({
    data: {
      ticketNumber: 'TICK-2026-1001',
      category: 'IT_HARDWARE',
      priority: 'MEDIUM',
      subject: 'Request for secondary 4K IPS display for workstation',
      description: 'Need an external 4K monitor for dual-screen productivity in NY HQ Office.',
      status: 'OPEN',
      createdById: userEmp1.id,
      assignedToId: userAdmin.id
    }
  });

  await prisma.ticketComment.create({
    data: {
      ticketId: ticket.id,
      userId: userAdmin.id,
      comment: 'Approved by IT procurement. Delivery expected to Desk #12 by Thursday.'
    }
  });

  // 17. Announcements & Notifications
  await prisma.announcement.create({
    data: {
      organizationId: org.id,
      title: 'Q4 2026 All-Hands Town Hall & Product Roadmap Reveal',
      content: 'Join CEO and executive leadership this Friday at 11:00 AM EST in Main Conference Auditorium or via global Zoom broadcast.',
      priority: 'HIGH',
      targetAudience: 'ALL'
    }
  });

  await prisma.notification.create({
    data: {
      organizationId: org.id,
      userId: userEmp1.id,
      title: 'Leave Approved',
      message: 'Your vacation request for Oct 25-27 has been reviewed and approved by Alex Morgan.',
      link: '/leave'
    }
  });

  await prisma.notification.create({
    data: {
      organizationId: org.id,
      userId: userEmp1.id,
      title: 'September 2026 Payslip Available',
      message: 'Your payslip for period September 2026 has been generated and published.',
      link: '/payroll'
    }
  });

  // 18. Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: userAdmin.id,
      module: 'ORGANIZATION',
      action: 'INITIALIZE',
      entityName: 'OrganizationSettings',
      entityId: org.id,
      newValue: JSON.stringify({ name: org.name, status: 'INITIALIZED' }),
      ipAddress: '127.0.0.1',
      userAgent: 'HRM Seed Engine'
    }
  });

  console.log('✅ Enterprise HRM Database seeded successfully!');
  console.log(`   Organization: ${org.name} (${org.code})`);
  console.log(`   Admin Login: admin@apexglobal.io / Admin@123`);
  console.log(`   Manager Login: manager@apexglobal.io / Admin@123`);
  console.log(`   Employee Login: john.doe@apexglobal.io / Admin@123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

