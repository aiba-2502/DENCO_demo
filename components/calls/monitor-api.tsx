"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Phone, PhoneOff } from "lucide-react";
import { toast } from 'sonner';
import { api } from "@/lib/api-client";

export const dynamic = 'force-dynamic';

export default function CallMonitorAPI() {
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActiveCalls();
    const interval = setInterval(loadActiveCalls, 3000); // 3秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  const loadActiveCalls = async () => {
    try {
      const response = await api.calls.active();
      setActiveCalls(response.calls);
    } catch (error) {
      console.error('Failed to load active calls:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadActiveCalls();
    setLoading(false);
  };

  const handleDisconnectCall = async (callId: string) => {
    try {
      await api.calls.nodeApi.disconnect(callId);
      toast.success('通話を切断しました');
      loadActiveCalls();
    } catch (error: any) {
      toast.error('通話の切断に失敗しました', { description: error.message });
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('ja-JP');
    } catch {
      return '-';
    }
  };

  const getDuration = (startTime: string) => {
    try {
      const start = new Date(startTime);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return '00:00';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">通話モニター</h1>
          <p className="text-muted-foreground">リアルタイム通話監視</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          更新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>アクティブな通話 ({activeCalls.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCalls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              現在、アクティブな通話はありません
            </div>
          ) : (
            <div className="space-y-4">
              {activeCalls.map((call) => (
                <div
                  key={call.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-green-100">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {call.from_number} → {call.to_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          開始: {formatTime(call.start_time)} · 
                          通話時間: {getDuration(call.start_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        call.status === 'answered' ? 'default' :
                        call.status === 'ringing' ? 'secondary' : 'outline'
                      }>
                        {call.status}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnectCall(call.id)}
                      >
                        <PhoneOff className="mr-2 h-4 w-4" />
                        切断
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

