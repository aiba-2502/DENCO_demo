"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RecentCallsProps {
  calls: any[];
}

export default function RecentCalls({ calls }: RecentCallsProps) {
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--:--';
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return '--:--';
    try {
      const duration = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      'completed': { variant: 'default', label: '完了' },
      'in_progress': { variant: 'secondary', label: '通話中' },
      'ringing': { variant: 'outline', label: '着信中' },
      'failed': { variant: 'destructive', label: '失敗' },
    };

    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">最近の通話</CardTitle>
        <Link href="/calls/history">
          <Button variant="ghost" size="sm">
            すべて表示
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {calls && calls.length > 0 ? (
            calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{call.from_number}</div>
                    <div className="text-sm text-muted-foreground">
                      → {call.to_number}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(call.status)}
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(call.start_time)} ({formatDuration(call.start_time, call.end_time)})
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              通話履歴がありません
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
