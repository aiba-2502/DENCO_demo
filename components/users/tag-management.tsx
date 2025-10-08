import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Sample tag data - would be fetched from API in real app
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

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagementProps {
  onTagsUpdate: (tags: Tag[]) => void;
}

export default function TagManagement({ onTagsUpdate }: TagManagementProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<Omit<Tag, "id">>({
    name: "",
    color: "#000000",
  });

  const handleAddTag = () => {
    const newTag: Tag = {
      id: `tag-${tags.length + 1}`,
      ...formData,
    };
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    onTagsUpdate(updatedTags);
    setIsAddDialogOpen(false);
    setFormData({ name: "", color: "#000000" });
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;

    const updatedTags = tags.map((tag) =>
      tag.id === editingTag.id ? { ...tag, ...formData } : tag
    );
    setTags(updatedTags);
    onTagsUpdate(updatedTags);
    setIsEditDialogOpen(false);
    setEditingTag(null);
    setFormData({ name: "", color: "#000000" });
  };

  const handleDeleteTag = (tagId: string) => {
    const updatedTags = tags.filter((tag) => tag.id !== tagId);
    setTags(updatedTags);
    onTagsUpdate(updatedTags);
  };

  const TagForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          タグ名
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="color" className="text-right">
          色
        </Label>
        <Input
          id="color"
          type="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="col-span-3 h-10"
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>タグ管理</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              新規タグ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規タグ作成</DialogTitle>
              <DialogDescription>
                タグの名前と色を設定してください
              </DialogDescription>
            </DialogHeader>
            <TagForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddTag}>作成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between py-1 px-2 border rounded"
            >
              <div className="flex items-center gap-2">
                <Badge
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
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEditTag(tag)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Trash className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>タグの削除</AlertDialogTitle>
                      <AlertDialogDescription>
                        {tag.name}を削除してもよろしいですか？この操作は取り消せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        削除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

          {tags.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              タグが登録されていません
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグの編集</DialogTitle>
            <DialogDescription>
              タグの情報を編集してください
            </DialogDescription>
          </DialogHeader>
          <TagForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateTag}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Helper function to determine if a color is light
function isLightColor(color: string) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 155;
}