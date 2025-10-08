"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Phone } from "lucide-react";
import { api } from "@/lib/api-client";

interface SystemStatusProps {
  activeCalls: number;
  totalCalls: number;
}

export default function SystemStatus({ activeCalls, totalCalls }: SystemStatusProps) {
  const [pythonHealth, setPythonHealth] = useState<any>(null);
  const [nodeHealth, setNodeHealth] = useState<any>(null);
  const [asteriskConnected, setAsteriskConnected] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000); // 10秒ごと
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const [python, node] = await Promise.all([
        api.health.python().catch(() => null),
        api.health.node().catch(() => null),
      ]);

      setPythonHealth(python);
      setNodeHealth(node);
      setAsteriskConnected(node?.asterisk?.connected || false);
    } catch (error) {
      console.error('Health check error:', error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Python Backend</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={pythonHealth?.status === 'ok' ? "default" : "destructive"}>
            {pythonHealth?.status === 'ok' ? '稼働中' : 'オフライン'}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            DB: {pythonHealth?.database || 'unknown'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Node.js Backend</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={nodeHealth?.status === 'ok' ? "default" : "destructive"}>
            {nodeHealth?.status === 'ok' ? '稼働中' : 'オフライン'}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Active Calls: {nodeHealth?.activeCalls || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asterisk PBX</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={asteriskConnected ? "default" : "destructive"}>
            {asteriskConnected ? 'ARI接続中' : 'ARI未接続'}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {asteriskConnected ? 'リアルタイム制御可能' : '接続待機中'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">アクティブ通話</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCalls}</div>
          <p className="text-xs text-muted-foreground">
            総通話数: {totalCalls}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
