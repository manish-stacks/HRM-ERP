# Mobile API Contract & React Native Integration Specification

This document details the API contracts, data models, and architectural patterns designed for the React Native (Expo + TypeScript) mobile application.

All business logic, attendance rules, permissions, and salary calculations are executed in the core Express backend under `/api/v1`. The mobile application does not duplicate business rules.

---

## 1. Authentication & Session Architecture

### `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "john.doe@apexglobal.io",
    "password": "Password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": "usr_uuid",
        "email": "john.doe@apexglobal.io",
        "organizationId": "org_uuid",
        "roles": ["Employee"],
        "permissions": ["attendance:punch", "leave:apply"],
        "employee": {
          "id": "emp_uuid",
          "employeeCode": "APEX-0003",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    }
  }
  ```
- **Mobile Storage Strategy**:
  - Store `token` in memory / secure store.
  - Store `refreshToken` in `expo-secure-store`.
  - Pass header: `Authorization: Bearer <token>` on all requests.

---

## 2. Mobile Attendance with GPS & Facial Biometrics

### `POST /api/v1/attendance/punch`
- **Request Headers**:
  - `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "punchType": "CHECK_IN",
    "source": "MOBILE",
    "latitude": 40.712800,
    "longitude": -74.006000,
    "deviceInfo": "iPhone 15 Pro, iOS 18.0",
    "notes": "Remote HQ Check-In"
  }
  ```

### `POST /api/v1/biometric/verify-punch`
- **Request Body**:
  ```json
  {
    "employeeId": "emp_uuid",
    "descriptor": [-0.0432, 0.1298, ...], // 128-element float array
    "punchType": "CHECK_IN",
    "livenessPassed": true,
    "antiSpoofConfidence": 0.96
  }
  ```
- **Server Verification Rules**:
  1. Compares descriptor with AES-256 encrypted active template using Cosine Similarity.
  2. Ensures similarity exceeds organizational threshold (default: `0.60`).
  3. Rejects duplicate punch within 2 minutes.
  4. Resolves assigned shift and computes scheduled vs actual work minutes.

---

## 3. Offline Attendance Synchronization Protocol

To support employees clocking in/out during basement, flight, or field operations without network connectivity:

1. **Client-Side Queue**:
   - Store offline punches in mobile SQLite (`expo-sqlite`).
   - Include timestamp, GPS coordinates, punch type, and unique `clientPunchId` (UUID v4).
2. **Reconnection Sync**:
   - When network resumes (`@react-native-community/netinfo`), replay pending events to `POST /api/v1/attendance/punch`.
   - Backend idempotency checks guarantee duplicate events with identical client timestamp are ignored.
   - Preserves original punch timestamp while flagging `isManualOverride: true` and auditing the sync latency.

---

## 4. Push Notification Device Registration

### Mobile Contract:
- **Endpoint**: `POST /api/v1/notifications/register-device`
- **Payload**:
  ```json
  {
    "deviceToken": "ExponentPushToken[xxxxxxxxxxxx]",
    "platform": "IOS" | "ANDROID",
    "appVersion": "1.0.0"
  }
  ```
- Triggers notifications for:
  - Leave approval / rejection
  - Shift swap requests
  - Missing checkout alerts
  - Monthly payslip publication

