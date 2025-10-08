"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { UserPlus, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

// Sample data - would be fetched from API in real app
const callHistory = [
  {
    id: "call-101",
    user: "山田 太郎",
    phoneNumber: "+81345678901",
    startTime: "2025-04-11T14:30:00",
    duration: "08:45",
    status: "completed",
    tenant: "株式会社ABC",
    isRegistered: true,
  },
  {
    id: "call-102",
    user: "佐藤 花子",
    phoneNumber: "+81312345678",
    startTime: "2025-04-11T15:15:00",
    duration: "12:33",
    status: "completed",
    tenant: "株式会社ABC",
    isRegistered: true,
  },
  {
    id: "call-103",
    user: "鈴木 一郎",
    phoneNumber: "+81387654321",
    startTime: "2025-04-11T16:20:00",
    duration: "05:12",
    status: "abandoned",
    tenant: "株式会社XYZ",
    isRegistered: true,
  },
  {
    id: "call-104",
    user: "田中 美咲",
    phoneNumber: "+81398765432",
    startTime: "2025-04-11T17:45:00",
    duration: "15:28",
    status: "completed",
    tenant: "株式会社ABC",
    isRegistered: true,
  },
  {
    id: "call-105",
    user: "高橋 健太",
    phoneNumber: "+81356789012",
    startTime: "2025-04-12T09:30:00",
    duration: "03:45",
    status: "failed",
    tenant: "株式会社123",
    isRegistered: true,
  },
  {
    id: "call-106",
    user: "伊藤 由美",
    phoneNumber: "+81367890123",
    startTime: "2025-04-12T10:15:00",
    duration: "22:15",
    status: "completed",
    tenant: "株式会社XYZ",
    isRegistered: true,
  },
  {
    id: "call-107",
    user: "渡辺 修",
    phoneNumber: "+81378901234",
    startTime: "2025-04-12T11:00:00",
    duration: "07:33",
    status: "completed",
    tenant: "株式会社ABC",
    isRegistered: true,
  },
  {
    id: "call-108",
    user: "中村 恵子",
    phoneNumber: "+81389012345",
    startTime: "2025-04-12T13:20:00",
    duration: "00:00",
    status: "abandoned",
    tenant: "株式会社123",
    isRegistered: true,
  },
  {
    id: "call-109",
    user: "小林 大輔",
    phoneNumber: "+81390123456",
    startTime: "2025-04-12T14:45:00",
    duration: "18:42",
    status: "completed",
    tenant: "株式会社XYZ",
    isRegistered: true,
  },
  {
    id: "call-110",
    user: "加藤 真理子",
    phoneNumber: "+81301234567",
    startTime: "2025-04-12T16:10:00",
    duration: "09:18",
    status: "completed",
    tenant: "株式会社ABC",
    isRegistered: true,
  },
  {
    id: "call-111",
    user: "松本 隆",
    phoneNumber: "+81312345679",
    startTime: "2025-04-13T08:30:00",
    duration: "00:00",
    status: "failed",
    tenant: "株式会社123",
    isRegistered: true,
  },
  {
    id: "call-112",
    user: "森田 あゆみ",
    phoneNumber: "+81323456780",
    startTime: "2025-04-13T09:45:00",
    duration: "13:27",
    status: "completed",
    tenant: "株式会社XYZ",
    isRegistered: true,
  },
  {
    id: "call-113",
    user: "清水 正樹",
    phoneNumber: "+81334567891",
    startTime: "2025-04-13T11:15:00",
    duration: "06:52",
    status: "completed",
    tenant: "株式会社ABC",
    isRegistered: true,
  },
  {
    id: "call-114",
    user: "橋本 千春",
    phoneNumber: "+81345678902",
    startTime: "2025-04-13T14:30:00",
    duration: "04:15",
    status: "abandoned",
    tenant: "株式会社123",
    isRegistered: true,
  },
  {
    id: "call-115",
    user: "藤田 雅彦",
    phoneNumber: "+81356789013",
    startTime: "2025-04-13T15:50:00",
    duration: "11:38",
    status: "completed",
    tenant: "株式会社XYZ",
    isRegistered: true,
  },
  // 未登録の顧客の例
  {
    id: "call-116",
    user: "未登録ユーザー",
    phoneNumber: "+81380123456",
    startTime: "2025-04-13T16:30:00",
    duration: "05:22",
    status: "completed",
    tenant: "株式会社ABC",
    isRegistered: false,
  },
  {
    id: "call-117",
    user: "未登録ユーザー",
    phoneNumber: "+81390987654",
    startTime: "2025-04-13T17:15:00",
    duration: "02:45",
    status: "completed",
    tenant: "株式会社XYZ",
    isRegistered: false,
  }
];

export default function CallHistory() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [dateTimeRange, setDateTimeRange] = useState<{
    start: { date: string; time: string };
    end: { date: string; time: string };
  }>({
    start: {
      date: "",
      time: ""
    },
    end: {
      date: "",
      time: ""
    }
  });
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCallTarget, setSelectedCallTarget] = useState<{
    phoneNumber: string;
    customerName: string;
  } | null>(null);
  
  // Filter the call history based on search and filters
  const filteredCalls = callHistory.filter((call) => {
    const matchesSearch =
      searchTerm === "" ||
      call.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.phoneNumber.includes(searchTerm);
      
    const matchesStatus =
      statusFilter === "all" || call.status === statusFilter;
      
    const matchesTenant =
      tenantFilter === "all" || call.tenant === tenantFilter;
      
    // Filter by date and time range
    let matchesDateTimeRange = true;
    
    if (dateTimeRange.start.date && dateTimeRange.end.date) {
      const callDateTime = new Date(call.startTime);
      const startDateTime = new Date(`${dateTimeRange.start.date}T${dateTimeRange.start.time || "00:00"}`);
      const endDateTime = new Date(`${dateTimeRange.end.date}T${dateTimeRange.end.time || "23:59"}`);
      
      matchesDateTimeRange = callDateTime >= startDateTime && callDateTime <= endDateTime;
    }
        
    return matchesSearch && matchesStatus && matchesTenant && matchesDateTimeRange;
  });

  const handleRegisterCustomer = (call: typeof callHistory[0]) => {
    // URLパラメータとして電話番号と推定される情報を渡す
    const params = new URLSearchParams({
      phoneNumber: call.phoneNumber,
      tenant: call.tenant,
      // 通話時間から推定される名前があれば渡す（実際のアプリでは音声認識結果など）
      suggestedName: call.user !== "未登録ユーザー" ? call.user : "",
    });
    
    router.push(`/users?register=true&${params.toString()}`);
  };

  const handleCallClick = (phoneNumber: string, customerName: string) => {
    setSelectedCallTarget({ phoneNumber, customerName });
    setIsCallModalOpen(true);
  };

  const handleConfirmCall = () => {
    if (!selectedCallTarget) return;

    setIsCallModalOpen(false);
    
    // 発信開始のトースト
    toast.loading("通話を発信中...", {
      id: "call-initiation",
      duration: Infinity,
    });
    
    // Simulate call initiation process
    setTimeout(() => {
      // 発信成功のトースト
      toast.success("通話を開始しました", {
        id: "call-initiation",
        description: `${selectedCallTarget.customerName} (${selectedCallTarget.phoneNumber})`,
        duration: 3000,
      });
      
      // 通話中の継続トースト
      setTimeout(() => {
        toast.info("📞 通話中", {
          id: "call-active",
          description: `${selectedCallTarget.customerName} (${selectedCallTarget.phoneNumber})`,
          duration: Infinity,
          action: {
            label: "終了",
            onClick: () => {
              toast.dismiss("call-active");
              toast.success("通話を終了しました", {
                description: `${selectedCallTarget.customerName} との通話を終了`,
                duration: 2000,
              });
            },
          },
        });
      }, 3500);
    }, 2000);
    
    setSelectedCallTarget(null);
  };

  return (
    <div className="p-6 space-y-6 h-screen flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">通話履歴</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="名前または電話番号で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="通話状態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての状態</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="abandoned">放棄</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={tenantFilter}
              onValueChange={setTenantFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="テナント" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのテナント</SelectItem>
                <SelectItem value="株式会社ABC">株式会社ABC</SelectItem>
                <SelectItem value="株式会社XYZ">株式会社XYZ</SelectItem>
                <SelectItem value="株式会社123">株式会社123</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2 col-span-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>開始日時</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateTimeRange.start.date}
                      onChange={(e) => setDateTimeRange(prev => ({
                        ...prev,
                        start: { ...prev.start, date: e.target.value }
                      }))}
                    />
                    <Input
                      type="time"
                      value={dateTimeRange.start.time}
                      onChange={(e) => setDateTimeRange(prev => ({
                        ...prev,
                        start: { ...prev.start, time: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>終了日時</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateTimeRange.end.date}
                      onChange={(e) => setDateTimeRange(prev => ({
                        ...prev,
                        end: { ...prev.end, date: e.target.value }
                      }))}
                    />
                    <Input
                      type="time"
                      value={dateTimeRange.end.time}
                      onChange={(e) => setDateTimeRange(prev => ({
                        ...prev,
                        end: { ...prev.end, time: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>通話履歴</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>ユーザー</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>日時</TableHead>
                  <TableHead>通話時間</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>テナント</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.length > 0 ? (
                  filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.user}</TableCell>
                      <TableCell>{call.phoneNumber}</TableCell>
                      <TableCell>
                        {new Date(call.startTime).toLocaleString()}
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
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="ml-2"
                          onClick={() => handleCallClick(call.phoneNumber, call.user)}
                          title="通話発信"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        {!call.isRegistered && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="ml-2"
                            onClick={() => handleRegisterCustomer(call)}
                            title="顧客登録"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <Search className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">検索条件に一致する通話がありません</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {filteredCalls.length}件 / 全{callHistory.length}件
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                disabled={true}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={true}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通話発信確認モーダル */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>通話発信</DialogTitle>
            <DialogDescription>
              以下の顧客に通話を発信しますか？
            </DialogDescription>
          </DialogHeader>
          
          {selectedCallTarget && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">顧客名:</span>
                    <span className="font-medium">{selectedCallTarget.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">電話番号:</span>
                    <span className="font-medium">{selectedCallTarget.phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleConfirmCall}>
              <Phone className="h-4 w-4 mr-1" />
              発信する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}