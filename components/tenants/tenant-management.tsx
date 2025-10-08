"use client";

import { useState, useEffect } from "react";

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash, Building, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function TenantManagementAPI() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: "",
    azure_speech_key: "",
    azure_speech_region: "japaneast",
    dify_api_key: "",
    dify_endpoint: "https://api.dify.ai/v1",
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await api.tenants.list();
      setTenants(response.tenants);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      toast.error('テナントの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async () => {
    try {
      await api.tenants.create(formData);
      toast.success('テナントを作成しました');
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        azure_speech_key: "",
        azure_speech_region: "japaneast",
        dify_api_key: "",
        dify_endpoint: "https://api.dify.ai/v1",
      });
      loadTenants();
    } catch (error: any) {
      toast.error('テナントの作成に失敗しました', { description: error.message });
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      await api.tenants.delete(tenantId);
      toast.success('テナントを削除しました');
      loadTenants();
    } catch (error: any) {
      toast.error('テナントの削除に失敗しました', { description: error.message });
    }
  };

  const toggleShowSecret = (tenantId: string) => {
    setShowSecrets(prev => ({ ...prev, [tenantId]: !prev[tenantId] }));
  };

  const filteredTenants = tenants.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">テナント管理</h1>
          <p className="text-muted-foreground">マルチテナント環境の管理</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          テナントを追加
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テナント検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="テナント名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>テナント一覧 ({filteredTenants.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              テナントが登録されていません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>テナント名</TableHead>
                  <TableHead>Azure Speech</TableHead>
                  <TableHead>Dify AI</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {tenant.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ID: {tenant.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.azure_speech_key ? "default" : "outline"}>
                        {tenant.azure_speech_key ? `${tenant.azure_speech_region}` : '未設定'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.dify_api_key ? "default" : "outline"}>
                        {tenant.dify_api_key ? '設定済み' : '未設定'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>テナントを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は取り消せません。すべての関連データが削除されます。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTenant(tenant.id)}>
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テナントを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>テナント名</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="株式会社ABC"
              />
            </div>
            <div className="space-y-2">
              <Label>Azure Speech Key</Label>
              <Input
                value={formData.azure_speech_key}
                onChange={(e) => setFormData({...formData, azure_speech_key: e.target.value})}
                placeholder="Azure サブスクリプションキー"
              />
            </div>
            <div className="space-y-2">
              <Label>Azure Speech Region</Label>
              <Input
                value={formData.azure_speech_region}
                onChange={(e) => setFormData({...formData, azure_speech_region: e.target.value})}
                placeholder="japaneast"
              />
            </div>
            <div className="space-y-2">
              <Label>Dify API Key</Label>
              <Input
                value={formData.dify_api_key}
                onChange={(e) => setFormData({...formData, dify_api_key: e.target.value})}
                placeholder="Dify APIキー"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddTenant}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

