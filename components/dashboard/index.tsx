"use client";

import { useEffect, useState } from "react";
import { CallStats } from "./call-stats";
import SystemStatus from "./system-status";
import RecentCalls from "./recent-calls";
import { RecentFaxes } from "./recent-faxes";
import { api } from "@/lib/api-client";

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, activeRes, callsRes] = await Promise.all([
        api.calls.statistics().catch(() => ({ statistics: {} })),
        api.calls.active().catch(() => ({ calls: [] })),
        api.calls.list({ limit: 10 }).catch(() => ({ calls: [] })),
      ]);

      setStats(statsRes.statistics);
      setActiveCalls(activeRes.calls);
      setRecentCalls(callsRes.calls);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">
            システム全体の概要とリアルタイムメトリクス
          </p>
        </div>
      </div>

      <SystemStatus 
        activeCalls={activeCalls.length}
        totalCalls={stats?.total_calls || 0}
      />
      <CallStats period="weekly" />
      <div className="grid gap-6 md:grid-cols-2">
        <RecentCalls calls={recentCalls} />
        <RecentFaxes />
      </div>
    </div>
  );
}
