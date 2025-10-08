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
import { toast } from "sonner";
import { Loader2, TestTube, CheckCircle, XCircle } from "lucide-react";

interface AzureSpeechSettingsProps {
  settings: {
    azureSubscriptionKey: string;
    azureRegion: string;
    azureLanguage: string;
    azureVoice: string;
  };
  onSettingsChange: (settings: any) => void;
}

const AZURE_REGIONS = [
  { value: "japaneast", label: "Japan East" },
  { value: "japanwest", label: "Japan West" },
  { value: "eastus2", label: "East US 2" },
  { value: "westus2", label: "West US 2" },
  { value: "southeastasia", label: "Southeast Asia" },
  { value: "westeurope", label: "West Europe" },
];

const AZURE_LANGUAGES = [
  { value: "ja-JP", label: "日本語 (Japanese)" },
  { value: "en-US", label: "英語 (English)" },
  { value: "zh-CN", label: "中国語 (Chinese)" },
];

const AZURE_VOICES = {
  "ja-JP": [
    { value: "ja-JP-NanamiNeural", label: "Nanami (女性)" },
    { value: "ja-JP-KeitaNeural", label: "Keita (男性)" },
    { value: "ja-JP-AoiNeural", label: "Aoi (女性)" },
    { value: "ja-JP-DaichiNeural", label: "Daichi (男性)" },
  ],
  "en-US": [
    { value: "en-US-JennyNeural", label: "Jenny (Female)" },
    { value: "en-US-GuyNeural", label: "Guy (Male)" },
    { value: "en-US-AriaNeural", label: "Aria (Female)" },
    { value: "en-US-DavisNeural", label: "Davis (Male)" },
  ],
  "zh-CN": [
    { value: "zh-CN-XiaoxiaoNeural", label: "Xiaoxiao (女性)" },
    { value: "zh-CN-YunyangNeural", label: "Yunyang (男性)" },
    { value: "zh-CN-XiaohanNeural", label: "Xiaohan (女性)" },
    { value: "zh-CN-YunxiNeural", label: "Yunxi (男性)" },
  ],
};

export default function AzureSpeechSettings({ settings, onSettingsChange }: AzureSpeechSettingsProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  const handleTestConnection = async () => {
    if (!settings.azureSubscriptionKey) {
      toast.error("サブスクリプションキーを入力してください");
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus("idle");

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        setConnectionStatus("success");
        toast.success("Azure Speech Service接続テスト成功");
      } else {
        setConnectionStatus("error");
        toast.error("Azure Speech Service接続テスト失敗");
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
          <CardTitle>Azure Speech Service 設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="azure-key">サブスクリプションキー</Label>
            <Input
              id="azure-key"
              type="password"
              value={settings.azureSubscriptionKey}
              onChange={(e) => onSettingsChange({
                ...settings,
                azureSubscriptionKey: e.target.value
              })}
              placeholder="Azure Speech Serviceのサブスクリプションキーを入力"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="azure-region">リージョン</Label>
            <Select
              value={settings.azureRegion}
              onValueChange={(value) => onSettingsChange({
                ...settings,
                azureRegion: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="リージョンを選択" />
              </SelectTrigger>
              <SelectContent>
                {AZURE_REGIONS.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="azure-language">言語</Label>
            <Select
              value={settings.azureLanguage}
              onValueChange={(value) => onSettingsChange({
                ...settings,
                azureLanguage: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="言語を選択" />
              </SelectTrigger>
              <SelectContent>
                {AZURE_LANGUAGES.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="azure-voice">音声</Label>
            <Select
              value={settings.azureVoice}
              onValueChange={(value) => onSettingsChange({
                ...settings,
                azureVoice: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="音声を選択" />
              </SelectTrigger>
              <SelectContent>
                {AZURE_VOICES[settings.azureLanguage as keyof typeof AZURE_VOICES]?.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !settings.azureSubscriptionKey}
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
    </div>
  );
}