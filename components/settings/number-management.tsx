"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash, Search, Phone } from "lucide-react";
import TenantManagement from "./tenant-management";

interface Department {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface NumberEntry {
  id: string;
  phoneNumber: string;
  tenant: string;
  type: "inbound" | "outbound";
  description?: string;
  createdAt: string;
}

const initialNumbers: NumberEntry[] = [
  {
    id: "1",
    phoneNumber: "03-1234-5678",
    tenant: "株式会社ABC",
    type: "inbound",
    description: "メイン受付番号",
    createdAt: "2025-04-30T10:00:00"
  },
  {
    id: "2",
    phoneNumber: "090-1234-5678",
    tenant: "株式会社ABC",
    type: "outbound",
    description: "営業部発信用",
    createdAt: "2025-04-30T10:05:00"
  },
  {
    id: "3",
    phoneNumber: "03-8765-4321",
    tenant: "株式会社XYZ",
    type: "inbound",
    description: "カスタマーサポート",
    createdAt: "2025-04-30T10:10:00"
  }
];

interface TenantEntry {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function NumberManagement() {
  const [numbers, setNumbers] = useState<NumberEntry[]>(initialNumbers);
  const [availableTenants, setAvailableTenants] = useState<TenantEntry[]>([
    { id: "1", name: "株式会社ABC", status: "active", createdAt: "2025-04-30T10:00:00" },
    { id: "2", name: "株式会社XYZ", status: "active", createdAt: "2025-04-30T10:05:00" },
    { id: "3", name: "株式会社123", status: "active", createdAt: "2025-04-30T10:10:00" }
  ]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<NumberEntry | null>(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    tenant: "",
    type: "inbound" as "inbound" | "outbound",
    description: ""
  });

  const filteredNumbers = numbers.filter(number => {
    const matchesSearch = 
      searchTerm === "" ||
      number.phoneNumber.includes(searchTerm) ||
      number.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (number.description && number.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTenant = tenantFilter === "all" || number.tenant === tenantFilter;
    const matchesType = typeFilter === "all" || number.type === typeFilter;

    return matchesSearch && matchesTenant && matchesType;
  });

  // Get tenant options for select
  const tenantOptions = availableTenants.filter(t => t.status === "active").map(t => t.name);

  const handleAddNumber = () => {
    if (!formData.phoneNumber.trim() || !formData.tenant) {
      toast.error("電話番号とテナントを入力してください");
      return;
    }

    // Check for duplicate phone numbers
    if (numbers.some(n => n.phoneNumber === formData.phoneNumber.trim())) {
      toast.error("この電話番号は既に登録されています");
      return;
    }

    const newNumber: NumberEntry = {
      id: Date.now().toString(),
      phoneNumber: formData.phoneNumber.trim(),
      tenant: formData.tenant,
      type: formData.type,
      description: formData.description.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setNumbers([...numbers, newNumber]);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("番号を追加しました");
  };

  const handleEditNumber = (number: NumberEntry) => {
    setEditingNumber(number);
    setFormData({
      phoneNumber: number.phoneNumber,
      tenant: number.tenant,
      type: number.type,
      description: number.description || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateNumber = () => {
    if (!editingNumber) return;

    if (!formData.phoneNumber.trim() || !formData.tenant) {
      toast.error("電話番号とテナントを入力してください");
      return;
    }

    // Check for duplicate phone numbers (excluding current)
    if (numbers.some(n => n.id !== editingNumber.id && n.phoneNumber === formData.phoneNumber.trim())) {
      toast.error("この電話番号は既に登録されています");
      return;
    }

    const updatedNumbers = numbers.map(number =>
      number.id === editingNumber.id
        ? {
            ...number,
            phoneNumber: formData.phoneNumber.trim(),
            tenant: formData.tenant,
            type: formData.type,
            description: formData.description.trim() || undefined
          }
        : number
    );

    setNumbers(updatedNumbers);
    setIsEditDialogOpen(false);
    setEditingNumber(null);
    resetForm();
    toast.success("番号を更新しました");
  };

  const handleDeleteNumber = (id: string) => {
    setNumbers(numbers.filter(number => number.id !== id));
    toast.success("番号を削除しました");
  };

  const resetForm = () => {
    setFormData({
      phoneNumber: "",
      tenant: "",
      type: "inbound",
      description: ""
    });
  };

  const NumberForm = () => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">電話番号 *</Label>
        <Input
          id="phoneNumber"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="03-1234-5678 または 090-1234-5678"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenant">テナント *</Label>
        <Select
          value={formData.tenant}
          onValueChange={(value) => setFormData({ ...formData, tenant: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="テナントを選択" />
          </SelectTrigger>
          <SelectContent>
            {tenantOptions.map(tenant => (
              <SelectItem key={tenant} value={tenant}>
                {tenant}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">種別</Label>
        <Select
          value={formData.type}
          onValueChange={(value: "inbound" | "outbound") => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inbound">着信用</SelectItem>
            <SelectItem value="outbound">発信用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="番号の用途や説明（任意）"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <TenantManagement 
        onTenantsUpdate={setAvailableTenants} 
        onDepartmentsUpdate={setAvailableDepartments}
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            番号管理
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <Plus className="h-4 w-4" />
                番号追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規番号登録</DialogTitle>
                <DialogDescription>
                  電話番号とテナントの関連付けを登録します
                </DialogDescription>
              </DialogHeader>
              <NumberForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddNumber}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* フィルター */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="番号、テナント、説明で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select
                value={tenantFilter}
                onValueChange={setTenantFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="テナントでフィルター" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのテナント</SelectItem>
                  {availableTenants.filter(t => t.status === "active").map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.name}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="種別でフィルター" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての種別</SelectItem>
                  <SelectItem value="inbound">着信用</SelectItem>
                  <SelectItem value="outbound">発信用</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                {filteredNumbers.length}件 / 全{numbers.length}件
              </div>
            </div>

            {/* テーブル */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>電話番号</TableHead>
                  <TableHead>テナント</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNumbers.length > 0 ? (
                  filteredNumbers.map((number) => (
                    <TableRow key={number.id}>
                      <TableCell className="font-medium">{number.phoneNumber}</TableCell>
                      <TableCell>{number.tenant}</TableCell>
                      <TableCell>
                        <Badge variant={number.type === "inbound" ? "default" : "secondary"}>
                          {number.type === "inbound" ? "着信用" : "発信用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {number.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditNumber(number)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>番号の削除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{number.phoneNumber}」を削除してもよろしいですか？この操作は取り消せません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteNumber(number.id)}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <Search className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {searchTerm || tenantFilter !== "all" || typeFilter !== "all"
                            ? "検索条件に一致する番号がありません"
                            : "登録された番号がありません"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>番号の編集</DialogTitle>
            <DialogDescription>
              番号とテナントの関連付けを編集します
            </DialogDescription>
          </DialogHeader>
          <NumberForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateNumber}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}