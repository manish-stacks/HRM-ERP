import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, requireRole } from '../middleware/rbac.middleware.js';

// Controllers
import * as authCtrl from '../controllers/auth.controller.js';
import * as orgCtrl from '../controllers/organization.controller.js';
import * as empCtrl from '../controllers/employee.controller.js';
import * as shiftCtrl from '../controllers/shift.controller.js';
import * as attCtrl from '../controllers/attendance.controller.js';
import * as bioCtrl from '../controllers/biometric.controller.js';
import * as leaveCtrl from '../controllers/leave.controller.js';
import * as payCtrl from '../controllers/payroll.controller.js';
import * as expCtrl from '../controllers/expense.controller.js';
import * as recCtrl from '../controllers/recruitment.controller.js';
import * as perfCtrl from '../controllers/performance.controller.js';
import * as trainCtrl from '../controllers/training.controller.js';
import * as assetCtrl from '../controllers/asset.controller.js';
import * as helpCtrl from '../controllers/helpdesk.controller.js';
import * as annCtrl from '../controllers/announcement.controller.js';
import * as repCtrl from '../controllers/report.controller.js';

export const apiRouter = Router();

// -------------------------------------------------------------
// AUTH
// -------------------------------------------------------------
apiRouter.post('/auth/login', authCtrl.login);
apiRouter.post('/auth/logout', authenticate, authCtrl.logout);
apiRouter.get('/auth/me', authenticate, authCtrl.getCurrentUser);

// -------------------------------------------------------------
// ORGANIZATION & SETTINGS
// -------------------------------------------------------------
apiRouter.get('/organization', authenticate, orgCtrl.getOrganizationDetails);
apiRouter.put('/organization', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.updateOrganizationDetails);
apiRouter.put('/organization/settings', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.updateOrganizationSettings);
apiRouter.get('/organization/branches', authenticate, orgCtrl.getBranches);
apiRouter.post('/organization/branches', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.createBranch);
apiRouter.put('/organization/branches/:id', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.updateBranch);
apiRouter.delete('/organization/branches/:id', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.deleteBranch);
apiRouter.get('/organization/departments', authenticate, orgCtrl.getDepartments);
apiRouter.post('/organization/departments', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.createDepartment);
apiRouter.put('/organization/departments/:id', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.updateDepartment);
apiRouter.delete('/organization/departments/:id', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.deleteDepartment);
apiRouter.get('/organization/designations', authenticate, orgCtrl.getDesignations);
apiRouter.post('/organization/designations', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.createDesignation);
apiRouter.put('/organization/designations/:id', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.updateDesignation);
apiRouter.delete('/organization/designations/:id', authenticate, requireRole('Super Admin', 'Organization Admin'), orgCtrl.deleteDesignation);
apiRouter.get('/organization/hierarchy', authenticate, orgCtrl.getOrganizationHierarchy);

// -------------------------------------------------------------
// EMPLOYEES
// -------------------------------------------------------------
apiRouter.get('/employees', authenticate, empCtrl.listEmployees);
apiRouter.get('/employees/:id', authenticate, empCtrl.getEmployeeById);
apiRouter.post('/employees', authenticate, requireRole('Super Admin', 'HR Admin', 'HR Manager'), empCtrl.createEmployee);
apiRouter.put('/employees/:id', authenticate, empCtrl.updateEmployee);
apiRouter.post('/employees/:id/lifecycle', authenticate, requireRole('Super Admin', 'HR Admin'), empCtrl.recordLifecycleEvent);

// -------------------------------------------------------------
// SHIFTS & ROSTER
// -------------------------------------------------------------
apiRouter.get('/shifts', authenticate, shiftCtrl.listShifts);
apiRouter.post('/shifts', authenticate, requireRole('Super Admin', 'HR Admin', 'Department Manager'), shiftCtrl.createShift);
apiRouter.get('/shifts/roster', authenticate, shiftCtrl.getRoster);
apiRouter.post('/shifts/assign', authenticate, requireRole('Super Admin', 'HR Admin', 'Department Manager'), shiftCtrl.assignShift);
apiRouter.get('/shifts/swap-requests', authenticate, shiftCtrl.listSwapRequests);
apiRouter.post('/shifts/swap-requests/:id/action', authenticate, shiftCtrl.actionSwapRequest);

// -------------------------------------------------------------
// ATTENDANCE & BIOMETRIC RECOGNITION
// -------------------------------------------------------------
apiRouter.post('/attendance/punch', authenticate, attCtrl.recordPunch);
apiRouter.get('/attendance/today', authenticate, attCtrl.getTodayLiveAttendance);
apiRouter.get('/attendance/history', authenticate, attCtrl.getAttendanceHistory);
apiRouter.post('/attendance/correction', authenticate, attCtrl.requestAttendanceCorrection);
apiRouter.get('/attendance/corrections', authenticate, attCtrl.listCorrections);
apiRouter.post('/attendance/corrections/:id/approve', authenticate, requireRole('Super Admin', 'HR Admin', 'Department Manager'), attCtrl.approveCorrection);

// Face Recognition Attendance
apiRouter.get('/biometric/employees', authenticate, bioCtrl.listEmployeesForEnrollment);
apiRouter.post('/biometric/consent', authenticate, bioCtrl.submitConsent);
apiRouter.post('/biometric/enroll', authenticate, bioCtrl.enrollFaceTemplate);
apiRouter.post('/biometric/verify-punch', bioCtrl.verifyFaceAndPunch); // Public for Kiosk (Direct Face Punch In without login)
apiRouter.post('/biometric/revoke', authenticate, bioCtrl.revokeBiometricTemplate);

// -------------------------------------------------------------
// LEAVES
// -------------------------------------------------------------
apiRouter.get('/leaves/types', authenticate, leaveCtrl.listLeaveTypes);
apiRouter.get('/leaves/balances', authenticate, leaveCtrl.getLeaveBalances);
apiRouter.get('/leaves/requests', authenticate, leaveCtrl.listLeaveRequests);
apiRouter.post('/leaves/apply', authenticate, leaveCtrl.applyLeave);
apiRouter.post('/leaves/requests/:id/action', authenticate, requireRole('Super Admin', 'HR Admin', 'Department Manager'), leaveCtrl.actionLeaveRequest);

// -------------------------------------------------------------
// PAYROLL & COMPENSATION
// -------------------------------------------------------------
apiRouter.get('/payroll/structures', authenticate, requireRole('Super Admin', 'Payroll Manager', 'HR Admin'), payCtrl.listSalaryStructures);
apiRouter.post('/payroll/assign-salary', authenticate, requireRole('Super Admin', 'Payroll Manager'), payCtrl.assignSalary);
apiRouter.get('/payroll/periods', authenticate, requireRole('Super Admin', 'Payroll Manager', 'HR Admin'), payCtrl.listPayrollPeriods);
apiRouter.post('/payroll/periods', authenticate, requireRole('Super Admin', 'Payroll Manager'), payCtrl.createPayrollPeriod);
apiRouter.post('/payroll/process', authenticate, requireRole('Super Admin', 'Payroll Manager'), payCtrl.processPayrollRun);
apiRouter.post('/payroll/runs/:id/lock', authenticate, requireRole('Super Admin', 'Payroll Manager'), payCtrl.lockPayrollRun);
apiRouter.get('/payroll/payslips/my', authenticate, payCtrl.listMyPayslips);
apiRouter.get('/payroll/payslips/:id', authenticate, payCtrl.getPayslip);

// -------------------------------------------------------------
// EXPENSES & REIMBURSEMENTS
// -------------------------------------------------------------
apiRouter.get('/expenses/categories', authenticate, expCtrl.listExpenseCategories);
apiRouter.get('/expenses/claims', authenticate, expCtrl.listClaims);
apiRouter.post('/expenses/claims', authenticate, expCtrl.submitClaim);
apiRouter.post('/expenses/claims/:id/action', authenticate, requireRole('Super Admin', 'Finance Manager', 'HR Admin'), expCtrl.actionClaim);
apiRouter.get('/expenses/loans', authenticate, requireRole('Super Admin', 'Finance Manager', 'HR Admin'), expCtrl.listLoans);

// -------------------------------------------------------------
// RECRUITMENT & ONBOARDING
// -------------------------------------------------------------
apiRouter.get('/recruitment/requisitions', authenticate, recCtrl.listRequisitions);
apiRouter.post('/recruitment/requisitions', authenticate, requireRole('Super Admin', 'HR Admin', 'Recruiter'), recCtrl.createRequisition);
apiRouter.get('/recruitment/candidates', authenticate, recCtrl.listCandidates);
apiRouter.post('/recruitment/candidates', authenticate, recCtrl.createCandidate);
apiRouter.patch('/recruitment/candidates/:id/stage', authenticate, requireRole('Super Admin', 'HR Admin', 'Recruiter'), recCtrl.updateCandidateStage);

// -------------------------------------------------------------
// PERFORMANCE & APPRAISALS
// -------------------------------------------------------------
apiRouter.get('/performance/cycles', authenticate, perfCtrl.listCycles);
apiRouter.get('/performance/goals', authenticate, perfCtrl.listGoals);
apiRouter.patch('/performance/goals/:id/progress', authenticate, perfCtrl.updateGoalProgress);
apiRouter.post('/performance/reviews', authenticate, perfCtrl.submitReview);

// -------------------------------------------------------------
// TRAINING & CERTIFICATIONS
// -------------------------------------------------------------
apiRouter.get('/training/courses', authenticate, trainCtrl.listCourses);
apiRouter.get('/training/assignments', authenticate, trainCtrl.listAssignments);
apiRouter.post('/training/assignments/:id/complete', authenticate, trainCtrl.completeCourse);

// -------------------------------------------------------------
// ASSETS
// -------------------------------------------------------------
apiRouter.get('/assets', authenticate, assetCtrl.listAssets);
apiRouter.post('/assets', authenticate, requireRole('Super Admin', 'IT/Asset Manager', 'HR Admin'), assetCtrl.createAsset);
apiRouter.post('/assets/allocate', authenticate, requireRole('Super Admin', 'IT/Asset Manager'), assetCtrl.allocateAsset);
apiRouter.post('/assets/return/:assignmentId', authenticate, requireRole('Super Admin', 'IT/Asset Manager'), assetCtrl.returnAsset);

// -------------------------------------------------------------
// HELPDESK
// -------------------------------------------------------------
apiRouter.get('/helpdesk/tickets', authenticate, helpCtrl.listTickets);
apiRouter.post('/helpdesk/tickets', authenticate, helpCtrl.createTicket);
apiRouter.post('/helpdesk/tickets/:id/comments', authenticate, helpCtrl.addComment);
apiRouter.patch('/helpdesk/tickets/:id/status', authenticate, helpCtrl.updateTicketStatus);

// -------------------------------------------------------------
// ANNOUNCEMENTS & NOTIFICATIONS
// -------------------------------------------------------------
apiRouter.get('/announcements', authenticate, annCtrl.listAnnouncements);
apiRouter.post('/announcements', authenticate, requireRole('Super Admin', 'HR Admin'), annCtrl.createAnnouncement);
apiRouter.get('/notifications', authenticate, annCtrl.listNotifications);
apiRouter.patch('/notifications/:id/read', authenticate, annCtrl.markNotificationAsRead);

// -------------------------------------------------------------
// REPORTS & DASHBOARD ANALYTICS
// -------------------------------------------------------------
apiRouter.get('/reports/audit-logs', authenticate, requireRole('Super Admin', 'Org Admin', 'HR Admin', 'Auditor'), repCtrl.getAuditLogs);
apiRouter.post('/reports/audit-logs/purge', authenticate, requireRole('Super Admin', 'Org Admin', 'HR Admin', 'Auditor'), repCtrl.purgeAuditLogsEndpoint);

