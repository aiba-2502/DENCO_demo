"use client";

import { useState, useEffect } from "react";

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Edit, Trash, Database } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function KnowledgeDatabase() {
  const [articles, setArticles] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("articles");
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    category_id: "",
    tag_ids: [] as string[],
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [articlesRes, inquiriesRes, categoriesRes, tagsRes] = await Promise.all([
        api.knowledge.articles.list({ limit: 100 }),
        api.knowledge.inquiries.list({ limit: 100 }),
        api.knowledge.categories.list(),
        api.tags.list(),
      ]);

      setArticles(articlesRes.articles);
      setInquiries(inquiriesRes.inquiries);
      setCategories(categoriesRes.categories);
      setTags(tagsRes.tags);
    } catch (error) {
      console.error('Failed to load knowledge data:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddArticle = async () => {
    try {
      await api.knowledge.articles.create(articleForm);
      toast.success('記事を追加しました');
      setIsAddArticleOpen(false);
      setArticleForm({ title: "", content: "", category_id: "", tag_ids: [] });
      loadAll();
    } catch (error: any) {
      toast.error('記事の追加に失敗しました', { description: error.message });
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await api.knowledge.articles.delete(articleId);
      toast.success('記事を削除しました');
      loadAll();
    } catch (error: any) {
      toast.error('記事の削除に失敗しました', { description: error.message });
    }
  };

  const filteredArticles = articles.filter(a =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInquiries = inquiries.filter(i =>
    i.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ナレッジデータベース</h1>
          <p className="text-muted-foreground">記事とお問い合わせ管理</p>
        </div>
        <Button onClick={() => setIsAddArticleOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          記事を追加
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="記事タイトルや内容で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="articles">ナレッジ記事 ({filteredArticles.length})</TabsTrigger>
          <TabsTrigger value="inquiries">お問い合わせ ({filteredInquiries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">読み込み中...</div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  記事がありません
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <div key={article.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{article.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {article.content}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {article.tags && article.tags.map((tag: any) => (
                              <Badge key={tag.id} style={{ backgroundColor: tag.color }}>
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleDeleteArticle(article.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquiries">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">読み込み中...</div>
              ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  お問い合わせがありません
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {inquiry.customer?.last_name} {inquiry.customer?.first_name}
                            </span>
                            <Badge variant={inquiry.status === 'resolved' ? 'default' : 'outline'}>
                              {inquiry.status}
                            </Badge>
                            <Badge variant="secondary">{inquiry.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{inquiry.summary}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(inquiry.created_at).toLocaleString('ja-JP')} · 
                            {inquiry.call_duration ? ` ${Math.floor(inquiry.call_duration / 60)}分` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 記事追加ダイアログ */}
      <Dialog open={isAddArticleOpen} onOpenChange={setIsAddArticleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ナレッジ記事を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>タイトル</Label>
              <Input
                value={articleForm.title}
                onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                placeholder="記事タイトル"
              />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea
                value={articleForm.content}
                onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                placeholder="記事の内容"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddArticleOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddArticle}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

