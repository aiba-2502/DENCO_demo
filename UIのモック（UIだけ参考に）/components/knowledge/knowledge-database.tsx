"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Database, 
  User, 
  Calendar, 
  Tag, 
  Eye, 
  Filter,
  FileText,
  MessageSquare,
  Clock,
  Building,
  Phone
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// サンプルナレッジデータ
const knowledgeData = [
  {
    id: "kb-1",
    title: "請求書の発行について",
    content: "請求書は毎月末日に発行され、翌月10日までにお支払いください。支払い方法は銀行振込、クレジットカード、口座振替から選択できます。",
    category: "請求・支払い",
    tags: ["請求書", "支払い", "銀行振込", "クレジットカード"],
    lastUpdated: "2025-04-25T10:30:00",
    relevanceScore: 0.95
  },
  {
    id: "kb-2", 
    title: "パスワードリセットの手順",
    content: "パスワードをリセットするには、ログイン画面の「パスワードを忘れた方」をクリックし、登録済みのメールアドレスを入力してください。リセット用のリンクが送信されます。",
    category: "アカウント管理",
    tags: ["パスワード", "リセット", "ログイン", "メール"],
    lastUpdated: "2025-04-20T14:15:00",
    relevanceScore: 0.88
  },
  {
    id: "kb-3",
    title: "サービス利用料金について",
    content: "基本プランは月額5,000円、プレミアムプランは月額10,000円です。年間契約の場合は10%割引が適用されます。",
    category: "料金・プラン",
    tags: ["料金", "プラン", "基本", "プレミアム", "年間契約"],
    lastUpdated: "2025-04-18T09:45:00",
    relevanceScore: 0.82
  }
];

// サンプル顧客お問い合わせデータ
const customerInquiries = [
  {
    id: "inq-1",
    customer: {
      name: "山田 太郎",
      phoneNumber: "090-1234-5678",
      tenant: "株式会社ABC"
    },
    summary: "請求書の支払い期限について質問。銀行振込での支払い方法を確認。次回から口座振替への変更を希望。",
    category: "請求・支払い",
    tags: ["請求書", "支払い期限", "銀行振込", "口座振替"],
    callDate: "2025-04-29T14:30:00",
    duration: "08:45",
    status: "resolved",
    priority: "medium"
  },
  {
    id: "inq-2",
    customer: {
      name: "佐藤 花子", 
      phoneNumber: "090-8765-4321",
      tenant: "株式会社ABC"
    },
    summary: "ログインできない問題。パスワードリセットを実行したが、メールが届かない。メールアドレスの変更が必要。",
    category: "アカウント管理",
    tags: ["ログイン", "パスワード", "メール", "アドレス変更"],
    callDate: "2025-04-29T10:15:00",
    duration: "12:33",
    status: "resolved",
    priority: "high"
  },
  {
    id: "inq-3",
    customer: {
      name: "鈴木 一郎",
      phoneNumber: "090-2345-6789", 
      tenant: "株式会社XYZ"
    },
    summary: "プレミアムプランへのアップグレードを検討。年間契約の割引条件と機能差について詳細を確認。",
    category: "料金・プラン",
    tags: ["プレミアム", "アップグレード", "年間契約", "割引"],
    callDate: "2025-04-28T16:20:00",
    duration: "15:28",
    status: "follow_up",
    priority: "medium"
  }
];

// 利用可能なタグ
const availableTags = [
  { id: "tag-1", name: "請求書", color: "#3B82F6" },
  { id: "tag-2", name: "支払い", color: "#10B981" },
  { id: "tag-3", name: "パスワード", color: "#F59E0B" },
  { id: "tag-4", name: "ログイン", color: "#EF4444" },
  { id: "tag-5", name: "料金", color: "#8B5CF6" },
  { id: "tag-6", name: "プラン", color: "#06B6D4" },
];

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 128;
}

export default function KnowledgeDatabase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedKnowledge, setSelectedKnowledge] = useState<typeof knowledgeData[0] | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<typeof customerInquiries[0] | null>(null);
  const [isKnowledgeDialogOpen, setIsKnowledgeDialogOpen] = useState(false);
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false);

  // ナレッジデータのフィルタリング
  const filteredKnowledge = knowledgeData.filter((item) => {
    const matchesSearch = 
      searchTerm === "" ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tagName => item.tags.includes(tagName));

    return matchesSearch && matchesCategory && matchesTags;
  });

  // お問い合わせデータのフィルタリング
  const filteredInquiries = customerInquiries.filter((item) => {
    const matchesSearch = 
      searchTerm === "" ||
      item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tagName => item.tags.includes(tagName));

    return matchesSearch && matchesCategory && matchesStatus && matchesTags;
  });

  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(name => name !== tagName)
        : [...prev, tagName]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const handleKnowledgeView = (item: typeof knowledgeData[0]) => {
    setSelectedKnowledge(item);
    setIsKnowledgeDialogOpen(true);
  };

  const handleInquiryView = (item: typeof customerInquiries[0]) => {
    setSelectedInquiry(item);
    setIsInquiryDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge variant="default">解決済み</Badge>;
      case "follow_up":
        return <Badge variant="secondary">フォローアップ</Badge>;
      case "pending":
        return <Badge variant="outline">保留中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">高</Badge>;
      case "medium":
        return <Badge variant="secondary">中</Badge>;
      case "low":
        return <Badge variant="outline">低</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ナレッジデータベース</h1>
      </div>

      {/* 大きな検索ボックス */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ナレッジデータベースやお問い合わせ内容を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>

            {/* フィルター */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="カテゴリー" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのカテゴリー</SelectItem>
                  <SelectItem value="請求・支払い">請求・支払い</SelectItem>
                  <SelectItem value="アカウント管理">アカウント管理</SelectItem>
                  <SelectItem value="料金・プラン">料金・プラン</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての状態</SelectItem>
                  <SelectItem value="resolved">解決済み</SelectItem>
                  <SelectItem value="follow_up">フォローアップ</SelectItem>
                  <SelectItem value="pending">保留中</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || selectedTags.length > 0 || categoryFilter !== "all" || statusFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters} className="gap-1">
                  <Filter className="h-4 w-4" />
                  フィルタークリア
                </Button>
              )}
            </div>

            {/* タグフィルター */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">タグでフィルター</span>
                {selectedTags.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedTags.length}個選択中
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      selectedTags.includes(tag.name)
                        ? 'border-transparent'
                        : 'hover:bg-accent'
                    }`}
                    style={selectedTags.includes(tag.name) ? {
                      backgroundColor: tag.color,
                      color: isLightColor(tag.color) ? "#000000" : "#FFFFFF",
                      borderColor: 'transparent'
                    } : {}}
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    {selectedTags.includes(tag.name) && "✓ "}
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タブコンテンツ */}
      <Tabs defaultValue="knowledge" className="space-y-6">
        <TabsList>
          <TabsTrigger value="knowledge" className="gap-2">
            <Database className="h-4 w-4" />
            ナレッジデータベース
          </TabsTrigger>
          <TabsTrigger value="inquiries" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            お客様お問い合わせ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>ナレッジデータベース</CardTitle>
              <CardDescription>
                {filteredKnowledge.length}件 / 全{knowledgeData.length}件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タイトル</TableHead>
                    <TableHead>カテゴリー</TableHead>
                    <TableHead>タグ</TableHead>
                    <TableHead>更新日時</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKnowledge.length > 0 ? (
                    filteredKnowledge.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.lastUpdated)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleKnowledgeView(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        <div className="flex flex-col items-center">
                          <Search className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            検索条件に一致するナレッジが見つかりません
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquiries">
          <Card>
            <CardHeader>
              <CardTitle>お客様お問い合わせ</CardTitle>
              <CardDescription>
                {filteredInquiries.length}件 / 全{customerInquiries.length}件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">顧客</TableHead>
                    <TableHead>お問い合わせ要約</TableHead>
                    <TableHead>カテゴリー</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>優先度</TableHead>
                    <TableHead>最終更新日時</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.length > 0 ? (
                    filteredInquiries.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {item.customer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{item.customer.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {item.summary}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.callDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleInquiryView(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <div className="flex flex-col items-center">
                          <Search className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            検索条件に一致するお問い合わせが見つかりません
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ナレッジ詳細ダイアログ */}
      <Dialog open={isKnowledgeDialogOpen} onOpenChange={setIsKnowledgeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedKnowledge?.title}
            </DialogTitle>
            <DialogDescription>
              カテゴリー: {selectedKnowledge?.category}
            </DialogDescription>
          </DialogHeader>
          {selectedKnowledge && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm leading-relaxed">{selectedKnowledge.content}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedKnowledge.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(selectedKnowledge.lastUpdated)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  関連度: {Math.round(selectedKnowledge.relevanceScore * 100)}%
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* お問い合わせ詳細ダイアログ */}
      <Dialog open={isInquiryDialogOpen} onOpenChange={setIsInquiryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedInquiry?.customer.name} のお問い合わせ
            </DialogTitle>
            <DialogDescription>
              {selectedInquiry && formatDate(selectedInquiry.callDate)} - 通話時間: {selectedInquiry?.duration}
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">顧客情報</span>
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{selectedInquiry.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{selectedInquiry.customer.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="text-sm">{selectedInquiry.customer.tenant}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">ステータス</span>
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">状態:</span>
                      {getStatusBadge(selectedInquiry.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">優先度:</span>
                      {getPriorityBadge(selectedInquiry.priority)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">カテゴリー:</span>
                      <Badge variant="outline">{selectedInquiry.category}</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-medium">お問い合わせ要約</span>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm leading-relaxed">{selectedInquiry.summary}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-medium">関連タグ</span>
                <div className="flex flex-wrap gap-2">
                  {selectedInquiry.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}