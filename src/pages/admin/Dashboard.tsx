/* ═══════════════════════════════════════════════════════════════
   Wave AI — Admin Dashboard
   Real-time metrics, system health, usage analytics, and
   pipeline monitoring. Accessible at /admin.
═══════════════════════════════════════════════════════════════ */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Activity, Brain, Shield, Database,
  Zap, MessageSquare, TrendingUp, Clock, AlertCircle,
  RefreshCw, Server, Layers, BarChart3, CheckCircle, XCircle,
} from "lucide-react";
import { useMetrics } from "@/hooks/metrics/useMetrics";
import { cn } from "@/lib/utils";

function StatCard({ label, value, sub, color = "blue", icon }: {
  label: string; value: string | number; sub?: string;
  color?: "blue" | "green" | "purple" | "amber" | "red"; icon: React.ReactNode;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-violet-50 text-violet-600 border-violet-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div className={cn("rounded-2xl border p-4 flex items-start gap-3", colors[color])}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-70 mb-0.5">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProviderBadge({ provider, count, active }: { provider: string; count: number; active: boolean }) {
  return (
    <div className={cn("flex items-center justify-between px-3 py-2 rounded-xl border text-xs", active ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200")}>
      <div className="flex items-center gap-2">
        <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-300")} />
        <span className={cn("font-medium", active ? "text-emerald-700" : "text-slate-500")}>{provider}</span>
      </div>
      <span className={cn("font-semibold", active ? "text-emerald-600" : "text-slate-400")}>{count}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { metrics, isLoading, refresh } = useMetrics(3000);
  const [activeSection, setActiveSection] = useState<"overview" | "pipeline" | "safety" | "models">("overview");

  if (isLoading || !metrics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading metrics…</p>
        </div>
      </div>
    );
  }

  const { summary, feedback, moderation, router, hub, errorRate, avgLatency, cacheHitRate, intentBreakdown, recentRequests } = metrics;

  const sections = [
    { id: "overview" as const, label: "Overview", icon: <BarChart3 size={14} /> },
    { id: "pipeline" as const, label: "Pipeline", icon: <Layers size={14} /> },
    { id: "safety" as const, label: "Safety", icon: <Shield size={14} /> },
    { id: "models" as const, label: "Models", icon: <Brain size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/app")} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Wave AI Dashboard</h1>
              <p className="text-xs text-slate-400">Real-time system metrics & observability</p>
            </div>
          </div>
          <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeSection === s.id ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}>
              {s.icon}{s.label}
            </button>
          ))}
        </div>

        {activeSection === "overview" && (
          <div className="space-y-5">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Requests" value={summary.allTime.requests} sub="All time" color="blue" icon={<MessageSquare size={16} />} />
              <StatCard label="Avg Latency" value={`${avgLatency}ms`} sub="Last hour" color="green" icon={<Clock size={16} />} />
              <StatCard label="Error Rate" value={`${(errorRate * 100).toFixed(1)}%`} sub="Last hour" color={errorRate > 0.1 ? "red" : "green"} icon={<AlertCircle size={16} />} />
              <StatCard label="Cache Hit Rate" value={`${(cacheHitRate * 100).toFixed(1)}%`} sub="Last hour" color="purple" icon={<Zap size={16} />} />
            </div>

            {/* Intent breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Intent Distribution</h3>
              <div className="space-y-2">
                {Object.entries(intentBreakdown).length === 0 ? (
                  <p className="text-xs text-slate-400">No requests yet</p>
                ) : (
                  Object.entries(intentBreakdown).map(([intent, count]) => {
                    const total = Object.values(intentBreakdown).reduce((a, b) => a + b, 0);
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={intent} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700 capitalize">{intent}</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full wave-gradient rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent requests */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Requests</h3>
              {recentRequests.length === 0 ? (
                <p className="text-xs text-slate-400">No requests yet</p>
              ) : (
                <div className="space-y-2">
                  {recentRequests.slice(0, 8).map(req => (
                    <div key={req.requestId} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl text-xs">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", req.error ? "bg-red-400" : "bg-emerald-400")} />
                      <span className="font-medium text-slate-600 capitalize flex-shrink-0 w-12">{req.intent}</span>
                      <span className="text-slate-400 flex-shrink-0">{req.latencyMs}ms</span>
                      <span className="text-slate-400 flex-shrink-0">{req.provider}</span>
                      <span className="text-slate-300 flex-1 text-right">{new Date(req.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">User Feedback</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total</span>
                    <span className="font-semibold text-slate-700">{feedback.total}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Positive Rate</span>
                    <span className={cn("font-semibold", feedback.positiveRate > 0.7 ? "text-emerald-600" : "text-amber-600")}>
                      {(feedback.positiveRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Avg Rating</span>
                    <span className="font-semibold text-slate-700">{feedback.avgRating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">Trend</span>
                    <span className={cn("font-semibold",
                      feedback.recentTrend === "improving" ? "text-emerald-600" :
                      feedback.recentTrend === "declining" ? "text-red-500" : "text-slate-500"
                    )}>{feedback.recentTrend}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Session Stats</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Active Sessions</span>
                    <span className="font-semibold text-slate-700">{summary.sessions.active}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Avg Requests/Session</span>
                    <span className="font-semibold text-slate-700">{summary.sessions.avgRequestsPerSession}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Cached Responses</span>
                    <span className="font-semibold text-slate-700">{summary.allTime.cached}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">All-time Errors</span>
                    <span className="font-semibold text-red-500">{summary.allTime.errors}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "pipeline" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Router Status</h3>
              <div className="space-y-2">
                {router.map(r => (
                  <div key={r.provider} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl text-xs">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
                      r.circuit === "closed" ? "bg-emerald-400" : r.circuit === "half-open" ? "bg-amber-400" : "bg-red-400"
                    )} />
                    <span className="font-semibold text-slate-700 flex-1 capitalize">{r.provider}</span>
                    <span className="text-slate-400">{r.avgLatencyMs}ms avg</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      r.circuit === "closed" ? "bg-emerald-100 text-emerald-600" :
                      r.circuit === "half-open" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                    )}>{r.circuit}</span>
                    {r.failures > 0 && <span className="text-red-400">{r.failures} failures</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Pipeline Stages</h3>
              <div className="space-y-2">
                {["intent_detection", "input_guardrails", "memory_retrieval", "rag_retrieval", "context_building", "generation", "output_guardrails", "memory_storage"].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg text-xs">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-[10px] flex-shrink-0">{i + 1}</span>
                    <span className="font-medium text-slate-600 capitalize">{stage.replace(/_/g, " ")}</span>
                    <CheckCircle size={11} className="text-emerald-400 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "safety" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Blocked" value={moderation.blocked} sub="Last hour" color="red" icon={<XCircle size={16} />} />
              <StatCard label="Block Rate" value={`${(moderation.blockRate * 100).toFixed(1)}%`} sub="Last hour" color={moderation.blockRate > 0.05 ? "amber" : "green"} icon={<Shield size={16} />} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Moderation Stats</h3>
              <div className="space-y-2">
                {[
                  { label: "Total Checked", value: moderation.total },
                  { label: "Allowed", value: moderation.allowed },
                  { label: "Flagged", value: moderation.flagged },
                  { label: "Blocked", value: moderation.blocked },
                  { label: "Avg Toxicity", value: moderation.avgToxicity.toFixed(3) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "models" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Model Hub</h3>
              <p className="text-xs text-slate-400 mb-3">{hub.totalModels} models registered</p>
              <div className="space-y-2">
                {[
                  { label: "By Provider", data: hub.byProvider },
                ].map(({ label, data }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-slate-600 mb-1.5">{label}</p>
                    {Object.entries(data).map(([k, v]) => (
                      <ProviderBadge key={k} provider={k} count={v as number} active={k === "huggingface"} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-600 mb-1.5">Default Models</p>
                <div className="flex flex-wrap gap-1.5">
                  {hub.defaultModels.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">{m}</span>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-600 mb-1.5">Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {hub.capabilities.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full capitalize">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
