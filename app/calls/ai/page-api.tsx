"use client";

import { useState, useEffect } from "react";

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Phone, Plus, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function AICallPageAPI() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "text",
    content: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [templatesRes, customersRes, campaignsRes] = await Promise.all([
        api.campaigns.templates.list(),
        api.customers.list({ limit: 100 }),
        api.campaigns.list({ limit: 50 }),
      ]);

      setTemplates(templatesRes.templates);
      setCustomers(customersRes.customers);
      setCampaigns(campaignsRes.campaigns);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    try {
      await api.campaigns.templates.create(templateForm);
      toast.success('テンプレートを追加しました');
      setIsAddTemplateOpen(false);
      setTemplateForm({ name: "", type: "text", content: "" });
      loadAll();
    } catch (error: any) {
      toast.error('テンプレートの追加に失敗しました', { description: error.message });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await api.campaigns.templates.delete(templateId);
      toast.success('テンプレートを削除しました');
      loadAll();
    } catch (error: any) {
      toast.error('テンプレートの削除に失敗しました');
    }
  };

  const handleStartCampaign = async () => {
    if (!selectedTemplate || selectedCustomers.length === 0) {
      toast.error('テンプレートと顧客を選択してください');
      return;
    }

    try {
      const campaign = await api.campaigns.create({
        template_id: selectedTemplate,
        name: `Campaign ${new Date().toLocaleString('ja-JP')}`,
        customer_ids: selectedCustomers,
      });

      await api.campaigns.start(campaign.campaign.id);
      
      toast.success('AI架電を開始しました', {
        description: `${selectedCustomers.length}件の顧客に発信中`,
      });
      
      setSelectedCustomers([]);
      loadAll();
    } catch (error: any) {
      toast.error('キャンペーンの開始に失敗しました', { description: error.message });
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI架電</h1>
          <p className="text-muted-foreground">テンプレートベースの自動発信</p>
        </div>
        <Button onClick={() => setIsAddTemplateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          テンプレート追加
        </Button>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">テンプレート ({templates.length})</TabsTrigger>
          <TabsTrigger value="customers">顧客選択 ({selectedCustomers.length}選択中)</TabsTrigger>
          <TabsTrigger value="campaigns">キャンペーン履歴 ({campaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>テンプレート一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">読み込み中...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  テンプレートがありません
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline">{template.type}</Badge>
                          </div>
                          {template.content && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {template.content}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>発信先顧客を選択 ({selectedCustomers.length}件選択中)</CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  顧客が登録されていません
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={() => toggleCustomerSelection(customer.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {customer.last_name} {customer.first_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {customer.phone_number}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>キャンペーン履歴</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  キャンペーン履歴がありません
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>キャンペーン名</TableHead>
                      <TableHead>対象件数</TableHead>
                      <TableHead>完了/失敗</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>開始日時</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.total_targets}</TableCell>
                        <TableCell>
                          {campaign.completed_calls} / {campaign.failed_calls}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            campaign.status === 'completed' ? 'default' :
                            campaign.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {campaign.started_at ? new Date(campaign.started_at).toLocaleString('ja-JP') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTemplate && selectedCustomers.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">発信準備完了</p>
                <p className="text-sm text-muted-foreground">
                  テンプレート: {templates.find(t => t.id === selectedTemplate)?.name} · 
                  {selectedCustomers.length}件の顧客
                </p>
              </div>
              <Button onClick={handleStartCampaign} size="lg">
                <Phone className="mr-2 h-4 w-4" />
                AI架電を開始
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* テンプレート追加ダイアログ */}
      <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレートを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>テンプレート名</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                placeholder="商品案内"
              />
            </div>
            <div className="space-y-2">
              <Label>種類</Label>
              <Select
                value={templateForm.type}
                onValueChange={(value) => setTemplateForm({...templateForm, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">テキスト</SelectItem>
                  <SelectItem value="audio">音声</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {templateForm.type === 'text' && (
              <div className="space-y-2">
                <Label>メッセージ内容</Label>
                <Textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                  placeholder="こんにちは。新商品のご案内です..."
                  rows={5}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTemplateOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddTemplate}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

