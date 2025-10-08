"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Eye } from "lucide-react";
import Link from "next/link";

// Sample data - would be fetched from API in real app
const recentCalls = [
  {
    id: "call-1",
    user: "山田 太郎",
    phoneNumber: "090-1234-5678",
    startTime: "2025-04-12T09:45:00",
    duration: "05:23",
    status: "completed",
    tenant: "株式会社ABC",
  },
  {
    id: "call-2",
    user: "佐藤 花子",
    phoneNumber: "090-8765-4321",
    startTime: "2025-04-12T10:15:00",
    duration: "03:12",
    status: "completed",
    tenant: "株式会社ABC",
  },
  {
    id: "call-3",
    user: "鈴木 一郎",
    phoneNumber: "090-2345-6789",
    startTime: "2025-04-12T11:30:00",
    duration: "07:45",
    status: "completed",
    tenant: "株式会社XYZ",
  },
];

export function RecentCalls() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ユーザー</TableHead>
          <TableHead>電話番号</TableHead>
          <TableHead>開始時刻</TableHead>
          <TableHead>通話時間</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>テナント</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentCalls.map((call) => (
          <TableRow key={call.id}>
            <TableCell className="font-medium">{call.user}</TableCell>
            <TableCell>{call.phoneNumber}</TableCell>
            <TableCell>
              {new Date(call.startTime).toLocaleTimeString('ja-JP')}
            </TableCell>
            <TableCell>{call.duration}</TableCell>
            <TableCell>
              <Badge
                variant={
                  call.status === "completed"
                    ? "default"
                    : call.status === "abandoned"
                    ? "secondary"
                    : "destructive"
                }
              >
                {call.status === "completed" ? "完了" :
                 call.status === "abandoned" ? "放棄" : "失敗"}
              </Badge>
            </TableCell>
            <TableCell>{call.tenant}</TableCell>
            <TableCell className="text-right">
              <Link href={`/calls/history/${call.id}`}>
                <Button variant="outline" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}