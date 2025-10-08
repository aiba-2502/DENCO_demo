"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, TestTube, CheckCircle, XCircle, Bot, Database } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface DifySettingsProps {
  settings: {
    difyAgentApiKey: string;
    difyAgentEndpoint: string;
    difyKnowledgeApiKey: string;
    difyKnowledgeEndpoint: string;
    summaryPrompt: string;
    openaiApiKey: string;
  };
  onSettingsChange: (settings: any) => void;
}

export default function DifySettings({ settings, onSettingsChange }: DifySettingsProps) {
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [isTestingKnowledge, setIsTestingKnowledge] = useState(false);
  const [agentConnectionStatus, setAgentConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [knowledgeConnectionStatus, setKnowledgeConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  const handleTestAgentConnection = async () => {
    if (!settings.difyAgentApiKey || !settings.difyAgentEndpoint) {
      toast.error("エージェントAPIキーとエンドポイントを入力してください");
      return;
    }

    setIsTestingAgent(true);
    setAgentConnectionStatus("idle");

    try {
      // Simulate API test - in real implementation, test Dify Agent API
      const endpoint = settings.difyAgentEndpoint?.toString() || '';
      if (!endpoint.includes('/v1')) {
        throw new Error("エンドポイントは /v1 を含む必要があります");
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success/failure for demo
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        setAgentConnectionStatus("success");
        toast.success("Dify エージェントAPI接続テスト成功");
      } else {
        setAgentConnectionStatus("error");
        toast.error("Dify エージェントAPI接続テスト失敗");
      }
    } catch (error) {
      setAgentConnectionStatus("error");
      toast.error(`エージェントAPI接続テスト失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsTestingAgent(false);
    }
  };

  const handleTestKnowledgeConnection = async () => {
    if (!settings.difyKnowledgeApiKey || !settings.difyKnowledgeEndpoint) {
      toast.error("ナレッジAPIキーとエンドポイントを入力してください");
      return;
    }

    setIsTestingKnowledge(true);
    setKnowledgeConnectionStatus("idle");

    try {
      // Simulate API test - in real implementation, test Dify Knowledge API
      const endpoint = settings.difyKnowledgeEndpoint?.toString() || '';
      if (!endpoint.includes('/v1')) {
        throw new Error("エンドポイントは /v1 を含む必要があります");
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success/failure for demo
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        setKnowledgeConnectionStatus("success");
        toast.success("Dify ナレッジAPI接続テスト成功");
      } else {
        setKnowledgeConnectionStatus("error");
        toast.error("Dify ナレッジAPI接続テスト失敗");
      }
    } catch (error) {
      setKnowledgeConnectionStatus("error");
      toast.error(`ナレッジAPI接続テスト失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsTestingKnowledge(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* エージェントAPI設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Dify エージェントAPI設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dify-agent-key">APIキー</Label>
            <Input
              id="dify-agent-key"
              type="password"
              value={settings.difyAgentApiKey}
              onChange={(e) => onSettingsChange({
                ...settings,
                difyAgentApiKey: e.target.value
              })}
              placeholder="app-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              エージェント用APIキー（app- で始まる）
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dify-agent-endpoint">エンドポイント</Label>
            <Input
              id="dify-agent-endpoint"
              value={settings.difyAgentEndpoint}
              onChange={(e) => onSettingsChange({
                ...settings,
                difyAgentEndpoint: e.target.value
              })}
              placeholder="https://api.dify.ai/v1"
            />
            <p className="text-xs text-muted-foreground">
              チャット応答生成用エンドポイント
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button
              onClick={handleTestAgentConnection}
              disabled={isTestingAgent || !settings.difyAgentApiKey || !settings.difyAgentEndpoint}
              variant="outline"
              className="gap-2"
            >
              {isTestingAgent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              エージェントAPI接続テスト
            </Button>

            {agentConnectionStatus === "success" && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                接続成功
              </Badge>
            )}

            {agentConnectionStatus === "error" && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                接続失敗
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 要約用設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            要約用設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-api-key">要約用OpenAI APIキー</Label>
            <Input
              id="openai-api-key"
              type="password"
              value={settings.openaiApiKey}
              onChange={(e) => onSettingsChange({
                ...settings,
                openaiApiKey: e.target.value
              })}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              ナレッジデータベース書き込み前のデータ成型用
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary-prompt">要約用プロンプト</Label>
            <Textarea
              id="summary-prompt"
              value={settings.summaryPrompt}
              onChange={(e) => onSettingsChange({
                ...settings,
                summaryPrompt: e.target.value
              })}
              placeholder="以下のテキストを要約してください..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              ナレッジデータベースに書き込む前のデータ成型用プロンプト
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ナレッジデータベースAPI設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dify ナレッジデータベースAPI設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dify-knowledge-key">APIキー</Label>
            <Input
              id="dify-knowledge-key"
              type="password"
              value={settings.difyKnowledgeApiKey}
              onChange={(e) => onSettingsChange({
                ...settings,
                difyKnowledgeApiKey: e.target.value
              })}
              placeholder="dataset-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              ナレッジデータベース用APIキー（dataset- で始まる）
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dify-knowledge-endpoint">エンドポイント</Label>
            <Input
              id="dify-knowledge-endpoint"
              value={settings.difyKnowledgeEndpoint}
              onChange={(e) => onSettingsChange({
                ...settings,
                difyKnowledgeEndpoint: e.target.value
              })}
              placeholder="https://api.dify.ai/v1"
            />
            <p className="text-xs text-muted-foreground">
              文書検索・RAG機能用エンドポイント
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button
              onClick={handleTestKnowledgeConnection}
              disabled={isTestingKnowledge || !settings.difyKnowledgeApiKey || !settings.difyKnowledgeEndpoint}
              variant="outline"
              className="gap-2"
            >
              {isTestingKnowledge ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              ナレッジAPI接続テスト
            </Button>

            {knowledgeConnectionStatus === "success" && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                接続成功
              </Badge>
            )}

            {knowledgeConnectionStatus === "error" && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                接続失敗
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 使用方法ガイド */}
      <Card>
        <CardHeader>
          <CardTitle>Dify連携ガイド</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">エージェントAPI:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>チャット応答の生成に使用</li>
              <li>APIキーは「app-」で始まる</li>
              <li>エンドポイント: /v1/chat-messages</li>
            </ul>
          </div>
          
          <div>
            <strong className="text-foreground">ナレッジデータベースAPI:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>文書検索・RAG機能に使用</li>
              <li>APIキーは「dataset-」で始まる</li>
              <li>エンドポイント: /v1/datasets</li>
            </ul>
          </div>

          <div>
            <strong className="text-foreground">セルフホスト版:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>独自ドメインのエンドポイントを指定可能</li>
              <li>例: https://your-domain.com/v1</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}