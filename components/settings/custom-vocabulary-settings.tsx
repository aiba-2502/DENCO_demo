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
import { toast } from "sonner";
import { Plus, Upload, Download, Trash, Search } from "lucide-react";

interface VocabularyWord {
  id: string;
  word: string;
  pronunciation: string;
  category: "manual" | "imported";
  createdAt: string;
}

const initialVocabulary: VocabularyWord[] = [
  {
    id: "1",
    word: "株式会社",
    pronunciation: "カブシキガイシャ",
    category: "manual",
    createdAt: "2025-04-30T10:00:00"
  },
  {
    id: "2",
    word: "請求書",
    pronunciation: "セイキュウショ",
    category: "imported",
    createdAt: "2025-04-30T10:05:00"
  },
  {
    id: "3",
    word: "見積書",
    pronunciation: "ミツモリショ",
    category: "imported",
    createdAt: "2025-04-30T10:10:00"
  }
];

export default function CustomVocabularySettings() {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>(initialVocabulary);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newPronunciation, setNewPronunciation] = useState("");

  const filteredVocabulary = vocabulary.filter(item =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.pronunciation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddWord = () => {
    if (!newWord.trim() || !newPronunciation.trim()) {
      toast.error("単語と読み方を入力してください");
      return;
    }

    const newVocabWord: VocabularyWord = {
      id: Date.now().toString(),
      word: newWord.trim(),
      pronunciation: newPronunciation.trim(),
      category: "manual",
      createdAt: new Date().toISOString()
    };

    setVocabulary([...vocabulary, newVocabWord]);
    setNewWord("");
    setNewPronunciation("");
    setIsAddDialogOpen(false);
    toast.success("単語を追加しました");
  };

  const handleDeleteWord = (id: string) => {
    setVocabulary(vocabulary.filter(item => item.id !== id));
    toast.success("単語を削除しました");
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const importedWords: VocabularyWord[] = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const [word, pronunciation] = lines[i].split(',').map(s => s.trim().replace(/"/g, ''));
          if (word && pronunciation) {
            importedWords.push({
              id: `imported-${Date.now()}-${i}`,
              word,
              pronunciation,
              category: "imported",
              createdAt: new Date().toISOString()
            });
          }
        }

        setVocabulary([...vocabulary, ...importedWords]);
        toast.success(`${importedWords.length}個の単語をインポートしました`);
      } catch (error) {
        toast.error("CSVファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['単語', '読み方', 'カテゴリ', '作成日時'],
      ...vocabulary.map(item => [
        item.word,
        item.pronunciation,
        item.category === "manual" ? "手動登録" : "インポート",
        new Date(item.createdAt).toLocaleString('ja-JP')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `custom_vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("CSVファイルをエクスポートしました");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>カスタム語彙管理</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  単語追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規単語追加</DialogTitle>
                  <DialogDescription>
                    音声認識の精度向上のため、専門用語や固有名詞を登録
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="word">単語</Label>
                    <Input
                      id="word"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="例: 株式会社"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pronunciation">読み方</Label>
                    <Input
                      id="pronunciation"
                      value={newPronunciation}
                      onChange={(e) => setNewPronunciation(e.target.value)}
                      placeholder="例: カブシキガイシャ"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleAddWord}>追加</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex gap-1">
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                style={{ display: 'none' }}
                id="csv-import"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => document.getElementById('csv-import')?.click()}
              >
                <Upload className="h-4 w-4" />
                インポート
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4" />
                エクスポート
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="単語または読み方で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>単語</TableHead>
                  <TableHead>読み方</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVocabulary.length > 0 ? (
                  filteredVocabulary.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.word}</TableCell>
                      <TableCell>{item.pronunciation}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>単語の削除</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{item.word}」を削除してもよろしいですか？この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteWord(item.id)}
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <Search className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {searchTerm ? "検索条件に一致する単語がありません" : "登録された単語がありません"}
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
    </div>
  );
}