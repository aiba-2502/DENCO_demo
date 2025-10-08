"use client";

import { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Phone, Clock, User } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";

export default function CallHistory() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const response = await api.calls.list({ limit: 50 });
      setCalls(response.calls);
    } catch (error) {
      console.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ja-JP');
    } catch {
      return '-';
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return '-';
    try {
      const duration = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'completed': 'default',
      'in_progress': 'secondary',
      'ringing': 'outline',
      'failed': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const filteredCalls = calls.filter(call =>
    call.from_number?.includes(searchTerm) ||
    call.to_number?.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">通話履歴</h1>
          <p className="text-muted-foreground">過去の通話記録と詳細</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通話履歴検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="電話番号で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>通話一覧 ({filteredCalls.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              通話履歴がありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>発信元</TableHead>
                  <TableHead>着信先</TableHead>
                  <TableHead>開始時刻</TableHead>
                  <TableHead>通話時間</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">{call.from_number}</TableCell>
                    <TableCell>{call.to_number}</TableCell>
                    <TableCell className="text-sm">{formatTime(call.start_time)}</TableCell>
                    <TableCell>{formatDuration(call.start_time, call.end_time)}</TableCell>
                    <TableCell>{getStatusBadge(call.status)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/calls/history/${call.id}`}>
                        <Button variant="outline" size="sm">
                          詳細
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

