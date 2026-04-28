"use server";

/**
 * Flight Risk Detection – Server Actions
 *
 * Implements a Sliding Window algorithm (14-day window) over 180 days of
 * attendance history to detect employees showing behavioral signs of
 * potential resignation ("flight risk").
 *
 * Signals detected:
 *  1. Check-in time drift (arriving later than historical baseline)
 *  2. Late rate increase
 *  3. Absence / half-day rate increase
 *  4. Overtime decline
 */

import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────

export interface FlightRiskEmployee {
  userId: string;
  name: string;
  username: string | null;
  department: string | null;
  position: string | null;
  image: string | null;
  riskScore: number; // 0-100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  signals: {
    checkInDriftMinutes: number; // Positive = arriving later
    lateRateChange: number; // Percentage point change
    absentRateChange: number; // Percentage point change
    otDecline: number; // Hours decline
    zScore: number; // Check-in drift Z-Score
    zScoreLate: number; // Late rate Z-Score
    zScoreAbsent: number; // Absent rate Z-Score
    zScoreOt: number; // OT decline Z-Score
  };
  baseline: {
    avgCheckInMinute: number; // Minutes from midnight
    lateRate: number;
    absentRate: number;
    avgOtHours: number;
  };
  recent: {
    avgCheckInMinute: number;
    lateRate: number;
    absentRate: number;
    avgOtHours: number;
  };
}

export interface FlightRiskScanResult {
  success: boolean;
  employees: FlightRiskEmployee[];
  totalScanned: number;
  atRiskCount: number;
  scanDate: string;
  error?: string;
}

export interface EmployeeCheckInTimeSeries {
  date: string;
  checkInMinute: number | null; // Minutes from midnight, null = absent
  status: string;
}

export interface EmployeeFlightRiskDetail {
  success: boolean;
  employee: FlightRiskEmployee | null;
  timeSeries: EmployeeCheckInTimeSeries[];
  windowAverages: { windowEnd: string; avgCheckIn: number }[];
  error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function dateToMinuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

// ─── Core Sliding Window Algorithm ──────────────────────────────────

interface AttendanceRow {
  date: Date;
  checkIn: Date | null;
  status: string;
  overtimeHours: number | null;
  lateMinutes: number;
}

function computeWindowMetrics(records: AttendanceRow[]) {
  if (records.length === 0) {
    return { avgCheckIn: 0, lateRate: 0, absentRate: 0, avgOt: 0 };
  }

  let checkInSum = 0;
  let checkInCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let otSum = 0;

  for (const r of records) {
    if (r.checkIn) {
      checkInSum += dateToMinuteOfDay(r.checkIn);
      checkInCount++;
    }
    if (r.status === "LATE" || r.status === "LATE_AND_EARLY") {
      lateCount++;
    }
    if (r.status === "ABSENT" || r.status === "HALF_DAY") {
      absentCount++;
    }
    otSum += r.overtimeHours ?? 0;
  }

  return {
    avgCheckIn: checkInCount > 0 ? checkInSum / checkInCount : 0,
    lateRate: (lateCount / records.length) * 100,
    absentRate: (absentCount / records.length) * 100,
    avgOt: otSum / records.length,
  };
}

function computeStandardDeviation(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  if (values.length === 1) return { mean, stdDev: 0 };
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

function computeDeviationScore(
  baselineMetrics: ReturnType<typeof computeWindowMetrics>,
  recentMetrics: ReturnType<typeof computeWindowMetrics>,
  baselineStdDev: { checkIn: number; lateRate: number; absentRate: number; ot: number }
): { score: number; signals: FlightRiskEmployee["signals"] } {
  // Signal 1: Check-in drift Z-Score (max 30 points)
  const checkInDrift = recentMetrics.avgCheckIn - baselineMetrics.avgCheckIn;
  const zScoreCheckIn = checkInDrift / Math.max(5, baselineStdDev.checkIn); // Min std dev = 5 mins
  const checkInScore = Math.min(30, Math.max(0, zScoreCheckIn) * 10); // z=3 -> 30pts

  // Signal 2: Late rate change Z-Score (max 25 points)
  const lateRateChange = recentMetrics.lateRate - baselineMetrics.lateRate;
  const zScoreLate = lateRateChange / Math.max(2, baselineStdDev.lateRate); // Min std dev = 2%
  const lateScore = Math.min(25, Math.max(0, zScoreLate) * 8);

  // Signal 3: Absent rate change Z-Score (max 25 points)
  const absentRateChange = recentMetrics.absentRate - baselineMetrics.absentRate;
  const zScoreAbsent = absentRateChange / Math.max(2, baselineStdDev.absentRate); // Min std dev = 2%
  const absentScore = Math.min(25, Math.max(0, zScoreAbsent) * 8);

  // Signal 4: OT decline Z-Score (max 20 points)
  const otDecline = baselineMetrics.avgOt - recentMetrics.avgOt;
  const zScoreOt = otDecline / Math.max(0.5, baselineStdDev.ot); // Min std dev = 0.5h
  const otScore = Math.min(20, Math.max(0, zScoreOt) * 5);

  const totalScore = Math.round(
    Math.min(100, checkInScore + lateScore + absentScore + otScore),
  );

  return {
    score: totalScore,
    signals: {
      checkInDriftMinutes: Math.round(checkInDrift),
      lateRateChange: Math.round(lateRateChange * 10) / 10,
      absentRateChange: Math.round(absentRateChange * 10) / 10,
      otDecline: Math.round(otDecline * 10) / 10,
      zScore: Math.round(zScoreCheckIn * 100) / 100,
      zScoreLate: Math.round(zScoreLate * 100) / 100,
      zScoreAbsent: Math.round(zScoreAbsent * 100) / 100,
      zScoreOt: Math.round(zScoreOt * 100) / 100,
    },
  };
}

// ─── Main Scan Action ───────────────────────────────────────────────

export async function scanFlightRisk(departmentId?: string): Promise<FlightRiskScanResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, employees: [], totalScanned: 0, atRiskCount: 0, scanDate: "", error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 180);

    // Fetch all active users
    const userWhere: Record<string, unknown> = { employeeStatus: "ACTIVE" };
    if (departmentId) {
      userWhere.departmentId = departmentId;
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
    });

    // Fetch attendance records for all users in the period
    const attendances = await prisma.attendance.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        date: { gte: startDate, lte: today },
      },
      select: {
        userId: true,
        date: true,
        checkIn: true,
        status: true,
        overtimeHours: true,
        lateMinutes: true,
      },
      orderBy: { date: "asc" },
    });

    // Group by user
    const userAttMap = new Map<string, AttendanceRow[]>();
    for (const a of attendances) {
      const arr = userAttMap.get(a.userId) ?? [];
      arr.push({
        date: a.date,
        checkIn: a.checkIn,
        status: a.status,
        overtimeHours: a.overtimeHours ? Number(a.overtimeHours) : null,
        lateMinutes: a.lateMinutes,
      });
      userAttMap.set(a.userId, arr);
    }

    const results: FlightRiskEmployee[] = [];

    for (const user of users) {
      const records = userAttMap.get(user.id) ?? [];
      if (records.length < 30) continue; // Need minimum data

      // Filter weekends
      const workRecords = records.filter((r) => !isWeekend(new Date(r.date)));
      if (workRecords.length < 20) continue;

      // Split: baseline (older records) vs recent (last 30 days)
      const recentCutoff = new Date(today);
      recentCutoff.setDate(recentCutoff.getDate() - 30);

      // Extract sliding windows
      const WINDOW_SIZE = 14;
      const windowMetricsList: { date: Date; metrics: ReturnType<typeof computeWindowMetrics> }[] = [];
      for (let i = WINDOW_SIZE - 1; i < workRecords.length; i++) {
        const windowSlice = workRecords.slice(i - WINDOW_SIZE + 1, i + 1);
        windowMetricsList.push({
          date: new Date(workRecords[i].date),
          metrics: computeWindowMetrics(windowSlice),
        });
      }

      const baselineWindows = windowMetricsList.filter((w) => w.date < recentCutoff);
      const recentWindows = windowMetricsList.filter((w) => w.date >= recentCutoff);

      if (baselineWindows.length < 5 || recentWindows.length === 0) continue;

      const baselineCheckIns = baselineWindows.map((w) => w.metrics.avgCheckIn);
      const baselineLateRates = baselineWindows.map((w) => w.metrics.lateRate);
      const baselineAbsentRates = baselineWindows.map((w) => w.metrics.absentRate);
      const baselineOts = baselineWindows.map((w) => w.metrics.avgOt);

      const baselineStdDev = {
        checkIn: computeStandardDeviation(baselineCheckIns).stdDev,
        lateRate: computeStandardDeviation(baselineLateRates).stdDev,
        absentRate: computeStandardDeviation(baselineAbsentRates).stdDev,
        ot: computeStandardDeviation(baselineOts).stdDev,
      };

      // Scoring uses sliding window averages (consistent with stdDev source)
      const recentCheckIns = recentWindows.map((w) => w.metrics.avgCheckIn);
      const recentLateRates = recentWindows.map((w) => w.metrics.lateRate);
      const recentAbsentRates = recentWindows.map((w) => w.metrics.absentRate);
      const recentOts = recentWindows.map((w) => w.metrics.avgOt);

      const baselineWindowMetrics = {
        avgCheckIn: baselineCheckIns.reduce((s, v) => s + v, 0) / baselineCheckIns.length,
        lateRate: baselineLateRates.reduce((s, v) => s + v, 0) / baselineLateRates.length,
        absentRate: baselineAbsentRates.reduce((s, v) => s + v, 0) / baselineAbsentRates.length,
        avgOt: baselineOts.reduce((s, v) => s + v, 0) / baselineOts.length,
      };
      const recentWindowMetrics = {
        avgCheckIn: recentCheckIns.reduce((s, v) => s + v, 0) / recentCheckIns.length,
        lateRate: recentLateRates.reduce((s, v) => s + v, 0) / recentLateRates.length,
        absentRate: recentAbsentRates.reduce((s, v) => s + v, 0) / recentAbsentRates.length,
        avgOt: recentOts.reduce((s, v) => s + v, 0) / recentOts.length,
      };

      const { score, signals } = computeDeviationScore(
        baselineWindowMetrics,
        recentWindowMetrics,
        baselineStdDev
      );

      // Raw record averages for UI display (human-readable baseline vs recent)
      const baselineRecords = workRecords.filter((r) => new Date(r.date) < recentCutoff);
      const recentRecords = workRecords.filter((r) => new Date(r.date) >= recentCutoff);
      const baselineMetrics = computeWindowMetrics(baselineRecords);
      const recentMetrics = computeWindowMetrics(recentRecords);

      results.push({
        userId: user.id,
        name: user.name,
        username: user.username,
        department: user.department?.name ?? null,
        position: user.position?.name ?? null,
        image: user.image ?? null,
        riskScore: score,
        riskLevel: getRiskLevel(score),
        signals,
        baseline: {
          avgCheckInMinute: Math.round(baselineMetrics.avgCheckIn),
          lateRate: Math.round(baselineMetrics.lateRate * 10) / 10,
          absentRate: Math.round(baselineMetrics.absentRate * 10) / 10,
          avgOtHours: Math.round(baselineMetrics.avgOt * 10) / 10,
        },
        recent: {
          avgCheckInMinute: Math.round(recentMetrics.avgCheckIn),
          lateRate: Math.round(recentMetrics.lateRate * 10) / 10,
          absentRate: Math.round(recentMetrics.absentRate * 10) / 10,
          avgOtHours: Math.round(recentMetrics.avgOt * 10) / 10,
        },
      });
    }

    // Sort by risk score descending
    results.sort((a, b) => b.riskScore - a.riskScore);

    return {
      success: true,
      employees: results,
      totalScanned: users.length,
      atRiskCount: results.filter((e) => e.riskScore >= 30).length,
      scanDate: today.toISOString(),
    };
  } catch (err) {
    console.error("Flight Risk Scan error:", err);
    return {
      success: false,
      employees: [],
      totalScanned: 0,
      atRiskCount: 0,
      scanDate: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Initial Employees ──────────────────────────────────────────────

export async function getInitialEmployees(departmentId?: string): Promise<FlightRiskEmployee[]> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return [];

    const userWhere: Record<string, unknown> = { employeeStatus: "ACTIVE" };
    if (departmentId && departmentId !== "all") {
      userWhere.departmentId = departmentId;
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return users.map(user => ({
      userId: user.id,
      name: user.name,
      username: user.username,
      department: user.department?.name ?? null,
      position: user.position?.name ?? null,
      image: user.image ?? null,
      riskScore: 0,
      riskLevel: "LOW",
      signals: {
        checkInDriftMinutes: 0,
        lateRateChange: 0,
        absentRateChange: 0,
        otDecline: 0,
        zScore: 0,
        zScoreLate: 0,
        zScoreAbsent: 0,
        zScoreOt: 0,
      },
      baseline: { avgCheckInMinute: 0, lateRate: 0, absentRate: 0, avgOtHours: 0 },
      recent: { avgCheckInMinute: 0, lateRate: 0, absentRate: 0, avgOtHours: 0 },
    }));
  } catch (err) {
    console.error("Initial employees error:", err);
    return [];
  }
}

// ─── Employee Detail Action ─────────────────────────────────────────

export async function getEmployeeFlightRiskDetail(
  employeeId: string,
): Promise<EmployeeFlightRiskDetail> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, employee: null, timeSeries: [], windowAverages: [], error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
    });

    if (!user) {
      return { success: false, employee: null, timeSeries: [], windowAverages: [], error: "User not found" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 180);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: employeeId,
        date: { gte: startDate, lte: today },
      },
      select: {
        date: true,
        checkIn: true,
        status: true,
        overtimeHours: true,
        lateMinutes: true,
      },
      orderBy: { date: "asc" },
    });

    // Build time series
    const timeSeries: EmployeeCheckInTimeSeries[] = [];
    const workRecords: AttendanceRow[] = [];

    for (const a of attendances) {
      const d = new Date(a.date);
      if (isWeekend(d)) continue;

      const row: AttendanceRow = {
        date: a.date,
        checkIn: a.checkIn,
        status: a.status,
        overtimeHours: a.overtimeHours ? Number(a.overtimeHours) : null,
        lateMinutes: a.lateMinutes,
      };
      workRecords.push(row);

      timeSeries.push({
        date: toDateStr(d),
        checkInMinute: a.checkIn ? dateToMinuteOfDay(new Date(a.checkIn)) : null,
        status: a.status,
      });
    }

    // Compute sliding window averages (14-day window, step 1 day)
    const WINDOW_SIZE = 14;
    const windowAverages: { windowEnd: string; avgCheckIn: number }[] = [];

    for (let i = WINDOW_SIZE - 1; i < workRecords.length; i++) {
      const windowSlice = workRecords.slice(i - WINDOW_SIZE + 1, i + 1);
      const metrics = computeWindowMetrics(windowSlice);
      windowAverages.push({
        windowEnd: toDateStr(new Date(workRecords[i].date)),
        avgCheckIn: Math.round(metrics.avgCheckIn),
      });
    }

    // Compute risk score
    const recentCutoff = new Date(today);
    recentCutoff.setDate(recentCutoff.getDate() - 30);

    const baselineRecords = workRecords.filter(
      (r) => new Date(r.date) < recentCutoff,
    );
    const recentRecords = workRecords.filter(
      (r) => new Date(r.date) >= recentCutoff,
    );

    let employee: FlightRiskEmployee | null = null;

    if (baselineRecords.length >= 10 && recentRecords.length >= 5) {
      // Compute full sliding windows for detail view (same algorithm as scanFlightRisk)
      const DETAIL_WINDOW = 14;
      const detailWindowMetrics: { date: Date; metrics: ReturnType<typeof computeWindowMetrics> }[] = [];
      for (let j = DETAIL_WINDOW - 1; j < workRecords.length; j++) {
        const windowSlice = workRecords.slice(j - DETAIL_WINDOW + 1, j + 1);
        detailWindowMetrics.push({
          date: new Date(workRecords[j].date),
          metrics: computeWindowMetrics(windowSlice),
        });
      }

      const detailBaselineWins = detailWindowMetrics.filter((w) => w.date < recentCutoff);
      const detailRecentWins = detailWindowMetrics.filter((w) => w.date >= recentCutoff);

      // Calculate real StdDev from baseline sliding windows (no more hardcoded values)
      const baselineStdDev = {
        checkIn: computeStandardDeviation(detailBaselineWins.map(w => w.metrics.avgCheckIn)).stdDev,
        lateRate: computeStandardDeviation(detailBaselineWins.map(w => w.metrics.lateRate)).stdDev,
        absentRate: computeStandardDeviation(detailBaselineWins.map(w => w.metrics.absentRate)).stdDev,
        ot: computeStandardDeviation(detailBaselineWins.map(w => w.metrics.avgOt)).stdDev,
      };

      // Use sliding window averages for scoring (consistent with stdDev)
      const bwCheckIns = detailBaselineWins.map(w => w.metrics.avgCheckIn);
      const bwLateRates = detailBaselineWins.map(w => w.metrics.lateRate);
      const bwAbsentRates = detailBaselineWins.map(w => w.metrics.absentRate);
      const bwOts = detailBaselineWins.map(w => w.metrics.avgOt);
      const rwCheckIns = detailRecentWins.map(w => w.metrics.avgCheckIn);
      const rwLateRates = detailRecentWins.map(w => w.metrics.lateRate);
      const rwAbsentRates = detailRecentWins.map(w => w.metrics.absentRate);
      const rwOts = detailRecentWins.map(w => w.metrics.avgOt);

      const baselineWinMetrics = {
        avgCheckIn: bwCheckIns.reduce((s, v) => s + v, 0) / bwCheckIns.length,
        lateRate: bwLateRates.reduce((s, v) => s + v, 0) / bwLateRates.length,
        absentRate: bwAbsentRates.reduce((s, v) => s + v, 0) / bwAbsentRates.length,
        avgOt: bwOts.reduce((s, v) => s + v, 0) / bwOts.length,
      };
      const recentWinMetrics = detailRecentWins.length > 0 ? {
        avgCheckIn: rwCheckIns.reduce((s, v) => s + v, 0) / rwCheckIns.length,
        lateRate: rwLateRates.reduce((s, v) => s + v, 0) / rwLateRates.length,
        absentRate: rwAbsentRates.reduce((s, v) => s + v, 0) / rwAbsentRates.length,
        avgOt: rwOts.reduce((s, v) => s + v, 0) / rwOts.length,
      } : computeWindowMetrics(recentRecords);

      // Raw record averages for UI display
      const baselineMetrics = computeWindowMetrics(baselineRecords);
      const recentMetrics = computeWindowMetrics(recentRecords);
      const { score, signals } = computeDeviationScore(baselineWinMetrics, recentWinMetrics, baselineStdDev);

      employee = {
        userId: user.id,
        name: user.name,
        username: user.username,
        department: user.department?.name ?? null,
        position: user.position?.name ?? null,
        image: user.image ?? null,
        riskScore: score,
        riskLevel: getRiskLevel(score),
        signals,
        baseline: {
          avgCheckInMinute: Math.round(baselineMetrics.avgCheckIn),
          lateRate: Math.round(baselineMetrics.lateRate * 10) / 10,
          absentRate: Math.round(baselineMetrics.absentRate * 10) / 10,
          avgOtHours: Math.round(baselineMetrics.avgOt * 10) / 10,
        },
        recent: {
          avgCheckInMinute: Math.round(recentMetrics.avgCheckIn),
          lateRate: Math.round(recentMetrics.lateRate * 10) / 10,
          absentRate: Math.round(recentMetrics.absentRate * 10) / 10,
          avgOtHours: Math.round(recentMetrics.avgOt * 10) / 10,
        },
      };
    }

    return {
      success: true,
      employee,
      timeSeries,
      windowAverages,
    };
  } catch (err) {
    console.error("Flight Risk Detail error:", err);
    return {
      success: false,
      employee: null,
      timeSeries: [],
      windowAverages: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── AI Analysis Action ─────────────────────────────────────────────

export async function analyzeFlightRiskWithAI(employees: FlightRiskEmployee[]) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

    const payload = {
      attendance_data: {
        flight_risk_employees: employees.map((e) => ({
          employee_name: e.name,
          department: e.department,
          position: e.position,
          risk_score: e.riskScore,
          risk_level: e.riskLevel,
          check_in_drift_minutes: e.signals.checkInDriftMinutes,
          check_in_z_score: e.signals.zScore,
          late_rate_change: e.signals.lateRateChange,
          absent_rate_change: e.signals.absentRateChange,
          ot_decline_hours: e.signals.otDecline,
          baseline_avg_checkin: e.baseline.avgCheckInMinute,
          recent_avg_checkin: e.recent.avgCheckInMinute,
        })),
      },
      analysis_type: "flight_risk",
    };

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/analyze/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`AI Service error: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      content: result.content,
      recommendations: result.recommendations || [],
    };
  } catch (err) {
    console.error("Flight Risk AI Analysis error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── AI Stay Interview Action ───────────────────────────────────────

export async function generateStayInterviewScript(employee: FlightRiskEmployee, timeSeries: EmployeeCheckInTimeSeries[]) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

    // Chỉ lấy 30 ngày gần nhất
    const recentTimeSeries = timeSeries.slice(-30);

    const payload = {
      attendance_data: {
        employee_info: {
          name: employee.name,
          department: employee.department,
          position: employee.position,
          risk_level: employee.riskLevel,
          drift_minutes: employee.signals.checkInDriftMinutes,
          z_score: employee.signals.zScore,
        },
        recent_30_days_history: recentTimeSeries,
      },
      analysis_type: "stay_interview",
      employee_id: employee.userId,
    };

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/analyze/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`AI Service error: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      content: result.content,
    };
  } catch (err) {
    console.error("Stay Interview AI error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Hackathon Mock Data ────────────────────────────────────────────

export async function injectMockData104() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({ where: { username: "104" } });
    if (!user) return { success: false, error: "Không tìm thấy user 104" };

    const today = new Date();
    today.setHours(0,0,0,0);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);

    const records = await prisma.attendance.findMany({
      where: {
        userId: user.id,
        date: { gte: twoWeeksAgo }
      }
    });

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const newCheckIn = new Date(r.date);
      newCheckIn.setHours(9, 45, 0, 0); // Trễ gần 2 tiếng
      
      const isAbsent = i % 5 === 0; // Nghỉ vài ngày
      
      await prisma.attendance.update({
        where: { id: r.id },
        data: {
          checkIn: isAbsent ? null : newCheckIn,
          status: isAbsent ? "ABSENT" : "LATE",
          overtimeHours: 0,
        }
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Mock Data error:", err);
    return { success: false };
  }
}

// ─── Department Options ─────────────────────────────────────────────

export async function getDepartmentList() {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  return prisma.department.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, code: true },
    orderBy: { sortOrder: "asc" },
  });
}
