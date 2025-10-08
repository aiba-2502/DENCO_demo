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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash, Search, Users } from "lucide-react";

interface Department {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  email: string;
  phoneNumber: string;
  status: "active" | "inactive";
  createdAt: string;
}

const initialStaff: Staff[] = [
  {
    id: "staff-1",
    firstName: "太郎",
    lastName: "山田",
    department: "営業部",
    email: "taro.yamada@example.com",
    phoneNumber: "090-1234-5678",
    status: "active",
    createdAt: "2025-04-30T10:00:00"
  },
  {
    id: "staff-2",
    firstName: "花子",
    lastName: "鈴木",
    department: "カスタマーサポート",
    email: "hanako.suzuki@example.com",
    phoneNumber: "090-8765-4321",
    status: "active",
    createdAt: "2025-04-30T10:05:00"
  },
  {
    id: "staff-3",
    firstName: "一郎",
    lastName: "田中",
    department: "技術部",
    email: "ichiro.tanaka@example.com",
    phoneNumber: "090-2345-6789",
    status: "inactive",
    createdAt: "2025-04-30T10:10:00"
  }
];

interface StaffManagementProps {
  availableDepartments?: Department[];
}

export default function StaffManagement({ availableDepartments = [] }: StaffManagementProps) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    email: "",
    phoneNumber: "",
    status: "active" as "active" | "inactive"
  });

  const filteredStaff = staff.filter(member => {
    const fullName = `${member.lastName} ${member.firstName}`;
    const matchesSearch = 
      searchTerm === "" ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phoneNumber.includes(searchTerm);

    const matchesDepartment = departmentFilter === "all" || member.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleAddStaff = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error("名前とメールアドレスを入力してください");
      return;
    }

    // Check for duplicate email
    if (staff.some(s => s.email === formData.email.trim())) {
      toast.error("このメールアドレスは既に登録されています");
      return;
    }

    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      department: formData.department,
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      status: formData.status,
      createdAt: new Date().toISOString()
    };

    setStaff([...staff, newStaff]);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("スタッフを追加しました");
  };

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      department: staffMember.department,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber,
      status: staffMember.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStaff = () => {
    if (!editingStaff) return;

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error("名前とメールアドレスを入力してください");
      return;
    }

    // Check for duplicate email (excluding current)
    if (staff.some(s => s.id !== editingStaff.id && s.email === formData.email.trim())) {
      toast.error("このメールアドレスは既に登録されています");
      return;
    }

    const updatedStaff = staff.map(member =>
      member.id === editingStaff.id
        ? {
            ...member,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            department: formData.department,
            email: formData.email.trim(),
            phoneNumber: formData.phoneNumber.trim(),
            status: formData.status
          }
        : member
    );

    setStaff(updatedStaff);
    setIsEditDialogOpen(false);
    setEditingStaff(null);
    resetForm();
    toast.success("スタッフを更新しました");
  };

  const handleDeleteStaff = (id: string) => {
    setStaff(staff.filter(member => member.id !== id));
    toast.success("スタッフを削除しました");
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      department: "",
      email: "",
      phoneNumber: "",
      status: "active"
    });
  };

  const StaffForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">姓 *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="山田"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">名 *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="太郎"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">部署</Label>
        <Select
          value={formData.department}
          onValueChange={(value) => setFormData({ ...formData, department: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="部署を選択" />
          </SelectTrigger>
          <SelectContent>
            {availableDepartments.filter(d => d.status === "active").map(dept => (
              <SelectItem key={dept.id} value={dept.name}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">電話番号</Label>
        <Input
          id="phoneNumber"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="090-1234-5678"
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            スタッフ管理
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <Plus className="h-4 w-4" />
                スタッフ追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規スタッフ登録</DialogTitle>
                <DialogDescription>
                  新しいスタッフを登録します
                </DialogDescription>
              </DialogHeader>
              <StaffForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddStaff}>追加</Button>
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
                  placeholder="名前、部署、メール、電話番号で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="部署でフィルター" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての部署</SelectItem>
                  {availableDepartments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                {filteredStaff.length}件 / 全{staff.length}件
              </div>
            </div>

            {/* テーブル */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>スタッフ名</TableHead>
                  <TableHead>部署</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.lastName} {member.firstName}
                      </TableCell>
                      <TableCell>{member.department}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phoneNumber}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>
                          {member.status === "active" ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditStaff(member)}
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
                                <AlertDialogTitle>スタッフの削除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{member.lastName} {member.firstName}」を削除してもよろしいですか？この操作は取り消せません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStaff(member.id)}
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
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <Search className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {searchTerm || departmentFilter !== "all" || statusFilter !== "all"
                            ? "検索条件に一致するスタッフがいません"
                            : "登録されたスタッフがいません"}
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
            <DialogTitle>スタッフの編集</DialogTitle>
            <DialogDescription>
              スタッフ情報を編集します
            </DialogDescription>
          </DialogHeader>
          <StaffForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateStaff}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}