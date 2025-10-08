"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash, Search, Building } from "lucide-react";

interface Department {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface TenantEntry {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
}

const initialTenants: TenantEntry[] = [
  {
    id: "1",
    name: "株式会社ABC",
    description: "メインテナント",
    status: "active",
    createdAt: "2025-04-30T10:00:00"
  },
  {
    id: "2",
    name: "株式会社XYZ",
    description: "サブテナント",
    status: "active",
    createdAt: "2025-04-30T10:05:00"
  },
  {
    id: "3",
    name: "株式会社123",
    description: "テストテナント",
    status: "inactive",
    createdAt: "2025-04-30T10:10:00"
  }
];

const initialDepartments: Department[] = [
  {
    id: "dept-1",
    name: "営業部",
    description: "営業活動全般",
    tenantId: "1",
    status: "active",
    createdAt: "2025-04-30T10:00:00"
  },
  {
    id: "dept-2",
    name: "カスタマーサポート",
    description: "顧客サポート業務",
    tenantId: "1",
    status: "active",
    createdAt: "2025-04-30T10:05:00"
  },
  {
    id: "dept-3",
    name: "技術部",
    description: "システム開発・保守",
    tenantId: "2",
    status: "active",
    createdAt: "2025-04-30T10:10:00"
  },
  {
    id: "dept-4",
    name: "管理部",
    description: "総務・経理業務",
    tenantId: "2",
    status: "inactive",
    createdAt: "2025-04-30T10:15:00"
  }
];

interface TenantManagementProps {
  onTenantsUpdate?: (tenants: TenantEntry[]) => void;
  onDepartmentsUpdate?: (departments: Department[]) => void;
}

export default function TenantManagement({ onTenantsUpdate, onDepartmentsUpdate }: TenantManagementProps) {
  const [tenants, setTenants] = useState<TenantEntry[]>(initialTenants);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
  const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantEntry | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive"
  });
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    description: "",
    tenantId: "",
    status: "active" as "active" | "inactive"
  });

  // Department search and filter
  const [deptSearchTerm, setDeptSearchTerm] = useState("");
  const [deptTenantFilter, setDeptTenantFilter] = useState<string>("all");
  const [deptStatusFilter, setDeptStatusFilter] = useState<string>("all");

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = 
      deptSearchTerm === "" ||
      dept.name.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(deptSearchTerm.toLowerCase()));

    const matchesTenant = deptTenantFilter === "all" || dept.tenantId === deptTenantFilter;
    const matchesStatus = deptStatusFilter === "all" || dept.status === deptStatusFilter;

    return matchesSearch && matchesTenant && matchesStatus;
  });

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      searchTerm === "" ||
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.description && tenant.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddTenant = () => {
    if (!formData.name.trim()) {
      toast.error("テナント名を入力してください");
      return;
    }

    // Check for duplicate tenant names
    if (tenants.some(t => t.name === formData.name.trim())) {
      toast.error("このテナント名は既に登録されています");
      return;
    }

    const newTenant: TenantEntry = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      createdAt: new Date().toISOString()
    };

    const updatedTenants = [...tenants, newTenant];
    setTenants(updatedTenants);
    onTenantsUpdate?.(updatedTenants);
    onDepartmentsUpdate?.(departments);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("テナントを追加しました");
  };

  const handleEditTenant = (tenant: TenantEntry) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      description: tenant.description || "",
      status: tenant.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTenant = () => {
    if (!editingTenant) return;

    if (!formData.name.trim()) {
      toast.error("テナント名を入力してください");
      return;
    }

    // Check for duplicate tenant names (excluding current)
    if (tenants.some(t => t.id !== editingTenant.id && t.name === formData.name.trim())) {
      toast.error("このテナント名は既に登録されています");
      return;
    }

    const updatedTenants = tenants.map(tenant =>
      tenant.id === editingTenant.id
        ? {
            ...tenant,
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            status: formData.status
          }
        : tenant
    );

    setTenants(updatedTenants);
    onTenantsUpdate?.(updatedTenants);
    onDepartmentsUpdate?.(departments);
    setIsEditDialogOpen(false);
    setEditingTenant(null);
    resetForm();
    toast.success("テナントを更新しました");
  };

  const handleDeleteTenant = (id: string) => {
    // Delete associated departments first
    const updatedDepartments = departments.filter(dept => dept.tenantId !== id);
    setDepartments(updatedDepartments);
    onDepartmentsUpdate?.(updatedDepartments);
    
    const updatedTenants = tenants.filter(tenant => tenant.id !== id);
    setTenants(updatedTenants);
    onTenantsUpdate?.(updatedTenants);
    toast.success("テナントを削除しました");
  };

  // Department management functions
  const handleAddDepartment = () => {
    if (!deptFormData.name.trim() || !deptFormData.tenantId) {
      toast.error("部署名とテナントを入力してください");
      return;
    }

    // Check for duplicate department names within the same tenant
    if (departments.some(d => d.name === deptFormData.name.trim() && d.tenantId === deptFormData.tenantId)) {
      toast.error("この部署名は既に登録されています");
      return;
    }

    const newDepartment: Department = {
      id: `dept-${Date.now()}`,
      name: deptFormData.name.trim(),
      description: deptFormData.description.trim() || undefined,
      tenantId: deptFormData.tenantId,
      status: deptFormData.status,
      createdAt: new Date().toISOString()
    };

    const updatedDepartments = [...departments, newDepartment];
    setDepartments(updatedDepartments);
    onDepartmentsUpdate?.(updatedDepartments);
    setIsAddDeptDialogOpen(false);
    resetDeptForm();
    toast.success("部署を追加しました");
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDeptFormData({
      name: department.name,
      description: department.description || "",
      tenantId: department.tenantId,
      status: department.status
    });
    setIsEditDeptDialogOpen(true);
  };

  const handleUpdateDepartment = () => {
    if (!editingDepartment) return;

    if (!deptFormData.name.trim() || !deptFormData.tenantId) {
      toast.error("部署名とテナントを入力してください");
      return;
    }

    // Check for duplicate department names within the same tenant (excluding current)
    if (departments.some(d => 
      d.id !== editingDepartment.id && 
      d.name === deptFormData.name.trim() && 
      d.tenantId === deptFormData.tenantId
    )) {
      toast.error("この部署名は既に登録されています");
      return;
    }

    const updatedDepartments = departments.map(dept =>
      dept.id === editingDepartment.id
        ? {
            ...dept,
            name: deptFormData.name.trim(),
            description: deptFormData.description.trim() || undefined,
            tenantId: deptFormData.tenantId,
            status: deptFormData.status
          }
        : dept
    );

    setDepartments(updatedDepartments);
    onDepartmentsUpdate?.(updatedDepartments);
    setIsEditDeptDialogOpen(false);
    setEditingDepartment(null);
    resetDeptForm();
    toast.success("部署を更新しました");
  };

  const handleDeleteDepartment = (id: string) => {
    const updatedDepartments = departments.filter(dept => dept.id !== id);
    setDepartments(updatedDepartments);
    onDepartmentsUpdate?.(updatedDepartments);
    toast.success("部署を削除しました");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active"
    });
  };

  const resetDeptForm = () => {
    setDeptFormData({
      name: "",
      description: "",
      tenantId: "",
      status: "active"
    });
  };

  const TenantForm = () => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">テナント名 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="株式会社ABC"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="テナントの説明（任意）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">状態</Label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="active"
              checked={formData.status === "active"}
              onChange={() => setFormData({ ...formData, status: "active" })}
              className="form-radio"
            />
            <span>有効</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="inactive"
              checked={formData.status === "inactive"}
              onChange={() => setFormData({ ...formData, status: "inactive" })}
              className="form-radio"
            />
            <span>無効</span>
          </label>
        </div>
      </div>
    </div>
  );

  const DepartmentForm = () => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="dept-name">部署名 *</Label>
        <Input
          id="dept-name"
          value={deptFormData.name}
          onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
          placeholder="営業部"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dept-tenant">テナント *</Label>
        <Select
          value={deptFormData.tenantId}
          onValueChange={(value) => setDeptFormData({ ...deptFormData, tenantId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="テナントを選択" />
          </SelectTrigger>
          <SelectContent>
            {tenants.filter(t => t.status === "active").map(tenant => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dept-description">説明</Label>
        <Input
          id="dept-description"
          value={deptFormData.description}
          onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
          placeholder="部署の説明（任意）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dept-status">状態</Label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="dept-status"
              value="active"
              checked={deptFormData.status === "active"}
              onChange={() => setDeptFormData({ ...deptFormData, status: "active" })}
              className="form-radio"
            />
            <span>有効</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="dept-status"
              value="inactive"
              checked={deptFormData.status === "inactive"}
              onChange={() => setDeptFormData({ ...deptFormData, status: "inactive" })}
              className="form-radio"
            />
            <span>無効</span>
          </label>
        </div>
      </div>
    </div>
  );

  const getTenantName = (tenantId: string) => {
    return tenants.find(t => t.id === tenantId)?.name || "不明なテナント";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            テナント管理
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <Plus className="h-4 w-4" />
                テナント追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規テナント登録</DialogTitle>
                <DialogDescription>
                  新しいテナントを登録します
                </DialogDescription>
              </DialogHeader>
              <TenantForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddTenant}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* フィルター */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="テナント名、説明で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  すべて
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                >
                  有効
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("inactive")}
                >
                  無効
                </Button>
              </div>

              <div className="text-sm text-muted-foreground flex items-center">
                {filteredTenants.length}件 / 全{tenants.length}件
              </div>
            </div>

            {/* テーブル */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>テナント名</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tenant.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                          {tenant.status === "active" ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditTenant(tenant)}
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
                                <AlertDialogTitle>テナントの削除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{tenant.name}」を削除してもよろしいですか？この操作は取り消せません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTenant(tenant.id)}
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
                    <TableCell colSpan={4} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <Search className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== "all"
                            ? "検索条件に一致するテナントがありません"
                            : "登録されたテナントがありません"}
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
            <DialogTitle>テナントの編集</DialogTitle>
            <DialogDescription>
              テナント情報を編集します
            </DialogDescription>
          </DialogHeader>
          <TenantForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateTenant}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 部署管理 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            部署管理
          </CardTitle>
          <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <Plus className="h-4 w-4" />
                部署追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規部署登録</DialogTitle>
                <DialogDescription>
                  新しい部署を登録します
                </DialogDescription>
              </DialogHeader>
              <DepartmentForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDeptDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddDepartment}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 部署フィルター */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="部署名、説明で検索..."
                  value={deptSearchTerm}
                  onChange={(e) => setDeptSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select
                value={deptTenantFilter}
                onValueChange={setDeptTenantFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="テナントでフィルター" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのテナント</SelectItem>
                  {tenants.filter(t => t.status === "active").map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Button
                  variant={deptStatusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeptStatusFilter("all")}
                >
                  すべて
                </Button>
                <Button
                  variant={deptStatusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeptStatusFilter("active")}
                >
                  有効
                </Button>
                <Button
                  variant={deptStatusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeptStatusFilter("inactive")}
                >
                  無効
                </Button>
              </div>

              <div className="text-sm text-muted-foreground flex items-center">
                {filteredDepartments.length}件 / 全{departments.length}件
              </div>
            </div>

            {/* 部署テーブル */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部署名</TableHead>
                  <TableHead>テナント</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>{getTenantName(department.tenantId)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {department.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={department.status === "active" ? "default" : "secondary"}>
                          {department.status === "active" ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditDepartment(department)}
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
                                <AlertDialogTitle>部署の削除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{department.name}」を削除してもよろしいですか？この操作は取り消せません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDepartment(department.id)}
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
                          {deptSearchTerm || deptTenantFilter !== "all" || deptStatusFilter !== "all"
                            ? "検索条件に一致する部署がありません"
                            : "登録された部署がありません"}
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

      {/* 部署編集ダイアログ */}
      <Dialog open={isEditDeptDialogOpen} onOpenChange={setIsEditDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>部署の編集</DialogTitle>
            <DialogDescription>
              部署情報を編集します
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDeptDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateDepartment}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}