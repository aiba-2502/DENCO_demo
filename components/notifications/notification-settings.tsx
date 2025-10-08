"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Save, Plus, Mail, MessageSquare, MessagesSquare, Phone, Clock, Edit, Trash, Calendar, Users, Search } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  email: string;
  chatworkId?: string;
  lineId?: string;
  phoneNumber?: string;
}

interface NotificationDestination {
  type: "staff" | "manual";
  value: string;
  staffId?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
}

interface KeywordCondition {
  mode: "list" | "logical";
  keywords: Array<{
    id: string;
    word: string;
    operator: "and" | "or";
  }>;
}

interface NotificationRule {
  id: string;
  name: string;
  conditions: {
    type: ("call" | "fax")[];
    target: {
      type: "phone" | "customer";
      value: string[];
    };
    keywords?: KeywordCondition;
  };
  actions: {
    type: "email" | "chatwork" | "line" | "phone";
    config: {
      destination: NotificationDestination;
      template?: string;
      templateId?: string;
      useSummary?: boolean;
      customMessage?: string;
    };
  }[];
  enabled: boolean;
}

// Sample customers for selection
const sampleCustomers = [
  { id: "1", name: "山田太郎", phone: "090-1234-5678" },
  { id: "2", name: "佐藤花子", phone: "090-8765-4321" },
  { id: "3", name: "鈴木一郎", phone: "090-2345-6789" },
];

// Sample notification templates
const initialTemplates: NotificationTemplate[] = [
  {
    id: "template-1",
    name: "着信通知（標準）",
    content: "着信がありました\n発信者: {caller}\n番号: {number}\n時刻: {time}",
    variables: ["caller", "number", "time"],
    createdAt: "2025-04-30T10:00:00"
  },
  {
    id: "template-2", 
    name: "FAX受信通知",
    content: "新しいFAXを受信しました\n送信元: {sender}\n受信時刻: {time}\nページ数: {pages}",
    variables: ["sender", "time", "pages"],
    createdAt: "2025-04-30T10:05:00"
  },
  {
    id: "template-3",
    name: "緊急通知",
    content: "🚨 緊急通知 🚨\n{type}: {details}\n至急対応をお願いします。",
    variables: ["type", "details"],
    createdAt: "2025-04-30T10:10:00"
  }
];

const initialRules: NotificationRule[] = [
  {
    id: "rule-1",
    name: "着信通知",
    conditions: {
      type: ["call"],
      target: {
        type: "phone",
        value: ["090-1234-5678", "090-8765-4321"]
      },
      keywords: {
        mode: "logical",
        keywords: [
          { id: "kw-1", word: "緊急", operator: "or" },
          { id: "kw-2", word: "至急", operator: "and" }
        ]
      }
    },
    actions: [
      {
        type: "email",
        config: {
          destination: { type: "manual", value: "support@example.com" },
          templateId: "template-1",
          useSummary: false
        }
      }
    ],
    enabled: true
  },
  {
    id: "rule-2",
    name: "FAX受信通知",
    conditions: {
      type: ["fax"],
      target: {
        type: "customer",
        value: ["1", "2"]
      },
      keywords: {
        mode: "list",
        keywords: [
          { id: "kw-3", word: "請求書", operator: "or" },
          { id: "kw-4", word: "見積書", operator: "or" }
        ]
      }
    },
    actions: [
      {
        type: "chatwork",
        config: {
          destination: { type: "manual", value: "12345678" },
          templateId: "template-2",
          useSummary: true
        }
      }
    ],
    enabled: true
  }
];

const emptyRule: Omit<NotificationRule, "id"> = {
  name: "",
  conditions: {
    type: ["call"],
    target: {
      type: "phone",
      value: []
    }
  },
  actions: [
    {
      type: "email",
      config: {
        destination: { type: "manual", value: "" },
        templateId: "",
        useSummary: false,
        customMessage: ""
      }
    }
  ],
  enabled: true
};

export default function NotificationSettings() {
  const [rules, setRules] = useState<NotificationRule[]>(initialRules);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(initialTemplates);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStaffSelectionOpen, setIsStaffSelectionOpen] = useState(false);
  const [isTemplateManagementOpen, setIsTemplateManagementOpen] = useState(false);
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [currentActionIndex, setCurrentActionIndex] = useState<number>(0);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [formData, setFormData] = useState<Omit<NotificationRule, "id">>(emptyRule);
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    content: "",
    variables: [] as string[]
  });
  const [staff, setStaff] = useState<Staff[]>([
    {
      id: "staff-1",
      firstName: "太郎",
      lastName: "山田",
      department: "営業部",
      email: "taro.yamada@example.com",
      chatworkId: "12345678",
      lineId: "notify-token-123",
      phoneNumber: "090-1234-5678"
    },
    {
      id: "staff-2",
      firstName: "花子",
      lastName: "鈴木",
      department: "カスタマーサポート",
      email: "hanako.suzuki@example.com",
      chatworkId: "87654321",
      lineId: "notify-token-456",
      phoneNumber: "090-8765-4321"
    }
  ]);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordMode, setKeywordMode] = useState<"list" | "logical">("list");
  const [workingKeywords, setWorkingKeywords] = useState<Array<{
    id: string;
    word: string;
    operator: "and" | "or";
  }>>([{ id: "temp-1", word: "", operator: "or" }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // 1ページあたりの表示件数

  // ページネーション計算
  const totalPages = Math.ceil(rules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRules = rules.slice(startIndex, endIndex);

  // ページ変更時の処理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // ルール追加・編集・削除時にページをリセット
  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  const filteredStaff = staff.filter(member => {
    const fullName = `${member.lastName} ${member.firstName}`;
    return staffSearchTerm === "" ||
      fullName.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(staffSearchTerm.toLowerCase());
  });

  const handleStaffSelection = (staffId: string) => {
    const selectedStaff = staff.find(s => s.id === staffId);
    if (!selectedStaff) return;

    const currentAction = formData.actions[currentActionIndex];
    const value = currentAction.type === "email" ? selectedStaff.email :
                  currentAction.type === "chatwork" ? selectedStaff.chatworkId :
                  currentAction.type === "line" ? selectedStaff.lineId :
                  selectedStaff.phoneNumber;

    const newActions = [...formData.actions];
    newActions[currentActionIndex] = {
      ...currentAction,
      config: {
        ...currentAction.config,
        destination: { type: "staff", value: value || "", staffId }
      }
    };
    setFormData({ ...formData, actions: newActions });
    setIsStaffSelectionOpen(false);
    setStaffSearchTerm("");
  };

  const handleAddTemplate = () => {
    if (!templateFormData.name.trim() || !templateFormData.content.trim()) {
      toast.error("テンプレート名と内容を入力してください");
      return;
    }

    // Extract variables from template content
    const variableMatches = templateFormData.content.match(/\{([^}]+)\}/g);
    const variables = variableMatches ? 
      variableMatches.map(match => match.slice(1, -1)) : [];

    const newTemplate: NotificationTemplate = {
      id: `template-${Date.now()}`,
      name: templateFormData.name.trim(),
      content: templateFormData.content.trim(),
      variables: Array.from(new Set(variables)), // Remove duplicates
      createdAt: new Date().toISOString()
    };

    setTemplates([...templates, newTemplate]);
    setIsAddTemplateDialogOpen(false);
    setTemplateFormData({ name: "", content: "", variables: [] });
    toast.success("テンプレートを追加しました");
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      content: template.content,
      variables: template.variables
    });
    setIsEditTemplateDialogOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    if (!templateFormData.name.trim() || !templateFormData.content.trim()) {
      toast.error("テンプレート名と内容を入力してください");
      return;
    }

    // Extract variables from template content
    const variableMatches = templateFormData.content.match(/\{([^}]+)\}/g);
    const variables = variableMatches ? 
      variableMatches.map(match => match.slice(1, -1)) : [];

    const updatedTemplates = templates.map(template =>
      template.id === editingTemplate.id
        ? {
            ...template,
            name: templateFormData.name.trim(),
            content: templateFormData.content.trim(),
            variables: Array.from(new Set(variables))
          }
        : template
    );

    setTemplates(updatedTemplates);
    setIsEditTemplateDialogOpen(false);
    setEditingTemplate(null);
    setTemplateFormData({ name: "", content: "", variables: [] });
    toast.success("テンプレートを更新しました");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(template => template.id !== templateId));
    toast.success("テンプレートを削除しました");
  };

  const handleSaveSettings = async () => {
    try {
      toast.success("通知設定を保存しました");
    } catch (error) {
      toast.error("設定の保存に失敗しました");
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleAddRule = () => {
    const newRule: NotificationRule = {
      id: `rule-${rules.length + 1}`,
      ...formData
    };
    setRules([...rules, newRule]);
    setIsAddDialogOpen(false);
    setFormData(emptyRule);
    resetToFirstPage();
  };

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: rule.enabled
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;
    
    setRules(rules.map(rule =>
      rule.id === editingRule.id ? { ...rule, ...formData } : rule
    ));
    setIsEditDialogOpen(false);
    setEditingRule(null);
    setFormData(emptyRule);
    resetToFirstPage();
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
    // 削除後にページが空になる場合は前のページに移動
    const newTotalPages = Math.ceil((rules.length - 1) / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;

    const newKeyword = {
      id: `kw-${Date.now()}`,
      word: keywordInput.trim(),
      operator: "or" as const
    };

    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        keywords: {
          mode: "list",
          keywords: [...(prev.conditions.keywords?.keywords || []), newKeyword]
        }
      }
    }));
    setKeywordInput("");
  };

  const handleAddWorkingKeyword = (operator: "and" | "or") => {
    const newKeyword = {
      id: `temp-${Date.now()}`,
      word: "",
      operator: operator
    };
    setWorkingKeywords([...workingKeywords, newKeyword]);
  };

  const handleConfirmKeywords = () => {
    const validKeywords = workingKeywords.filter(kw => kw.word.trim());
    if (validKeywords.length === 0) return;

    // キーワードの演算子を設定
    const finalKeywords = validKeywords.map((kw, index) => ({
      id: `kw-${Date.now()}-${index}`,
      word: kw.word.trim(),
      operator: (kw.operator === "and" || kw.operator === "or") ? kw.operator : "or"
    }));

    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        keywords: {
          mode: "logical",
          keywords: finalKeywords
        }
      }
    }));

    // 作業中のキーワードをリセット
    setWorkingKeywords([{ id: "temp-1", word: "", operator: "or" }]);
    toast.success("キーワード条件を確定しました");
  };

  const handleRemoveKeyword = (keywordId: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        keywords: {
          mode: prev.conditions.keywords?.mode || "list",
          keywords: prev.conditions.keywords?.keywords.filter(k => k.id !== keywordId) || []
        }
      }
    }));
  };

  const handleUpdateKeywordOperator = (keywordId: string, operator: "and" | "or") => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        keywords: {
          mode: prev.conditions.keywords?.mode || "list",
          keywords: prev.conditions.keywords?.keywords.map(k =>
            k.id === keywordId ? { ...k, operator } : k
          ) || []
        }
      }
    }));
  };

  const RuleForm = () => {
    return (
    <>
      <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">ルール名</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="通知ルールの名前"
        />
      </div>

      <div className="space-y-4">
        <Label>通知条件</Label>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="type" className="text-sm">イベントタイプ</Label>
            <Select
              value={formData.conditions.type[0]}
              onValueChange={(value: "call" | "fax") => 
                setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    type: [value]
                  }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">通話</SelectItem>
                <SelectItem value="fax">FAX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>対象の選択</Label>
            <RadioGroup
              value={formData.conditions.target.type}
              onValueChange={(value: "phone" | "customer") => {
                setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    target: {
                      type: value,
                      value: []
                    }
                  }
                });
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="target-phone" />
                <Label htmlFor="target-phone">着信番号で指定</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="target-customer" />
                <Label htmlFor="target-customer">顧客で指定</Label>
              </div>
            </RadioGroup>

            {formData.conditions.target.type === "phone" ? (
              <div className="space-y-2">
                <Input
                  placeholder="電話番号を入力..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.currentTarget;
                      if (input.value) {
                        setFormData(prev => ({
                          ...prev,
                          conditions: {
                            ...prev.conditions,
                            target: {
                              ...prev.conditions.target,
                              value: [...prev.conditions.target.value, input.value]
                            }
                          }
                        }));
                        input.value = "";
                      }
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {formData.conditions.target.value.map((phone) => (
                    <Badge
                      key={phone}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          conditions: {
                            ...prev.conditions,
                            target: {
                              ...prev.conditions.target,
                              value: prev.conditions.target.value.filter(p => p !== phone)
                            }
                          }
                        }));
                      }}
                    >
                      {phone} ✕
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {sampleCustomers.map(customer => (
                  <div key={customer.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`customer-${customer.id}`}
                      checked={formData.conditions.target.value.includes(customer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              target: {
                                ...prev.conditions.target,
                                value: [...prev.conditions.target.value, customer.id]
                              }
                            }
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              target: {
                                ...prev.conditions.target,
                                value: prev.conditions.target.value.filter(id => id !== customer.id)
                              }
                            }
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`customer-${customer.id}`}>
                      {customer.name} ({customer.phone})
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>キーワード条件</Label>
            <div className="space-y-2">
              <Label className="text-sm">キーワードモード</Label>
              <RadioGroup
                value={keywordMode}
                onValueChange={(value: "list" | "logical") => {
                  setKeywordMode(value);
                  // モード変更時に作業中のキーワードをリセット
                  setWorkingKeywords([{ id: "temp-1", word: "", operator: "or" }]);
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="list" id="mode-list" />
                  <Label htmlFor="mode-list" className="text-sm">
                    リスト形式（複数キーワードのいずれかに一致）
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="logical" id="mode-logical" />
                  <Label htmlFor="mode-logical" className="text-sm">
                    論理結合（AND/ORで詳細な条件設定）
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* リスト形式の入力 */}
            {keywordMode === "list" && (
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="キーワードを入力..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddKeyword();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddKeyword}
                  disabled={!keywordInput.trim()}
                >
                  追加
                </Button>
              </div>
            )}
            
            {/* 論理結合モード専用の作業エリア */}
            {keywordMode === "logical" && (
              <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
                <Label className="text-sm font-medium">キーワード条件の作成</Label>
                {workingKeywords.map((keyword, index) => (
                  <div key={keyword.id} className="flex items-center gap-2">
                    {index > 0 && (
                      <Select
                        value={keyword.operator}
                        onValueChange={(value: "and" | "or") => {
                          const newWorkingKeywords = [...workingKeywords];
                          newWorkingKeywords[index] = { ...keyword, operator: value };
                          setWorkingKeywords(newWorkingKeywords);
                        }}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="and">AND</SelectItem>
                          <SelectItem value="or">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      value={keyword.word}
                      onChange={(e) => {
                        const newWorkingKeywords = [...workingKeywords];
                        newWorkingKeywords[index] = { ...keyword, word: e.target.value };
                        setWorkingKeywords(newWorkingKeywords);
                      }}
                      placeholder="キーワードを入力..."
                      className="flex-1"
                    />
                    {workingKeywords.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setWorkingKeywords(workingKeywords.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWorkingKeyword("and")}
                    disabled={!workingKeywords[workingKeywords.length - 1]?.word.trim()}
                  >
                    AND
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWorkingKeyword("or")}
                    disabled={!workingKeywords[workingKeywords.length - 1]?.word.trim()}
                  >
                    OR
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleConfirmKeywords}
                    disabled={!workingKeywords.some(kw => kw.word.trim())}
                    className="ml-auto"
                  >
                    キーワード条件を確定
                  </Button>
                </div>
              </div>
            )}
            
            {/* 確定済みキーワード条件の共通表示 */}
            {formData.conditions.keywords?.keywords && formData.conditions.keywords.keywords.length > 0 && (
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-sm font-medium">確定済みキーワード条件</Label>
                {formData.conditions.keywords.mode === "list" ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.conditions.keywords.keywords.map((keyword) => (
                      <Badge
                        key={keyword.id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveKeyword(keyword.id)}
                      >
                        {keyword.word} ✕
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm">
                    {formData.conditions.keywords.keywords.map((kw, index) => 
                      index === 0 ? kw.word : ` ${kw.operator.toUpperCase()} ${kw.word}`
                    ).join("")}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        keywords: { mode: keywordMode, keywords: [] }
                      }
                    }));
                    setWorkingKeywords([{ id: "temp-1", word: "", operator: "or" }]);
                  }}
                >
                  条件をリセット
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>通知アクション</Label>
        {formData.actions.map((action, index) => (
          <div key={index} className="grid gap-4 border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <Select
                value={action.type}
                onValueChange={(value: "email" | "chatwork" | "line" | "phone") => {
                  const newActions = [...formData.actions];
                  newActions[index] = {
                    type: value,
                    config: {
                      destination: { type: "manual", value: "" },
                      template: ""
                    }
                  };
                  setFormData({ ...formData, actions: newActions });
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">メール</SelectItem>
                  <SelectItem value="chatwork">ChatWork</SelectItem>
                  <SelectItem value="line">LINE</SelectItem>
                  <SelectItem value="phone">電話</SelectItem>
                </SelectContent>
              </Select>

              {formData.actions.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newActions = formData.actions.filter((_, i) => i !== index);
                    setFormData({ ...formData, actions: newActions });
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">送信先</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentActionIndex(index);
                    setIsStaffSelectionOpen(true);
                  }}
                  className="gap-1"
                >
                  <Users className="h-4 w-4" />
                  スタッフを選択
                </Button>
                <Select
                  value={action.config.destination.type}
                  onValueChange={(value: "staff" | "manual") => {
                    const newActions = [...formData.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        destination: { type: value, value: "" }
                      }
                    };
                    setFormData({ ...formData, actions: newActions });
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">スタッフ</SelectItem>
                    <SelectItem value="manual">手動入力</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {action.config.destination.type === "staff" ? (
                <Select
                  value={action.config.destination.staffId || ""}
                  onValueChange={(staffId) => {
                    const selectedStaff = staff.find(s => s.id === staffId);
                    if (!selectedStaff) return;

                    const value = action.type === "email" ? selectedStaff.email :
                                action.type === "chatwork" ? selectedStaff.chatworkId :
                                action.type === "line" ? selectedStaff.lineId :
                                selectedStaff.phoneNumber;

                    const newActions = [...formData.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        destination: { type: "staff", value: value || "", staffId }
                      }
                    };
                    setFormData({ ...formData, actions: newActions });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="スタッフを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.lastName} {s.firstName} ({s.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={action.config.destination.value}
                  onChange={(e) => {
                    const newActions = [...formData.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        destination: { type: "manual", value: e.target.value }
                      }
                    };
                    setFormData({ ...formData, actions: newActions });
                  }}
                  placeholder={
                    action.type === "email" ? "メールアドレス" :
                    action.type === "chatwork" ? "ChatWork ID" :
                    action.type === "line" ? "LINE Notify トークン" :
                    "電話番号"
                  }
                />
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">通知内容</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateManagementOpen(true)}
                  className="gap-1"
                >
                  <Edit className="h-4 w-4" />
                  テンプレート管理
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">テンプレート選択</Label>
                  <Select
                    value={action.config.templateId || ""}
                    onValueChange={(templateId) => {
                      const newActions = [...formData.actions];
                      newActions[index] = {
                        ...action,
                        config: { ...action.config, templateId }
                      };
                      setFormData({ ...formData, actions: newActions });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="テンプレートを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`summary-${index}`}
                    checked={action.config.useSummary || false}
                    onCheckedChange={(checked) => {
                      const newActions = [...formData.actions];
                      newActions[index] = {
                        ...action,
                        config: { ...action.config, useSummary: checked as boolean }
                      };
                      setFormData({ ...formData, actions: newActions });
                    }}
                  />
                  <Label htmlFor={`summary-${index}`} className="text-sm">
                    要約を送信（GPTで通話内容を要約）
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">カスタムメッセージ（任意）</Label>
                  <Textarea
                    value={action.config.customMessage || ""}
                    onChange={(e) => {
                      const newActions = [...formData.actions];
                      newActions[index] = {
                        ...action,
                        config: { ...action.config, customMessage: e.target.value }
                      };
                      setFormData({ ...formData, actions: newActions });
                    }}
                    placeholder="追加のメッセージがあれば入力..."
                    rows={2}
                  />
                </div>

                {/* Template preview */}
                {action.config.templateId && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-xs text-muted-foreground">プレビュー:</Label>
                    <div className="text-sm mt-1">
                    {templates.find(t => t.id === action.config.templateId)?.content}
                  </div>
                  {(templates.find(t => t.id === action.config.templateId)?.variables.length || 0) > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      利用可能な変数: {templates.find(t => t.id === action.config.templateId)?.variables.map(v => `{${v}}`).join(", ")}
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => {
            setFormData({
              ...formData,
              actions: [
                ...formData.actions,
                {
                  type: "email",
                  config: {
                    destination: { type: "manual", value: "" },
                    template: ""
                  }
                }
              ]
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          通知アクションを追加
        </Button>
      </div>
    </div>
    </>
    );
  };

  const TemplateForm = () => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">テンプレート名</Label>
        <Input
          id="template-name"
          value={templateFormData.name}
          onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
          placeholder="テンプレートの名前"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-content">テンプレート内容</Label>
        <Textarea
          id="template-content"
          value={templateFormData.content}
          onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
          placeholder="通知メッセージのテンプレート&#10;変数は {変数名} の形式で記述"
          rows={6}
        />
        <div className="text-xs text-muted-foreground">
          利用可能な変数例: {"{caller}"}, {"{number}"}, {"{time}"}, {"{sender}"}, {"{details}"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">通知設定</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              新規ルール
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規通知ルール</DialogTitle>
              <DialogDescription>
                通知ルールの条件とアクションを設定
              </DialogDescription>
            </DialogHeader>
            <RuleForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddRule}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>通知ルール一覧</CardTitle>
            <div className="text-sm text-muted-foreground">
              {rules.length}件のルール
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto max-h-[600px] space-y-4">
            {currentRules.map((rule) => (
            <div key={rule.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{rule.name}</h3>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "有効" : "無効"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {rule.conditions.type.includes("call") && <Phone className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditRule(rule)}
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
                        <AlertDialogTitle>通知ルールの削除</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{rule.name}」を削除してもよろしいですか？この操作は取り消せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          削除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">条件:</div>
                <div className="text-sm text-muted-foreground">
                  <div>
                    {rule.conditions.target.type === "phone" ? (
                      <>
                        着信番号: {rule.conditions.target.value.join(", ")}
                      </>
                    ) : (
                      <>
                        顧客: {rule.conditions.target.value.map(id => 
                          sampleCustomers.find(c => c.id === id)?.name
                        ).join(", ")}
                      </>
                    )}
                  </div>
                  {rule.conditions.keywords && (
                    <div>
                      キーワード ({rule.conditions.keywords.mode === "list" ? "リスト" : "論理結合"}): 
                      {rule.conditions.keywords.mode === "list" ? (
                        <span> {rule.conditions.keywords.keywords.map(kw => kw.word).join(", ")}</span>
                      ) : (
                        <span> {rule.conditions.keywords.keywords.map((kw, index) => 
                          index === 0 ? kw.word : ` ${kw.operator.toUpperCase()} ${kw.word}`
                        ).join("")}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-sm font-medium">通知アクション:</div>
                <div className="grid gap-2">
                  {rule.actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {action.type === "email" && <Mail className="h-4 w-4" />}
                      {action.type === "chatwork" && <MessageSquare className="h-4 w-4" />}
                      {action.type === "line" && <MessagesSquare className="h-4 w-4" />}
                      {action.type === "phone" && <Phone className="h-4 w-4" />}
                      <span className="font-medium">
                        {action.type === "email" ? "メール" :
                         action.type === "chatwork" ? "ChatWork" :
                         action.type === "line" ? "LINE" : "電話"}:
                      </span>
                      <span className="text-muted-foreground">{action.config.destination.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                通知ルールが設定されていません
              </div>
            )}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(endIndex, rules.length)}件 / 全{rules.length}件
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>通知ルールの編集</DialogTitle>
            <DialogDescription>
              通知ルールの条件とアクションを編集
            </DialogDescription>
          </DialogHeader>
          <RuleForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateRule}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* スタッフ選択モーダル */}
      <Dialog open={isStaffSelectionOpen} onOpenChange={setIsStaffSelectionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>スタッフ選択</DialogTitle>
            <DialogDescription>
              通知先のスタッフを選択してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="名前、部署、メールで検索..."
                value={staffSearchTerm}
                onChange={(e) => setStaffSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {filteredStaff.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                      selectedStaffId === member.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedStaffId(member.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {member.lastName} {member.firstName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.department}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>{member.email}</div>
                        {member.phoneNumber && (
                          <div>{member.phoneNumber}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredStaff.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    検索条件に一致するスタッフがいません
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStaffSelectionOpen(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={() => handleStaffSelection(selectedStaffId)}
              disabled={!selectedStaffId}
            >
              選択
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* テンプレート管理モーダル */}
      <Dialog open={isTemplateManagementOpen} onOpenChange={setIsTemplateManagementOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>通知テンプレート管理</DialogTitle>
                <DialogDescription>
                  通知メッセージのテンプレートを管理します
                </DialogDescription>
              </div>
              <Dialog open={isAddTemplateDialogOpen} onOpenChange={setIsAddTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" />
                    新規テンプレート
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新規テンプレート作成</DialogTitle>
                    <DialogDescription>
                      通知メッセージのテンプレートを作成します
                    </DialogDescription>
                  </DialogHeader>
                  <TemplateForm />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddTemplateDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleAddTemplate}>作成</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      作成日: {new Date(template.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditTemplate(template)}
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
                
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm whitespace-pre-wrap">{template.content}</div>
                  </div>
                  {template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">変数:</span>
                      {template.variables.map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {"{" + variable + "}"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                テンプレートが登録されていません
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsTemplateManagementOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* テンプレート編集モーダル */}
      <Dialog open={isEditTemplateDialogOpen} onOpenChange={setIsEditTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレートの編集</DialogTitle>
            <DialogDescription>
              通知テンプレートを編集します
            </DialogDescription>
          </DialogHeader>
          <TemplateForm />
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