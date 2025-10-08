"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Search, Send, Download, Eye, FileText } from "lucide-react";
import { Label } from "../ui/label";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "../date-range-picker";
import { Checkbox } from "../ui/checkbox";

// サンプル顧客データ
const customers = [
  {
    id: "user-1",
    name: "山田 太郎",
    faxNumber: "03-1234-5678",
    tenant: "株式会社ABC",
  },
  {
    id: "user-2",
    name: "佐藤 花子",
    faxNumber: "03-8765-4321",
    tenant: "株式会社ABC",
  },
  {
    id: "user-3",
    name: "鈴木 一郎",
    faxNumber: "03-2345-6789",
    tenant: "株式会社XYZ",
  },
];

// Get first line of OCR text
const getOcrSummary = (text: string) => {
  if (!text) return "";
  const firstLine = text.split('\n')[0];
  return firstLine.length > 30 ? firstLine.substring(0, 30) + "..." : firstLine;
};

const faxDocuments = [
  {
    id: "fax-1",
    direction: "inbound",
    sender: {
      name: "山田 太郎",
      number: "03-1234-5678",
    },
    receiver_number: "03-8765-4321",
    status: "completed",
    created_at: "2025-04-30T10:15:00",
    has_ocr: true,
    preview_url: "/preview/fax-1.pdf",
    download_url: "/download/fax-1.pdf",
    ocr_text: "請求書\n株式会社ABC御中\n合計金額：123,456円\n..."
  },
  {
    id: "fax-2",
    direction: "outbound",
    sender_number: "03-8765-4321",
    receiver: {
      name: "佐藤 花子",
      number: "03-1234-5678",
    },
    status: "pending",
    created_at: "2025-04-30T11:30:00",
    has_ocr: false,
    preview_url: "/preview/fax-2.pdf",
    download_url: "/download/fax-2.pdf"
  },
  {
    id: "fax-3",
    direction: "inbound",
    sender: {
      name: "鈴木 一郎",
      number: "03-2345-6789",
    },
    receiver_number: "03-8765-4321",
    status: "completed",
    created_at: "2025-04-30T12:45:00",
    has_ocr: true,
    preview_url: "/preview/fax-3.pdf",
    download_url: "/download/fax-3.pdf",
    ocr_text: "見積書\n工事名：本社ビル改修工事\n..."
  },
];

export default function FaxManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [isNewFaxDialogOpen, setIsNewFaxDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedFax, setSelectedFax] = useState<typeof faxDocuments[0] | null>(null);
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [timeRange, setTimeRange] = useState<{start: string, end: string}>({
    start: "00:00",
    end: "23:59"
  });

  const filterDocuments = (docs: typeof faxDocuments, direction: "inbound" | "outbound") => {
    return docs.filter((doc) => {
      const matchesSearch =
        searchTerm === "" ||
        (direction === "inbound" && doc.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (direction === "inbound" && doc.sender?.number?.includes(searchTerm)) ||
        (direction === "outbound" && doc.receiver?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (direction === "outbound" && doc.receiver?.number?.includes(searchTerm));

      const matchesDirection = doc.direction === direction;
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

      const docDate = new Date(doc.created_at);
      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        (docDate >= dateRange.from &&
          docDate <= new Date(dateRange.to.getTime() + 86400000));

      const docTime = docDate.toTimeString().substring(0, 5);
      const matchesTimeRange = 
        docTime >= timeRange.start && 
        docTime <= timeRange.end;

      return matchesSearch && matchesDirection && matchesStatus && matchesDateRange && matchesTimeRange;
    });
  };

  const filteredCustomers = customers.filter(customer => {
    return customerSearchTerm === "" ||
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.faxNumber.includes(customerSearchTerm);
  });

  const inboundDocuments = filterDocuments(faxDocuments, "inbound");
  const outboundDocuments = filterDocuments(faxDocuments, "outbound");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendFax = async () => {
    const recipients = customers.filter(c => selectedCustomers.includes(c.id));
    console.log("送信先:", recipients, "ファイル:", selectedFile);
    setIsNewFaxDialogOpen(false);
    setSelectedFile(null);
    setSelectedCustomers([]);
  };

  const handlePreview = (doc: typeof faxDocuments[0]) => {
    setSelectedFax(doc);
    setIsPreviewDialogOpen(true);
  };

  const handleDownload = (doc: typeof faxDocuments[0]) => {
    window.open(doc.download_url, '_blank');
  };

  const handleViewOcr = (doc: typeof faxDocuments[0]) => {
    setSelectedFax(doc);
    setIsOcrDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const renderInboundFaxTable = (documents: typeof faxDocuments) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>送信元</TableHead>
          <TableHead>送信者名</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>受信日時</TableHead>
          <TableHead>内容</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length > 0 ? (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.sender?.number}</TableCell>
              <TableCell>{doc.sender?.name}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    doc.status === "completed"
                      ? "default"
                      : doc.status === "pending"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {doc.status === "completed" ? "完了" :
                   doc.status === "pending" ? "処理中" : "失敗"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(doc.created_at)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {doc.has_ocr && getOcrSummary(doc.ocr_text)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="プレビュー"
                    onClick={() => handlePreview(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="ダウンロード"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {doc.has_ocr && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      title="OCRテキスト"
                      onClick={() => handleViewOcr(doc)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6">
              <div className="flex flex-col items-center">
                <Search className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">検索条件に一致するFAX文書がありません</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderOutboundFaxTable = (documents: typeof faxDocuments) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>送信先</TableHead>
          <TableHead>宛先名</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>送信日時</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length > 0 ? (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.receiver?.number}</TableCell>
              <TableCell>{doc.receiver?.name}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    doc.status === "completed"
                      ? "default"
                      : doc.status === "pending"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {doc.status === "completed" ? "完了" :
                   doc.status === "pending" ? "処理中" : "失敗"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(doc.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="プレビュー"
                    onClick={() => handlePreview(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="ダウンロード"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6">
              <div className="flex flex-col items-center">
                <Search className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">検索条件に一致するFAX文書がありません</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">FAX管理</h1>
        <Dialog open={isNewFaxDialogOpen} onOpenChange={setIsNewFaxDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Send className="h-4 w-4" />
              FAX送信
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>新規FAX送信</DialogTitle>
              <DialogDescription>
                送信するPDFファイルをアップロード
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file">ファイル</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>送信先の選択</Label>
                  <Input
                    placeholder="顧客を検索..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
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
                          <TableHead>FAX番号</TableHead>
                          <TableHead>テナント</TableHead>
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
                            <TableCell>{customer.faxNumber}</TableCell>
                            <TableCell>{customer.tenant}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewFaxDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleSendFax}
                disabled={!selectedFile || selectedCustomers.length === 0}
              >
                送信
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="名前またはFAX番号で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "completed" | "pending" | "failed") => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="状態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての状態</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="pending">処理中</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
            />

            <div className="flex items-center space-x-2">
              <Input
                type="time"
                value={timeRange.start}
                onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full"
              />
              <span>～</span>
              <Input
                type="time"
                value={timeRange.end}
                onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="inbound">
        <TabsList>
          <TabsTrigger value="inbound">受信FAX</TabsTrigger>
          <TabsTrigger value="outbound">送信FAX</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbound">
          <Card>
            <CardHeader>
              <CardTitle>受信FAX一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {renderInboundFaxTable(inboundDocuments)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outbound">
          <Card>
            <CardHeader>
              <CardTitle>送信FAX一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {renderOutboundFaxTable(outboundDocuments)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* プレビューダイアログ */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>FAXプレビュー</DialogTitle>
          </DialogHeader>
          <div className="aspect-[1/1.4] bg-muted rounded-lg">
            {selectedFax && (
              <iframe
                src={selectedFax.preview_url}
                className="w-full h-full rounded-lg"
                title="FAX Preview"
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OCRテキストダイアログ */}
      <Dialog open={isOcrDialogOpen} onOpenChange={setIsOcrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OCRテキスト</DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm">
              {selectedFax?.ocr_text}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOcrDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}