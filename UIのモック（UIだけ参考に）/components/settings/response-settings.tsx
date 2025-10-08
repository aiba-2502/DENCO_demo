"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Trash, 
  Volume2, 
  MessageSquare,
  Phone,
  Users,
  Headphones
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResponseSettingsProps {
  settings: {
    incomingCall: {
      useAudio: boolean;
      message: string;
      audioFile: string | null;
      audioFileName: string | null;
    };
    humanCallout: {
      useAudio: boolean;
      message: string;
      audioFile: string | null;
      audioFileName: string | null;
    };
    humanHandover: {
      useAudio: boolean;
      message: string;
      audioFile: string | null;
      audioFileName: string | null;
    };
    voice: string;
    speechRate: number;
    volume: number;
  };
  onSettingsChange: (settings: any) => void;
}

const VOICE_OPTIONS = [
  { value: "ja-JP-NanamiNeural", label: "Nanami (女性・標準)" },
  { value: "ja-JP-KeitaNeural", label: "Keita (男性・標準)" },
  { value: "ja-JP-AoiNeural", label: "Aoi (女性・若い)" },
  { value: "ja-JP-DaichiNeural", label: "Daichi (男性・若い)" },
  { value: "ja-JP-MayuNeural", label: "Mayu (女性・大人)" },
  { value: "ja-JP-NaokiNeural", label: "Naoki (男性・大人)" },
];

export default function ResponseSettings({ settings, onSettingsChange }: ResponseSettingsProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const handleMessageChange = (type: 'incomingCall' | 'humanCallout' | 'humanHandover', message: string) => {
    onSettingsChange({
      ...settings,
      [type]: {
        ...settings[type],
        message
      }
    });
  };

  const handleAudioToggle = (type: 'incomingCall' | 'humanCallout' | 'humanHandover', useAudio: boolean) => {
    onSettingsChange({
      ...settings,
      [type]: {
        ...settings[type],
        useAudio
      }
    });
  };

  const handleAudioUpload = (type: 'incomingCall' | 'humanCallout' | 'humanHandover', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error("音声ファイルを選択してください");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ファイルサイズは10MB以下にしてください");
      return;
    }

    // Create object URL for preview
    const audioUrl = URL.createObjectURL(file);
    
    onSettingsChange({
      ...settings,
      [type]: {
        ...settings[type],
        audioFile: audioUrl,
        audioFileName: file.name
      }
    });

    toast.success("音声ファイルをアップロードしました");
    event.target.value = '';
  };

  const handleAudioDelete = (type: 'incomingCall' | 'humanCallout' | 'humanHandover') => {
    // Revoke object URL to prevent memory leaks
    if (settings[type].audioFile) {
      URL.revokeObjectURL(settings[type].audioFile);
    }

    onSettingsChange({
      ...settings,
      [type]: {
        ...settings[type],
        audioFile: null,
        audioFileName: null
      }
    });

    toast.success("音声ファイルを削除しました");
  };

  const handleAudioPlay = (type: 'incomingCall' | 'humanCallout' | 'humanHandover') => {
    const audioFile = settings[type].audioFile;
    if (!audioFile) return;

    if (playingAudio === type) {
      // Stop playing
      setPlayingAudio(null);
    } else {
      // Start playing
      setPlayingAudio(type);
      const audio = new Audio(audioFile);
      audio.onended = () => setPlayingAudio(null);
      audio.play().catch(() => {
        toast.error("音声の再生に失敗しました");
        setPlayingAudio(null);
      });
    }
  };

  const handleTestMessage = (type: 'incomingCall' | 'humanCallout' | 'humanHandover') => {
    const config = settings[type];
    if (config.useAudio && config.audioFile) {
      handleAudioPlay(type);
    } else if (!config.useAudio && config.message) {
      // Test TTS with current settings
      toast.info("音声合成テスト", {
        description: `「${config.message}」を${settings.voice}で再生`,
        duration: 3000,
      });
    } else {
      toast.error("メッセージまたは音声ファイルを設定してください");
    }
  };

  const ResponseSection = ({ 
    type, 
    title, 
    description, 
    icon: Icon,
    placeholder 
  }: { 
    type: 'incomingCall' | 'humanCallout' | 'humanHandover';
    title: string;
    description: string;
    icon: any;
    placeholder: string;
  }) => {
    const config = settings[type];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>音声ファイルを使用</Label>
              <p className="text-sm text-muted-foreground">
                オフの場合はテキストメッセージを音声合成で再生
              </p>
            </div>
            <Switch
              checked={config.useAudio}
              onCheckedChange={(checked) => handleAudioToggle(type, checked)}
            />
          </div>

          {config.useAudio ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>音声ファイル</Label>
                {config.audioFile ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{config.audioFileName}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAudioPlay(type)}
                      className="h-8 w-8"
                    >
                      {playingAudio === type ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAudioDelete(type)}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleAudioUpload(type, e)}
                      style={{ display: 'none' }}
                      id={`audio-upload-${type}`}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById(`audio-upload-${type}`)?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      音声ファイルをアップロード
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  対応形式: MP3, WAV, M4A (最大10MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>メッセージテキスト</Label>
              <Textarea
                value={config.message}
                onChange={(e) => handleMessageChange(type, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                設定された音声で自動的に読み上げられます
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => handleTestMessage(type)}
              className="gap-2"
              disabled={(!config.useAudio && !config.message.trim()) || (config.useAudio && !config.audioFile)}
            >
              <Play className="h-4 w-4" />
              テスト再生
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* 音声設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            音声設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>音声</Label>
              <Select
                value={settings.voice}
                onValueChange={(value) => onSettingsChange({
                  ...settings,
                  voice: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>音量: {settings.volume}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  volume: parseInt(e.target.value)
                })}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>読み上げ速度: {settings.speechRate}x</Label>
            <Input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.speechRate}
              onChange={(e) => onSettingsChange({
                ...settings,
                speechRate: parseFloat(e.target.value)
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>遅い (0.5x)</span>
              <span>標準 (1.0x)</span>
              <span>速い (2.0x)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 応答メッセージ設定 */}
      <div className="space-y-6">
        <ResponseSection
          type="incomingCall"
          title="着信時メッセージ"
          description="着信があった際に最初に流すメッセージです"
          icon={Phone}
          placeholder="お電話ありがとうございます。AIアシスタントが対応いたします。ご用件をお聞かせください。"
        />

        <ResponseSection
          type="humanCallout"
          title="人間呼び出し時メッセージ"
          description="人間のオペレーターを呼び出している間に流すメッセージです"
          icon={Users}
          placeholder="担当者におつなぎしております。少々お待ちください。"
        />

        <ResponseSection
          type="humanHandover"
          title="人間応対時メッセージ"
          description="通話モニターに割り込む際に流すメッセージです"
          icon={MessageSquare}
          placeholder="担当者に代わります。引き続きよろしくお願いいたします。"
        />
      </div>

      {/* 使用方法ガイド */}
      <Card>
        <CardHeader>
          <CardTitle>使用方法ガイド</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">着信時メッセージ:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>顧客からの着信があった際に最初に再生されます</li>
              <li>AIアシスタントの挨拶や案内に使用します</li>
            </ul>
          </div>
          
          <div>
            <strong className="text-foreground">人間呼び出し時メッセージ:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>AIが人間のオペレーターを呼び出している間に再生されます</li>
              <li>保留音の代わりに案内メッセージを流すことができます</li>
            </ul>
          </div>

          <div>
            <strong className="text-foreground">人間応対時メッセージ:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>通話モニターでオペレーターが通話に参加する際に再生されます</li>
              <li>AIから人間への引き継ぎを円滑にします</li>
            </ul>
          </div>

          <div>
            <strong className="text-foreground">音声ファイル vs テキスト:</strong>
            <ul className="mt-1 ml-4 space-y-1 list-disc">
              <li>音声ファイル: 事前に録音した高品質な音声を使用</li>
              <li>テキスト: 設定された音声で自動的に読み上げ</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}