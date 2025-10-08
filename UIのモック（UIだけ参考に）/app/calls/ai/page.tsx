"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Search, Phone, Upload, Play, Pause, Save, Edit, Trash } from "lucide-react";

// Sample templates
const initialTemplates = [
  {
    id: "template-1",
    name: "商品案内",
    type: "text",
    content: "こんにちは。新商品のご案内をさせていただきたく、お電話させていただきました。",
  },
  {
    id: "template-2",
    name: "アンケート",
    type: "text",
    content: "お客様満足度調査にご協力いただけますでしょうか。所要時間は約3分です。",
  },
  {
    id: "template-3",
    name: "フォローアップ",
    type: "audio",
    url: "/templates/followup.mp3",
  },
];

// Sample customers from the existing system
const customers = [
  {
    id: "user-1",
    name: "山田 太郎",
    phoneNumber: "090-1234-5678",
    tenant: "株式会社ABC",
    tags: [
      { id: "tag-1", name: "VIP", color: "#FF0000" },
      { id: "tag-2", name: "新規", color: "#00FF00" },
    ],
  },
  {
    id: "user-2",
    name: "佐藤 花子",
    phoneNumber: "090-8765-4321",
    tenant: "株式会社ABC",
    tags: [],
  },
  {
    id: "user-3",
    name: "鈴木 一郎",
    phoneNumber: "090-2345-6789",
    tenant: "株式会社XYZ",
    tags: [],
  },
];

// Add sample call log data
const callLogs = [
  {
    id: "log-1",
    customer: {
      name: "山田 太郎",
      phoneNumber: "090-1234-5678",
    },
    template: "商品案内",
    startTime: "2025-04-30T10:15:00",
    duration: "02:35",
    status: "completed",
    result: "通話完了",
  },
  {
    id: "log-2",
    customer: {
      name: "佐藤 花子",
      phoneNumber: "090-8765-4321",
    },
    template: "アンケート",
    startTime: "2025-04-30T10:20:00",
    duration: "00:00",
    status: "failed",
    result: "不在",
  },
  {
    id: "log-3",
    customer: {
      name: "鈴木 一郎",
      phoneNumber: "090-2345-6789",
    },
    template: "フォローアップ",
    startTime: "2025-04-30T10:25:00",
    duration: "01:45",
    status: "completed",
    result: "通話完了",
  },
];

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 128;
}

export default function AICallPage() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState<"all" | "completed" | "failed">("all");
  const [logDateTimeRange, setLogDateTimeRange] = useState<{
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
  const [selectedFailedLogs, setSelectedFailedLogs] = useState<string[]>([]);

  const filteredCustomers = customers.filter(customer => {
    return customerSearchTerm === "" ||
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.phoneNumber.includes(customerSearchTerm);
  });

  const filteredLogs = callLogs.filter(log => {
    const matchesSearch =
      logSearchTerm === "" ||
      log.customer.name.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.customer.phoneNumber.includes(logSearchTerm);

    const matchesStatus = logStatusFilter === "all" || log.status === logStatusFilter;

    let matchesDateTimeRange = true;
    
    if (logDateTimeRange.start.date && logDateTimeRange.end.date) {
      const logDateTime = new Date(log.startTime);
      const startDateTime = new Date(`${logDateTimeRange.start.date}T${logDateTimeRange.start.time || "00:00"}`);
      const endDateTime = new Date(`${logDateTimeRange.end.date}T${logDateTimeRange.end.time || "23:59"}`);
      
      matchesDateTimeRange = logDateTime >= startDateTime && logDateTime <= endDateTime;
    }

    return matchesSearch && matchesStatus && matchesDateTimeRange;
  });

  const handleStartCalls = () => {
    if (!selectedTemplate || selectedCustomers.length === 0) return;
    setIsCallInProgress(true);
    // Here you would integrate with your calling system
    console.log("Starting calls with template:", selectedTemplate);
    console.log("Selected customers:", selectedCustomers);
  };

  const handleStopCalls = () => {
    setIsCallInProgress(false);
    // Here you would stop the ongoing calls
  };

  const handleSaveTemplate = () => {
    const newTemplate = {
      id: `template-${templates.length + 1}`,
      name: newTemplateName,
      type: "text",
      content: newTemplateContent,
    };
    setTemplates([...templates, newTemplate]);
    setIsAddTemplateDialogOpen(false);
    setNewTemplateName("");
    setNewTemplateContent("");
  };

  const handleEditTemplate = (template: typeof templates[0]) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateContent(template.content || "");
    setIsEditTemplateDialogOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    const updatedTemplates = templates.map(template =>
      template.id === editingTemplate.id
        ? {
            ...template,
            name: newTemplateName,
            content: newTemplateContent,
          }
        : template
    );
    setTemplates(updatedTemplates);
    setIsEditTemplateDialogOpen(false);
    setEditingTemplate(null);
    setNewTemplateName("");
    setNewTemplateContent("");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(template => template.id !== templateId));
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null);
    }
  };

  const handleRetrySelectedCalls = () => {
    const failedCustomers = filteredLogs
      .filter(log => selectedFailedLogs.includes(log.id))
      .map(log => customers.find(c => c.phoneNumber === log.customer.phoneNumber)?.id)
      .filter((id): id is string => id !== undefined);

    setSelectedCustomers(failedCustomers);
    setSelectedFailedLogs([]);
    handleStartCalls();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">AI架電</h1>
        <div className="flex items-center gap-4">
          <Dialog open={isAddTemplateDialogOpen} onOpenChange={setIsAddTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Save className="h-4 w-4" />
                テンプレート追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規テンプレート</DialogTitle>
                <DialogDescription>
                  テンプレートの名前と内容を入力してください
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    名前
                  </Label>
                  <Input
                    id="name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="content" className="text-right">
                    内容
                  </Label>
                  <Textarea
                    id="content"
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    className="col-span-3"
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddTemplateDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSaveTemplate}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>テンプレート選択</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text">
              <TabsList className="mb-4">
                <TabsTrigger value="text">テキスト</TabsTrigger>
                <TabsTrigger value="audio">音声ファイル</TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                <div className="space-y-2">
                  {templates
                    .filter(t => t.type === "text")
                    .map(template => (
                      <div
                        key={template.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate === template.id ? "bg-accent" : "hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{template.name}</div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTemplate(template);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>テンプレートの削除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    「{template.name}」を削除してもよろしいですか？この操作は取り消せません。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTemplate(template.id)}
                                  >
                                    削除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {template.content}
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="audio">
                <div className="space-y-2">
                  {templates
                    .filter(t => t.type === "audio")
                    .map(template => (
                      <div
                        key={template.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate === template.id ? "bg-accent" : "hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{template.name}</div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>テンプレートの削除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{template.name}」を削除してもよろしいですか？この操作は取り消せません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTemplate(template.id)}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <audio controls className="w-full">
                          <source src={template.url} type="audio/mpeg" />
                          お使いのブラウザは音声再生をサポートしていません。
                        </audio>
                      </div>
                    ))}
                  <div className="mt-4">
                    <Label htmlFor="upload" className="block mb-2">新規音声ファイル</Label>
                    <div className="flex gap-2">
                      <Input id="upload" type="file" accept="audio/*" />
                      <Button variant="outline" className="shrink-0">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>架電先選択</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="名前または電話番号で検索"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedCustomers.length === filteredCustomers.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCustomers(filteredCustomers.map(c => c.id));
                                } else {
                                  setSelectedCustomers([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>顧客名</TableHead>
                          <TableHead>電話番号</TableHead>
                          <TableHead>タグ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedCustomers.includes(customer.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCustomers([...selectedCustomers, customer.id]);
                                  } else {
                                    setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>{customer.name}</TableCell>
                            <TableCell>{customer.phoneNumber}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
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
                          </TableRow>
                        ))}
                        {filteredCustomers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6">
                              <div className="flex flex-col items-center">
                                <Search className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                  検索条件に一致する顧客がいません
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div>選択中: {selectedCustomers.length}件</div>
                  <div>全{customers.length}件</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedCustomers.length > 0 && selectedTemplate && (
            <div className="flex justify-end">
              {isCallInProgress ? (
                <Button onClick={handleStopCalls} variant="destructive" className="gap-1">
                  <Pause className="h-4 w-4" />
                  停止
                </Button>
              ) : (
                <Button onClick={handleStartCalls} className="gap-1">
                  <Play className="h-4 w-4" />
                  架電開始
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {isCallInProgress && (
        <Card>
          <CardHeader>
            <CardTitle>架電状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCustomers.map(id => {
                const customer = customers.find(c => c.id === id);
                if (!customer) return null;
                return (
                  <div key={id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.phoneNumber}</div>
                    </div>
                    <Badge>
                      <Phone className="h-4 w-4 animate-pulse mr-1" />
                      発信中
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <CardTitle>架電履歴</CardTitle>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="顧客名または電話番号で検索"
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  className="w-[300px]"
                />
                <Select
                  value={logStatusFilter}
                  onValueChange={(value: "all" | "completed" | "failed") => setLogStatusFilter(value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="状態" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての状態</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="failed">失敗</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedFailedLogs.length > 0 && (
              <Button onClick={handleRetrySelectedCalls} className="gap-1">
                <Phone className="h-4 w-4" />
                再架電
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col min-h-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <Input
                type="date"
                value={logDateTimeRange.start.date}
                onChange={(e) => setLogDateTimeRange(prev => ({
                  ...prev,
                  start: { ...prev.start, date: e.target.value }
                }))}
              />
              <Input
                type="time"
                value={logDateTimeRange.start.time}
                onChange={(e) => setLogDateTimeRange(prev => ({
                  ...prev,
                  start: { ...prev.start, time: e.target.value }
                }))}
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={logDateTimeRange.end.date}
                onChange={(e) => setLogDateTimeRange(prev => ({
                  ...prev,
                  end: { ...prev.end, date: e.target.value }
                }))}
              />
              <Input
                type="time"
                value={logDateTimeRange.end.time}
                onChange={(e) => setLogDateTimeRange(prev => ({
                  ...prev,
                  end: { ...prev.end, time: e.target.value }
                }))}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedFailedLogs.length === filteredLogs.filter(log => log.status === "failed").length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFailedLogs(filteredLogs.filter(log => log.status === "failed").map(log => log.id));
                        } else {
                          setSelectedFailedLogs([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>顧客名</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>テンプレート</TableHead>
                  <TableHead>開始時刻</TableHead>
                  <TableHead>通話時間</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>結果</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow 
                    key={log.id}
                    className={log.status === "failed" ? "bg-destructive/10" : ""}
                  >
                    <TableCell>
                      {log.status === "failed" && (
                        <Checkbox
                          checked={selectedFailedLogs.includes(log.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFailedLogs([...selectedFailedLogs, log.id]);
                            } else {
                              setSelectedFailedLogs(selectedFailedLogs.filter(id => id !== log.id));
                            }
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{log.customer.name}</TableCell>
                    <TableCell>{log.customer.phoneNumber}</TableCell>
                    <TableCell>{log.template}</TableCell>
                    <TableCell>{formatDate(log.startTime)}</TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "completed"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {log.status === "completed" ? "完了" : "失敗"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.result}</TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <Search className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          検索条件に一致する架電履歴がありません
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

      <Dialog open={isEditTemplateDialogOpen} onOpenChange={setIsEditTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレートの編集</DialogTitle>
            <DialogDescription>
              テンプレートの内容を編集してください
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                名前
              </Label>
              <Input
                id="edit-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-content" className="text-right">
                内容
              </Label>
              <Textarea
                id="edit-content"
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                className="col-span-3"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTemplateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateTemplate}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}