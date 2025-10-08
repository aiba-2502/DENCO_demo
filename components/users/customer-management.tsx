"use client";

import React, { useState, useEffect } from "react";

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, UserPlus, Edit, Trash, Tag as TagIcon, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { api } from "@/lib/api-client";

interface Customer {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana?: string;
  first_name_kana?: string;
  phone_number: string;
  fax_number?: string;
  email?: string;
  postal_code?: string;
  prefecture?: string;
  address?: string;
  tags?: any[];
  created_at: string;
}

export default function CustomerManagementAPI() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    last_name_kana: "",
    first_name_kana: "",
    phone_number: "",
    fax_number: "",
    email: "",
    postal_code: "",
    prefecture: "",
    address: "",
    notes: "",
    tag_ids: [] as string[],
  });

  useEffect(() => {
    loadCustomers();
    loadTags();
  }, [searchTerm, selectedTags]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.customers.list({ 
        search: searchTerm || undefined,
        tag_id: selectedTags[0] || undefined,
        limit: 100 
      });
      setCustomers(response.customers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('顧客データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await api.tags.list();
      setTags(response.tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleAddCustomer = async () => {
    try {
      await api.customers.create(formData);
      toast.success('顧客を追加しました');
      setIsAddDialogOpen(false);
      resetForm();
      loadCustomers();
    } catch (error: any) {
      toast.error('顧客の追加に失敗しました', { description: error.message });
    }
  };

  const handleEditCustomer = async () => {
    if (!currentCustomer) return;
    
    try {
      await api.customers.update(currentCustomer.id, formData);
      toast.success('顧客情報を更新しました');
      setIsEditDialogOpen(false);
      resetForm();
      loadCustomers();
    } catch (error: any) {
      toast.error('顧客の更新に失敗しました', { description: error.message });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await api.customers.delete(customerId);
      toast.success('顧客を削除しました');
      loadCustomers();
    } catch (error: any) {
      toast.error('顧客の削除に失敗しました', { description: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      last_name: "",
      first_name: "",
      last_name_kana: "",
      first_name_kana: "",
      phone_number: "",
      fax_number: "",
      email: "",
      postal_code: "",
      prefecture: "",
      address: "",
      notes: "",
      tag_ids: [],
    });
    setCurrentCustomer(null);
  };

  const openEditDialog = (customer: Customer) => {
    setCurrentCustomer(customer);
    setFormData({
      last_name: customer.last_name,
      first_name: customer.first_name,
      last_name_kana: customer.last_name_kana || "",
      first_name_kana: customer.first_name_kana || "",
      phone_number: customer.phone_number,
      fax_number: customer.fax_number || "",
      email: customer.email || "",
      postal_code: customer.postal_code || "",
      prefecture: customer.prefecture || "",
      address: customer.address || "",
      notes: "",
      tag_ids: customer.tags?.map(t => t.id) || [],
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">顧客管理</h1>
          <p className="text-muted-foreground">顧客情報とタグ管理</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          顧客を追加
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>顧客検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="名前または電話番号で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>顧客一覧 ({customers.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              顧客が登録されていません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>タグ</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.last_name} {customer.first_name}
                      {customer.last_name_kana && (
                        <div className="text-sm text-muted-foreground">
                          {customer.last_name_kana} {customer.first_name_kana}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{customer.phone_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.email || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {customer.tags && customer.tags.length > 0 ? (
                          customer.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color, color: '#fff' }}
                            >
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(customer)}
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
                              <AlertDialogTitle>顧客を削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>顧客を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>姓</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>名</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>セイ</Label>
                <Input value={formData.last_name_kana} onChange={(e) => setFormData({...formData, last_name_kana: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>メイ</Label>
                <Input value={formData.first_name_kana} onChange={(e) => setFormData({...formData, first_name_kana: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>電話番号</Label>
              <Input value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>メールアドレス</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleAddCustomer}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>顧客情報を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>姓</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>名</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>電話番号</Label>
              <Input value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>メールアドレス</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleEditCustomer}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

