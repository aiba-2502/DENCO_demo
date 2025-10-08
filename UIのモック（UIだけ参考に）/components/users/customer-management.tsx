"use client";

import React from "react";
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
import { Search, UserPlus, Edit, Trash, Tag, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TagManagement from "./tag-management";
import { useSearchParams } from "next/navigation";
import { toast } from 'sonner';

// 初期タグデータ
const initialTags = [
  {
    id: "tag-1",
    name: "VIP",
    color: "#FF0000",
  },
  {
    id: "tag-2",
    name: "新規",
    color: "#00FF00",
  },
  {
    id: "tag-3",
    name: "要フォロー",
    color: "#0000FF",
  },
];

// 郵便番号から住所を取得するサンプルデータ
const postalCodeData: Record<string, { prefecture: string; address: string }> = {
  "1000001": { prefecture: "東京都", address: "千代田区千代田" },
  "1500001": { prefecture: "東京都", address: "渋谷区神宮前" },
  "5300001": { prefecture: "大阪府", address: "大阪市北区梅田" },
  "5410041": { prefecture: "大阪府", address: "大阪市中央区北浜" },
  "2310023": { prefecture: "神奈川県", address: "横浜市中区山下町" },
};

// サンプル顧客データ - 実際のアプリではAPIから取得
const initialCustomers = [
  {
    id: "user-1",
    lastName: "山田",
    firstName: "太郎",
    lastNameKana: "ヤマダ",
    firstNameKana: "タロウ",
    phoneNumber: "090-1234-5678",
    faxNumber: "03-1234-5678",
    email: "yamada.t@example.com",
    postalCode: "100-0001",
    prefecture: "東京都",
    address: "千代田区千代田1-1-1",
    tenant: "株式会社ABC",
    tags: [
      { id: "tag-1", name: "VIP", color: "#FF0000" },
      { id: "tag-2", name: "新規", color: "#00FF00" },
    ],
    createdAt: "2024-12-15T14:30:00",
  },
  {
    id: "user-2",
    lastName: "佐藤",
    firstName: "花子",
    lastNameKana: "サトウ",
    firstNameKana: "ハナコ",
    phoneNumber: "090-8765-4321",
    faxNumber: "03-8765-4321",
    email: "sato.h@example.com",
    postalCode: "150-0001",
    prefecture: "東京都",
    address: "渋谷区神宮前2-2-2",
    tenant: "株式会社ABC",
    tags: [],
    createdAt: "2025-01-05T10:15:00",
  },
  {
    id: "user-3",
    lastName: "鈴木",
    firstName: "一郎",
    lastNameKana: "スズキ",
    firstNameKana: "イチロウ",
    phoneNumber: "090-2345-6789",
    faxNumber: "03-2345-6789",
    email: "suzuki.i@globex.com",
    postalCode: "530-0001",
    prefecture: "大阪府",
    address: "大阪市北区梅田3-3-3",
    tenant: "株式会社XYZ",
    tags: [
      { id: "tag-3", name: "要フォロー", color: "#0000FF" },
    ],
    createdAt: "2025-01-12T09:30:00",
  },
];

interface Customer {
  id: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  postalCode: string;
  prefecture: string;
  address: string;
  tenant: string;
  tags: Array<{ id: string; name: string; color: string }>;
  createdAt: string;
}

interface FormData {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  postalCode: string;
  prefecture: string;
  address: string;
  tenant: string;
}

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 128;
}

export default function CustomerManagement() {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState(initialTags);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    lastName: "",
    firstName: "",
    lastNameKana: "",
    firstNameKana: "",
    phoneNumber: "",
    faxNumber: "",
    email: "",
    postalCode: "",
    prefecture: "",
    address: "",
    tenant: "",
  });
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCallTarget, setSelectedCallTarget] = useState<{
    phoneNumber: string;
    customerName: string;
  } | null>(null);

  // URLパラメータから初期値を設定
  React.useEffect(() => {
    const isRegisterMode = searchParams.get('register') === 'true';
    if (isRegisterMode) {
      const phoneNumber = searchParams.get('phoneNumber') || '';
      const tenant = searchParams.get('tenant') || '';
      const suggestedName = searchParams.get('suggestedName') || '';
      
      // 名前を姓名に分割（簡易的な処理）
      const nameParts = suggestedName.split(' ');
      const lastName = nameParts[0] || '';
      const firstName = nameParts[1] || '';
      
      setFormData(prev => ({
        ...prev,
        phoneNumber: phoneNumber,
        tenant: tenant,
        lastName: lastName,
        firstName: firstName,
      }));
      
      // 自動的に追加ダイアログを開く
      setIsAddDialogOpen(true);
    }
  }, [searchParams]);

  // 顧客のフィルタリング
  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.lastName} ${customer.firstName}`;
    const fullNameKana = `${customer.lastNameKana} ${customer.firstNameKana}`;
    
    const matchesSearch =
      searchTerm === "" ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullNameKana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber.includes(searchTerm) ||
      customer.faxNumber.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTenant = tenantFilter === "all" || customer.tenant === tenantFilter;

    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tagId => customer.tags.some(tag => tag.id === tagId));

    return matchesSearch && matchesTenant && matchesTags;
  });

  // 郵便番号の自動補完
  const handlePostalCodeChange = (value: string) => {
    // ハイフンを除去して数字のみにする
    const numbersOnly = value.replace(/[^\d]/g, '');
    
    // 7桁まで制限
    if (numbersOnly.length > 7) return;
    
    // ハイフンを自動挿入（3桁-4桁の形式）
    let formattedValue = numbersOnly;
    if (numbersOnly.length > 3) {
      formattedValue = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
    }
    
    setFormData(prev => ({ ...prev, postalCode: formattedValue }));
    
    // 7桁入力完了時に住所を自動補完
    if (numbersOnly.length === 7) {
      const addressData = postalCodeData[numbersOnly];
      if (addressData) {
        setFormData(prev => ({
          ...prev,
          prefecture: addressData.prefecture,
          address: addressData.address,
        }));
      }
    }
  };

  // フォーム入力の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'postalCode') {
      handlePostalCodeChange(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
      lastName: "",
      firstName: "",
      lastNameKana: "",
      firstNameKana: "",
      phoneNumber: "",
      faxNumber: "",
      email: "",
      postalCode: "",
      prefecture: "",
      address: "",
      tenant: "",
    });
    setCurrentCustomer(null);
  };

  // 顧客追加の処理
  const handleAddCustomer = () => {
    const newCustomer: Customer = {
      id: `user-${customers.length + 1}`,
      ...formData,
      tags: [],
      createdAt: new Date().toISOString(),
    };

    setCustomers([...customers, newCustomer]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  // 顧客編集ボタンの処理
  const handleEditClick = (customer: Customer) => {
    setCurrentCustomer(customer);
    setFormData({
      lastName: customer.lastName,
      firstName: customer.firstName,
      lastNameKana: customer.lastNameKana,
      firstNameKana: customer.firstNameKana,
      phoneNumber: customer.phoneNumber,
      faxNumber: customer.faxNumber,
      email: customer.email,
      postalCode: customer.postalCode,
      prefecture: customer.prefecture,
      address: customer.address,
      tenant: customer.tenant,
    });
    setIsEditDialogOpen(true);
  };

  // 顧客更新の処理
  const handleUpdateCustomer = () => {
    if (!currentCustomer) return;

    const updatedCustomers = customers.map((customer) =>
      customer.id === currentCustomer.id
        ? { ...customer, ...formData }
        : customer
    );

    setCustomers(updatedCustomers);
    setIsEditDialogOpen(false);
    resetForm();
  };

  // 顧客削除の処理
  const handleDeleteCustomer = (customerId: string) => {
    const updatedCustomers = customers.filter((customer) => customer.id !== customerId);
    setCustomers(updatedCustomers);
  };

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  // タグ選択の処理
  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // タグフィルターのクリア
  const clearTagFilters = () => {
    setSelectedTags([]);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">顧客管理</h1>
        <div className="flex gap-2">
          <Dialog open={isTagManagementOpen} onOpenChange={setIsTagManagementOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Tag className="h-4 w-4" />
                タグ管理
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>タグ管理</DialogTitle>
                <DialogDescription>
                  顧客に付与するタグの作成・編集・削除を行います
                </DialogDescription>
              </DialogHeader>
              <TagManagement onTagsUpdate={setAvailableTags} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <UserPlus className="h-4 w-4" />
                顧客追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新規顧客追加</DialogTitle>
                <DialogDescription>
                  新しい顧客情報を登録します
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastName">姓</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="山田"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">名</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="太郎"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastNameKana">セイ</Label>
                    <Input
                      id="lastNameKana"
                      name="lastNameKana"
                      placeholder="ヤマダ"
                      value={formData.lastNameKana}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstNameKana">メイ</Label>
                    <Input
                      id="firstNameKana"
                      name="firstNameKana"
                      placeholder="タロウ"
                      value={formData.firstNameKana}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">電話番号</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="090-1234-5678"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faxNumber">FAX番号</Label>
                    <Input
                      id="faxNumber"
                      name="faxNumber"
                      placeholder="03-1234-5678"
                      value={formData.faxNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">郵便番号</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="123-4567"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    7桁入力すると住所が自動補完されます
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefecture">都道府県</Label>
                    <Input
                      id="prefecture"
                      name="prefecture"
                      placeholder="東京都"
                      value={formData.prefecture}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">住所</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="千代田区千代田1-1-1"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant">テナント</Label>
                  <Select
                    value={formData.tenant}
                    onValueChange={handleTenantChange}
                  >
                    <SelectTrigger id="tenant">
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
                <Button onClick={handleAddCustomer}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>顧客検索</CardTitle>
          <CardDescription>
            名前、フリガナ、電話番号、FAX番号、メールアドレス、住所で検索
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="名前、フリガナ、電話番号、メール、住所で検索"
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

          {/* タグフィルター */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">タグでフィルター</Label>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTagFilters}
                  className="text-xs"
                >
                  クリア ({selectedTags.length})
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.length > 0 ? (
                availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'border-transparent'
                        : 'hover:bg-accent'
                    }`}
                    style={selectedTags.includes(tag.id) ? {
                      backgroundColor: tag.color,
                      color: isLightColor(tag.color) ? "#000000" : "#FFFFFF",
                      borderColor: 'transparent'
                    } : {}}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {selectedTags.includes(tag.id) && "✓ "}
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">タグが登録されていません</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>顧客一覧</CardTitle>
          <CardDescription>
            {filteredCustomers.length}件 / 全{customers.length}件
            {selectedTags.length > 0 && ` (タグフィルター: ${selectedTags.length}個)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">プロフィール</TableHead>
                <TableHead>顧客名</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>タグ</TableHead>
                <TableHead>テナント</TableHead>
                <TableHead>登録日時</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-medium">
                          {customer.lastName.charAt(0)}{customer.firstName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{customer.lastName} {customer.firstName}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.lastNameKana} {customer.firstNameKana}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs py-0 h-5"
                            style={{
                              backgroundColor: tag.color,
                              color: isLightColor(tag.color) ? "#000000" : "#FFFFFF",
                              borderColor: 'transparent'
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{customer.tenant}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCallClick(customer.phoneNumber, `${customer.lastName} ${customer.firstName}`)}
                          title="通話発信"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(customer)}
                          title="編集"
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
                              <AlertDialogTitle>顧客の削除</AlertDialogTitle>
                              <AlertDialogDescription>
                                {customer.lastName} {customer.firstName}を削除してもよろしいですか？この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCustomer(customer.id)}
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
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">検索条件に一致する顧客がいません</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 顧客編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>顧客編集</DialogTitle>
            <DialogDescription>
              顧客情報を更新します
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">姓</Label>
                <Input
                  id="edit-lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">名</Label>
                <Input
                  id="edit-firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-lastNameKana">セイ</Label>
                <Input
                  id="edit-lastNameKana"
                  name="lastNameKana"
                  value={formData.lastNameKana}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-firstNameKana">メイ</Label>
                <Input
                  id="edit-firstNameKana"
                  name="firstNameKana"
                  value={formData.firstNameKana}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">電話番号</Label>
                <Input
                  id="edit-phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-faxNumber">FAX番号</Label>
                <Input
                  id="edit-faxNumber"
                  name="faxNumber"
                  value={formData.faxNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">メールアドレス</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-postalCode">郵便番号</Label>
              <Input
                id="edit-postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prefecture">都道府県</Label>
                <Input
                  id="edit-prefecture"
                  name="prefecture"
                  value={formData.prefecture}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">住所</Label>
                <Input
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tenant">テナント</Label>
              <Select
                value={formData.tenant}
                onValueChange={handleTenantChange}
              >
                <SelectTrigger id="edit-tenant">
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
            <Button onClick={handleUpdateCustomer}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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