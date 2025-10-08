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
import { Eye } from "lucide-react";

// Sample data - would be fetched from API in real app
const recentFaxes = [
  {
    id: "fax-1",
    direction: "inbound",
    sender: "03-1234-5678",
    receiver: "03-8765-4321",
    startTime: "2025-04-12T09:45:00",
    status: "completed",
    tenant: "株式会社ABC",
  },
  {
    id: "fax-2",
    direction: "outbound",
    sender: "03-8765-4321",
    receiver: "03-1234-5678",
    startTime: "2025-04-12T10:15:00",
    status: "pending",
    tenant: "株式会社ABC",
  },
  {
    id: "fax-3",
    direction: "inbound",
    sender: "03-2345-6789",
    receiver: "03-8765-4321",
    startTime: "2025-04-12T11:30:00",
    status: "completed",
    tenant: "株式会社XYZ",
  },
];

export function RecentFaxes() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>種別</TableHead>
          <TableHead>送信元</TableHead>
          <TableHead>送信先</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>受信日時</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentFaxes.map((fax) => (
          <TableRow key={fax.id}>
            <TableCell>
              <Badge variant="outline">
                {fax.direction === "inbound" ? "受信" : "送信"}
              </Badge>
            </TableCell>
            <TableCell>{fax.sender}</TableCell>
            <TableCell>{fax.receiver}</TableCell>
            <TableCell>
              <Badge
                variant={
                  fax.status === "completed"
                    ? "default"
                    : fax.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
              >
                {fax.status === "completed" ? "完了" :
                 fax.status === "pending" ? "処理中" : "失敗"}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(fax.startTime).toLocaleTimeString('ja-JP')}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}