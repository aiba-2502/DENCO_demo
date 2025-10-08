"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, TestTube, CheckCircle, XCircle, Phone, Server } from "lucide-react";

interface AsteriskSettingsProps {
  settings: {
    host: string;
    port: string;
    username: string;
    password: string;
    realm: string;
    transport: string;
    codec: string;
    dtmfMode: string;
    enableReinvite: boolean;
    sessionTimers: string;
    callLimit: string;
    context: string;
    qualify: string;
    nat: string;
  };
  onSettingsChange: (settings: any) => void;
}

const TRANSPORT_OPTIONS = [
  { value: "udp", label: "UDP" },
  { value: "tcp", label: "TCP" },
  { value: "tls", label: "TLS" },
  { value: "ws", label: "WebSocket" },
  { value: "wss", label: "WebSocket Secure" },
];

const CODEC_OPTIONS = [
  { value: "ulaw", label: "G.711 μ-law (ulaw)" },
  { value: "alaw", label: "G.711 A-law (alaw)" },
  { value: "g722", label: "G.722 (g722)" },
  { value: "g729", label: "G.729 (g729)" },
  { value: "gsm", label: "GSM (gsm)" },
  { value: "opus", label: "Opus (opus)" },
];

const DTMF_OPTIONS = [
  { value: "rfc2833", label: "RFC2833" },
  { value: "inband", label: "Inband" },
  { value: "info", label: "SIP INFO" },
  { value: "auto", label: "Auto" },
];

const SESSION_TIMER_OPTIONS = [
  { value: "accept", label: "Accept" },
  { value: "originate", label: "Originate" },
  { value: "refuse", label: "Refuse" },
];

export default function AsteriskSettings({ settings, onSettingsChange }: AsteriskSettingsProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  const handleTestConnection = async () => {
    if (!settings.host || !settings.port || !settings.username) {
      toast.error("ホスト、ポート、ユーザー名を入力してください");
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus("idle");

    try {
      // Simulate connection test - in real implementation, test Asterisk connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success/failure for demo
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        setConnectionStatus("success");
        toast.success("Asterisk PBX接続テスト成功");
      } else {
        setConnectionStatus("error");
        toast.error("Asterisk PBX接続テスト失敗");
      }
    } catch (error) {
      setConnectionStatus("error");
      toast.error("接続テスト中にエラーが発生しました");
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Asterisk PBX 接続設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asterisk-host">ホスト</Label>
              <Input
                id="asterisk-host"
                value={settings.host}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  host: e.target.value
                })}
                placeholder="192.168.1.100 または pbx.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asterisk-port">ポート</Label>
              <Input
                id="asterisk-port"
                value={settings.port}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  port: e.target.value
                })}
                placeholder="5060"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asterisk-username">ユーザー名</Label>
              <Input
                id="asterisk-username"
                value={settings.username}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  username: e.target.value
                })}
                placeholder="SIPユーザー名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asterisk-password">パスワード</Label>
              <Input
                id="asterisk-password"
                type="password"
                value={settings.password}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  password: e.target.value
                })}
                placeholder="SIPパスワード"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asterisk-realm">レルム</Label>
              <Input
                id="asterisk-realm"
                value={settings.realm}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  realm: e.target.value
                })}
                placeholder="asterisk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asterisk-context">コンテキスト</Label>
              <Input
                id="asterisk-context"
                value={settings.context}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  context: e.target.value
                })}
                placeholder="default"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !settings.host || !settings.port || !settings.username}
              variant="outline"
              className="gap-2"
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              接続テスト
            </Button>

            {connectionStatus === "success" && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                接続成功
              </Badge>
            )}

            {connectionStatus === "error" && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                接続失敗
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            SIP詳細設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transport">トランスポート</Label>
              <Select
                value={settings.transport}
                onValueChange={(value) => onSettingsChange({
                  ...settings,
                  transport: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="トランスポートを選択" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codec">コーデック</Label>
              <Select
                value={settings.codec}
                onValueChange={(value) => onSettingsChange({
                  ...settings,
                  codec: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="コーデックを選択" />
                </SelectTrigger>
                <SelectContent>
                  {CODEC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dtmf-mode">DTMFモード</Label>
              <Select
                value={settings.dtmfMode}
                onValueChange={(value) => onSettingsChange({
                  ...settings,
                  dtmfMode: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="DTMFモードを選択" />
                </SelectTrigger>
                <SelectContent>
                  {DTMF_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timers">セッションタイマー</Label>
              <Select
                value={settings.sessionTimers}
                onValueChange={(value) => onSettingsChange({
                  ...settings,
                  sessionTimers: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="セッションタイマーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TIMER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="call-limit">通話制限</Label>
              <Input
                id="call-limit"
                value={settings.callLimit}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  callLimit: e.target.value
                })}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualify">Qualify</Label>
              <Input
                id="qualify"
                value={settings.qualify}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  qualify: e.target.value
                })}
                placeholder="yes"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nat">NAT設定</Label>
            <Input
              id="nat"
              value={settings.nat}
              onChange={(e) => onSettingsChange({
                ...settings,
                nat: e.target.value
              })}
              placeholder="force_rport,comedia"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="space-y-0.5">
              <Label>Re-INVITE有効化</Label>
              <p className="text-sm text-muted-foreground">
                メディアの再ネゴシエーションを許可
              </p>
            </div>
            <Switch
              checked={settings.enableReinvite}
              onCheckedChange={(checked) => onSettingsChange({
                ...settings,
                enableReinvite: checked
              })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>設定ガイド</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">基本設定:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>ホスト: Asterisk PBXサーバーのIPアドレスまたはFQDN</li>
              <li>ポート: SIPポート（通常は5060）</li>
              <li>ユーザー名/パスワード: SIP認証情報</li>
            </ul>
          </div>
          
          <div>
            <strong className="text-foreground">詳細設定:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>トランスポート: SIP通信プロトコル</li>
              <li>コーデック: 音声エンコーディング形式</li>
              <li>DTMFモード: プッシュトーン信号の送信方法</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}