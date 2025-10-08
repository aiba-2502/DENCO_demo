"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, TestTube, CheckCircle, XCircle, Server, AlertCircle, Info } from "lucide-react";

interface AsteriskSettingsProps {
  settings: {
    ari_host: string;
    ari_port: string;
    ari_username: string;
    ari_password: string;
    ari_app_name: string;
  };
  onSettingsChange: (settings: any) => void;
}

export default function AsteriskSettings({ settings, onSettingsChange }: AsteriskSettingsProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [settingsSource, setSettingsSource] = useState<any>({});

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus("idle");
    
    try {
      // Node.jsバックエンドのAsterisk接続状態を確認
      const response = await fetch('http://localhost:3001/api/asterisk/status');
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus("success");
        setConnectionMessage(`Connected to Asterisk ${data.host}:${data.ariPort} - App: ${data.appName}`);
        toast.success("Asterisk ARI接続成功", {
          description: `Host: ${data.host}, App: ${data.appName}`,
        });
      } else {
        setConnectionStatus("error");
        setConnectionMessage("Asterisk ARIに接続できません");
        toast.error("Asterisk ARI接続失敗", {
          description: "Node.jsバックエンドがAsteriskに接続できません",
        });
      }
    } catch (error: any) {
      setConnectionStatus("error");
      setConnectionMessage(error.message || "接続テスト失敗");
      toast.error("接続テストエラー", {
        description: error.message,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    toast.success("Asterisk設定を保存しました", {
      description: "Node.jsバックエンドを再起動して設定を反映してください",
    });
  };

  const getSourceBadge = () => {
    if (settingsSource.asterisk === 'env') {
      return <Badge variant="outline" className="ml-2">.env優先</Badge>;
    } else if (settingsSource.asterisk === 'database') {
      return <Badge variant="secondary" className="ml-2">DB値</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Asterisk ARI 接続設定
            {getSourceBadge()}
          </CardTitle>
          <CardDescription>
            Node.jsバックエンドからAsterisk PBXへのARI（Asterisk REST Interface）接続設定
          </CardDescription>
          {settingsSource.asterisk === 'env' && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>.envファイルから読み込んでいます。</strong><br/>
                この画面で変更してもNode.jsバックエンド再起動時に.envの値が優先されます。<br/>
                変更を反映するには asterisk-backend/.env を編集してください。
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ari-host">ARIホスト</Label>
              <Input
                id="ari-host"
                value={settings.ari_host}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  ari_host: e.target.value
                })}
                placeholder="192.168.1.100 または asterisk.example.com"
              />
              <p className="text-xs text-muted-foreground">
                Asterisk PBXサーバーのIPアドレスまたはホスト名
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ari-port">ARIポート</Label>
              <Input
                id="ari-port"
                value={settings.ari_port}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  ari_port: e.target.value
                })}
                placeholder="8088"
              />
              <p className="text-xs text-muted-foreground">
                デフォルト: 8088
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ari-username">ARIユーザー名</Label>
              <Input
                id="ari-username"
                value={settings.ari_username}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  ari_username: e.target.value
                })}
                placeholder="ariuser"
              />
              <p className="text-xs text-muted-foreground">
                /etc/asterisk/ari.confで設定したユーザー名
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ari-password">ARIパスワード</Label>
              <Input
                id="ari-password"
                type="password"
                value={settings.ari_password}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  ari_password: e.target.value
                })}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                /etc/asterisk/ari.confで設定したパスワード
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ari-app-name">Stasisアプリケーション名</Label>
            <Input
              id="ari-app-name"
              value={settings.ari_app_name}
              onChange={(e) => onSettingsChange({
                ...settings,
                ari_app_name: e.target.value
              })}
              placeholder="denco_voiceai"
            />
            <p className="text-xs text-muted-foreground">
              extensions.confの Stasis(app_name) と一致する必要があります
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="outline"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  接続テスト中...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  接続テスト
                </>
              )}
            </Button>

            {connectionStatus !== "idle" && (
              <div className="flex items-center gap-2">
                {connectionStatus === "success" ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">接続成功</span>
                  </>
                ) : connectionStatus === "error" ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">接続失敗</span>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {connectionMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              connectionStatus === "success" 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {connectionMessage}
            </div>
          )}

          <div className="pt-4 border-t">
            <Button onClick={handleSave}>
              設定を保存
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            設定ガイド
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Asteriskサーバー側の設定</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>1. ARI有効化</strong> (/etc/asterisk/ari.conf):</p>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`[general]
enabled = yes

[http]
enabled = yes
bindaddr = 0.0.0.0
bindport = 8088

[ariuser]
type = user
password = arisecret`}
              </pre>

              <p className="mt-4"><strong>2. Stasisダイヤルプラン</strong> (/etc/asterisk/extensions_custom.conf):</p>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`[denco-ai-inbound]
exten => _X.,1,NoOp(DENCO AI)
 same => n,Answer()
 same => n,Stasis(denco_voiceai,\${EXTEN},\${CALLERID(num)})
 same => n,Hangup()`}
              </pre>

              <p className="mt-4"><strong>3. Asteriskリロード:</strong></p>
              <pre className="bg-muted p-2 rounded text-xs">
{`asterisk -rx "module reload res_ari.so"
asterisk -rx "dialplan reload"`}
              </pre>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">FreePBX UIでの設定</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Connectivity</strong> → <strong>Inbound Routes</strong></p>
              <p>• DID番号を設定</p>
              <p>• Destination: <code className="bg-muted px-1">Custom App</code></p>
              <p>• Custom Application: <code className="bg-muted px-1">Goto(denco-ai-inbound,$DID,1)</code></p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Node.jsバックエンド設定ファイル</h4>
            <p className="text-sm text-muted-foreground mb-2">
              asterisk-backend/.env に以下を設定:
            </p>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`ASTERISK_HOST=${settings.ari_host}
ASTERISK_ARI_PORT=${settings.ari_port}
ASTERISK_ARI_USERNAME=${settings.ari_username}
ASTERISK_ARI_PASSWORD=${settings.ari_password}
ASTERISK_APP_NAME=${settings.ari_app_name}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
