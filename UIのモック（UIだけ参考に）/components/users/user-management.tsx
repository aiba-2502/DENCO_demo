"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Search, UserPlus, Edit, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";

// サンプルユーザーデータ - 実際のアプリではAPIから取得
const initialUsers = [
  {
    id: "user-1",
    name: "山田 太郎",
    phoneNumber: "090-1234-5678",
    email: "yamada.t@example.com",
    tenant: "株式会社ABC",
    createdAt: "2024-12-15T14:30:00",
  },
  {
    id: "user-2",
    name: "佐藤 花子",
    phoneNumber: "090-8765-4321",
    email: "sato.h@example.com",
    tenant: "株式会社ABC",
    createdAt: "2025-01-05T10:15:00",
  },
  {
    id: "user-3",
    name: "鈴木 一郎",
    phoneNumber: "090-2345-6789",
    email: "suzuki.i@globex.com",
    tenant: "株式会社XYZ",
    createdAt: "2025-01-12T09:30:00",
  },
];

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  tenant: string;
  createdAt: string;
}

interface FormData {
  name: string;
  phoneNumber: string;
  email: string;
  tenant: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phoneNumber: "",
    email: "",
    tenant: "",
  });

  // ユーザーのフィルタリング
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTenant = tenantFilter === "all" || user.tenant === tenantFilter;

    return matchesSearch && matchesTenant;
  });

  // フォーム入力の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // テナント選択の処理
  const handleTenantChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tenant: value,
    }));
  };

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      name: "",
      phoneNumber: "",
      email: "",
      tenant: "",
    });
    setCurrentUser(null);
  };

  // ユーザー追加の処理
  const handleAddUser = () => {
    const newUser: User = {
      id: `user-${users.length + 1}`,
      ...formData,
      createdAt: new Date().toISOString(),
    };

    setUsers([...users, newUser]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  // ユーザー編集ボタンの処理
  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
      tenant: user.tenant,
    });
    setIsEditDialogOpen(true);
  };

  // ユーザー更新の処理
  const handleUpdateUser = () => {
    if (!currentUser) return;

    const updatedUsers = users.map((user) =>
      user.id === currentUser.id
        ? { ...user, ...formData }
        : user
    );

    setUsers(updatedUsers);
    setIsEditDialogOpen(false);
    resetForm();
  };

  // ユーザー削除の処理
  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter((user) => user.id !== userId);
    setUsers(updatedUsers);
  };

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <UserPlus className="h-4 w-4" />
              ユーザー追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規ユーザー追加</DialogTitle>
              <DialogDescription>
                新しいユーザーと電話番号のマッピングを作成
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  名前
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="氏名"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phoneNumber" className="text-right">
                  電話番号
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="090-1234-5678"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  メール
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tenant" className="text-right">
                  テナント
                </Label>
                <Select
                  value={formData.tenant}
                  onValueChange={handleTenantChange}
                >
                  <SelectTrigger id="tenant" className="col-span-3">
                    <SelectValue placeholder="テナントを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="株式会社ABC">株式会社ABC</SelectItem>
                    <SelectItem value="株式会社XYZ">株式会社XYZ</SelectItem>
                    <SelectItem value="株式会社123">株式会社123</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddUser}>追加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ユーザー検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="名前、メール、電話番号で検索"
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
                <SelectItem value="株式会社ABC">株式会社ABC</SelectItem>
                <SelectItem value="株式会社XYZ">株式会社XYZ</SelectItem>
                <SelectItem value="株式会社123">株式会社123</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>メール</TableHead>
                <TableHead>テナント</TableHead>
                <TableHead>作成日時</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.tenant}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(user)}
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
                              <AlertDialogTitle>ユーザーの削除</AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.name}を削除してもよろしいですか？この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
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
                      <p className="text-muted-foreground">検索条件に一致するユーザーがいません</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ユーザー編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー編集</DialogTitle>
            <DialogDescription>
              ユーザー情報と電話番号のマッピングを更新
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                名前
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phoneNumber" className="text-right">
                電話番号
              </Label>
              <Input
                id="edit-phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                メール
              </Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tenant" className="text-right">
                テナント
              </Label>
              <Select
                value={formData.tenant}
                onValueChange={handleTenantChange}
              >
                <SelectTrigger id="edit-tenant" className="col-span-3">
                  <SelectValue placeholder="テナントを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="株式会社ABC">株式会社ABC</SelectItem>
                  <SelectItem value="株式会社XYZ">株式会社XYZ</SelectItem>
                  <SelectItem value="株式会社123">株式会社123</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateUser}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}