/* ═══════════════════════════════════════════════════════════════
   Wave AI — Audit Log
   Immutable append-only log of all significant system events
   for compliance, debugging, and transparency.
═══════════════════════════════════════════════════════════════ */

export type AuditAction =
  | "message.sent" | "message.received" | "message.blocked"
  | "safety.violation" | "safety.flagged" | "pii.detected"
  | "tool.called" | "tool.succeeded" | "tool.failed"
  | "rag.retrieved" | "memory.stored" | "memory.retrieved"
  | "feedback.submitted" | "model.switched"
  | "session.started" | "session.ended"
  | "error.critical" | "error.warning"
  | "admin.action";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  details: Record<string, unknown>;
  severity: "info" | "warn" | "error" | "critical";
  fingerprint: string;
}

const AUDIT_KEY = "wave_audit_v1";
const MAX_ENTRIES = 2000;

let auditLog: AuditEntry[] = [];

function loadAudit(): void {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (raw) auditLog = JSON.parse(raw);
  } catch { auditLog = []; }
}

function saveAudit(): void {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog.slice(-MAX_ENTRIES)));
  } catch { /* storage full */ }
}

loadAudit();

/* ── Fingerprint (simple hash) ───────────────────────────────── */
function fingerprint(action: string, details: Record<string, unknown>, timestamp: number): string {
  const str = `${action}${JSON.stringify(details)}${timestamp}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/* ── Log an action ───────────────────────────────────────────── */
export function logAction(
  action: AuditAction,
  details: Record<string, unknown> = {},
  options: { sessionId?: string; userId?: string; severity?: AuditEntry["severity"] } = {}
): AuditEntry {
  const timestamp = Date.now();
  const entry: AuditEntry = {
    id: `audit_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
    action,
    timestamp,
    sessionId: options.sessionId,
    userId: options.userId,
    details,
    severity: options.severity ?? "info",
    fingerprint: fingerprint(action, details, timestamp),
  };

  auditLog.push(entry);
  if (auditLog.length > MAX_ENTRIES) auditLog.shift();
  saveAudit();

  return entry;
}

/* ── Query audit log ─────────────────────────────────────────── */
export function queryAuditLog(filters: {
  action?: AuditAction;
  sessionId?: string;
  userId?: string;
  severity?: AuditEntry["severity"];
  since?: number;
  until?: number;
  limit?: number;
} = {}): AuditEntry[] {
  let results = auditLog;

  if (filters.action) results = results.filter(e => e.action === filters.action);
  if (filters.sessionId) results = results.filter(e => e.sessionId === filters.sessionId);
  if (filters.userId) results = results.filter(e => e.userId === filters.userId);
  if (filters.severity) results = results.filter(e => e.severity === filters.severity);
  if (filters.since) results = results.filter(e => e.timestamp >= filters.since!);
  if (filters.until) results = results.filter(e => e.timestamp <= filters.until!);

  return results.slice(-(filters.limit ?? 100));
}

/* ── Audit stats ─────────────────────────────────────────────── */
export function getAuditStats() {
  const now = Date.now();
  const last24h = auditLog.filter(e => e.timestamp > now - 86400000);
  const actionCounts: Record<string, number> = {};
  for (const e of last24h) actionCounts[e.action] = (actionCounts[e.action] ?? 0) + 1;

  return {
    totalEntries: auditLog.length,
    last24hEntries: last24h.length,
    criticalEvents: last24h.filter(e => e.severity === "critical").length,
    safetyViolations: last24h.filter(e => e.action === "safety.violation").length,
    blockedMessages: last24h.filter(e => e.action === "message.blocked").length,
    topActions: Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}

export function clearAuditLog(): void {
  auditLog = [];
  localStorage.removeItem(AUDIT_KEY);
}
