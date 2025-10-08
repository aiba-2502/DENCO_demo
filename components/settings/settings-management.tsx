"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import AzureSpeechSettings from "./azure-speech-settings";
import AsteriskSettings from "./asterisk-settings";
import DifySettings from "./dify-settings";
import CustomVocabularySettings from "./custom-vocabulary-settings";
import ResponseSettings from "./response-settings";
import NumberManagement from "./number-management";
import StaffManagement from "./staff-management";

interface Department {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  status: "active" | "inactive";
  createdAt: string;
}

// Azure Speech Service regions
const azureRegions = [
  { value: "japaneast", label: "Japan East (東日本)" },
  { value: "japanwest", label: "Japan West (西日本)" },
  { value: "eastus", label: "East US" },
  { value: "westus", label: "West US" },
  { value: "westus2", label: "West US 2" },
  { value: "eastus2", label: "East US 2" },
  { value: "centralus", label: "Central US" },
  { value: "northcentralus", label: "North Central US" },
  { value: "southcentralus", label: "South Central US" },
  { value: "westcentralus", label: "West Central US" },
  { value: "canadacentral", label: "Canada Central" },
  { value: "canadaeast", label: "Canada East" },
  { value: "brazilsouth", label: "Brazil South" },
  { value: "northeurope", label: "North Europe" },
  { value: "westeurope", label: "West Europe" },
  { value: "uksouth", label: "UK South" },
  { value: "ukwest", label: "UK West" },
  { value: "francecentral", label: "France Central" },
  { value: "francesouth", label: "France South" },
  { value: "switzerlandnorth", label: "Switzerland North" },
  { value: "switzerlandwest", label: "Switzerland West" },
  { value: "germanywestcentral", label: "Germany West Central" },
  { value: "norwayeast", label: "Norway East" },
  { value: "norwaywest", label: "Norway West" },
  { value: "swedencentral", label: "Sweden Central" },
  { value: "southeastasia", label: "Southeast Asia" },
  { value: "eastasia", label: "East Asia" },
  { value: "australiaeast", label: "Australia East" },
  { value: "australiasoutheast", label: "Australia Southeast" },
  { value: "centralindia", label: "Central India" },
  { value: "southindia", label: "South India" },
  { value: "westindia", label: "West India" },
  { value: "koreacentral", label: "Korea Central" },
  { value: "koreasouth", label: "Korea South" },
];

// Voice options for TTS
const voiceOptions = [
  { value: "ja-JP-NanamiNeural", label: "Nanami (女性・標準)" },
  { value: "ja-JP-KeitaNeural", label: "Keita (男性・標準)" },
  { value: "ja-JP-AoiNeural", label: "Aoi (女性・若い)" },
  { value: "ja-JP-DaichiNeural", label: "Daichi (男性・若い)" },
  { value: "ja-JP-MayuNeural", label: "Mayu (女性・大人)" },
  { value: "ja-JP-NaokiNeural", label: "Naoki (男性・大人)" },
  { value: "ja-JP-ShioriNeural", label: "Shiori (女性・子供)" },
];

// Asterisk codec options
const codecOptions = [
  { value: "ulaw", label: "G.711 μ-law (ulaw)" },
  { value: "alaw", label: "G.711 A-law (alaw)" },
  { value: "g722", label: "G.722 (g722)" },
  { value: "g729", label: "G.729 (g729)" },
  { value: "gsm", label: "GSM (gsm)" },
  { value: "opus", label: "Opus (opus)" },
];

export default function SettingsManagement() {
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsSource, setSettingsSource] = useState<any>({});
  const [settings, setSettings] = useState({
    // Azure Speech Service Settings
    azureSpeech: {
      azureSubscriptionKey: "",
      azureRegion: "japaneast",
      azureLanguage: "ja-JP",
      azureVoice: "ja-JP-NanamiNeural",
    },
    
    // Dify Settings
    dify: {
      difyApiKey: "",
      difyEndpoint: "https://api.dify.ai/v1",
      difyKnowledgeApiKey: "",
      difyKnowledgeEndpoint: "https://api.dify.ai/v1",
      summaryPrompt: "",
      openaiApiKey: "",
    },
    
    // Asterisk ARI Settings
    asterisk: {
      ari_host: "",
      ari_port: "8088",
      ari_username: "",
      ari_password: "",
      ari_app_name: "denco_voiceai",
    },
    
    // Response Settings
    response: {
      incomingCall: {
        useAudio: false,
        message: "お電話ありがとうございます。AIアシスタントが対応いたします。ご用件をお聞かせください。",
        audioFile: null,
        audioFileName: null,
      },
      humanCallout: {
        useAudio: false,
        message: "担当者におつなぎしております。少々お待ちください。",
        audioFile: null,
        audioFileName: null,
      },
      humanHandover: {
        useAudio: false,
        message: "担当者に代わります。引き続きよろしくお願いいたします。",
        audioFile: null,
        audioFileName: null,
      },
      voice: "ja-JP-NanamiNeural",
      speechRate: 1.0,
      volume: 75,
    },
    
  });

  const [testResults, setTestResults] = useState({
    azureSpeech: "idle",
  });
  
  // 設定をAPIから読み込み
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/settings', {
        headers: {
          'Authorization': 'Bearer default-tenant',
        },
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        // APIから取得した設定で更新
        setSettings(prev => ({
          azureSpeech: {
            azureSubscriptionKey: data.settings.azure_speech.subscription_key || "",
            azureRegion: data.settings.azure_speech.region || "japaneast",
            azureLanguage: data.settings.azure_speech.language || "ja-JP",
            azureVoice: data.settings.azure_speech.voice || "ja-JP-NanamiNeural",
          },
          dify: {
            difyApiKey: data.settings.dify.api_key || "",
            difyEndpoint: data.settings.dify.endpoint || "https://api.dify.ai/v1",
            difyKnowledgeApiKey: data.settings.dify.knowledge_api_key || "",
            difyKnowledgeEndpoint: data.settings.dify.knowledge_endpoint || "",
            summaryPrompt: prev.dify.summaryPrompt,
            openaiApiKey: prev.dify.openaiApiKey,
          },
          asterisk: {
            ari_host: data.settings.asterisk.ari_host || "",
            ari_port: data.settings.asterisk.ari_port || "8088",
            ari_username: data.settings.asterisk.ari_username || "",
            ari_password: data.settings.asterisk.ari_password || "",
            ari_app_name: data.settings.asterisk.ari_app_name || "denco_voiceai",
          },
          response: {
            ...prev.response,
            incomingCall: {
              ...prev.response.incomingCall,
              message: data.settings.response.incoming_call_message || prev.response.incomingCall.message,
            },
            voice: data.settings.response.voice_name || "ja-JP-NanamiNeural",
            speechRate: data.settings.response.speech_rate || 1.0,
            volume: data.settings.response.volume || 75,
          },
        }));
        
        setSettingsSource(data.source);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const saveSettings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer default-tenant',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asterisk: {
            ari_host: settings.asterisk.ari_host,
            ari_port: settings.asterisk.ari_port,
            ari_username: settings.asterisk.ari_username,
            ari_password: settings.asterisk.ari_password,
            ari_app_name: settings.asterisk.ari_app_name,
          },
          azure_speech: {
            subscription_key: settings.azureSpeech.azureSubscriptionKey,
            region: settings.azureSpeech.azureRegion,
            language: settings.azureSpeech.azureLanguage,
            voice: settings.azureSpeech.azureVoice,
          },
          dify: {
            api_key: settings.dify.difyApiKey,
            endpoint: settings.dify.difyEndpoint,
            knowledge_api_key: settings.dify.difyKnowledgeApiKey,
            knowledge_endpoint: settings.dify.difyKnowledgeEndpoint,
          },
          response: {
            incoming_call_message: settings.response.incomingCall.message,
            voice_name: settings.response.voice,
            speech_rate: settings.response.speechRate,
            volume: settings.response.volume,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('設定を保存しました');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('設定の保存に失敗しました');
    }
  };

  const [isAddVocabularyDialogOpen, setIsAddVocabularyDialogOpen] = useState(false);
  const [newVocabularyWord, setNewVocabularyWord] = useState("");
  const [newVocabularyPronunciation, setNewVocabularyPronunciation] = useState("");

  const handleSaveSettings = () => {
    saveSettings();
  };

  const testAzureSpeech = () => {
    // Test Azure Speech logic
  };

  const getTestIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "testing":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const handleImportVocabulary = (event) => {
    // Import vocabulary logic
  };

  const handleExportVocabulary = () => {
    // Export vocabulary logic
  };

  const handleAddVocabularyWord = () => {
    // Add vocabulary word logic
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">システム設定</h1>
        <Button onClick={handleSaveSettings} className="gap-1">
          <Save className="h-4 w-4" />
          設定を保存
        </Button>
      </div>

      <Tabs defaultValue="speech" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="speech">音声認識・合成</TabsTrigger>
          <TabsTrigger value="asterisk">Asterisk PBX</TabsTrigger>
          <TabsTrigger value="dify">Dify設定</TabsTrigger>
          <TabsTrigger value="response">応答設定</TabsTrigger>
          <TabsTrigger value="numbers">番号管理</TabsTrigger>
          <TabsTrigger value="staff">スタッフ管理</TabsTrigger>
        </TabsList>

        <TabsContent value="speech">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Azure Speech Service設定</CardTitle>
                  <CardDescription>
                    音声認識と音声合成の設定を行います
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getTestIcon(testResults.azureSpeech)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testAzureSpeech}
                    disabled={testResults.azureSpeech === "testing"}
                    className="gap-1"
                  >
                    <TestTube className="h-4 w-4" />
                    接続テスト
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subscription-key">サブスクリプションキー *</Label>
                  <Input
                    id="subscription-key"
                    type="password"
                    value={settings.azureSpeech.azureSubscriptionKey}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      azureSpeech: { ...prev.azureSpeech, azureSubscriptionKey: e.target.value }
                    }))}
                    placeholder="Azure Speech Serviceのサブスクリプションキー"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">リージョン *</Label>
                  <Select
                    value={settings.azureSpeech.azureRegion}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      azureSpeech: { ...prev.azureSpeech, azureRegion: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {azureRegions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">音声認識言語</Label>
                  <Select
                    value={settings.azureSpeech.azureLanguage}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      azureSpeech: { ...prev.azureSpeech, azureLanguage: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja-JP">日本語 (ja-JP)</SelectItem>
                      <SelectItem value="en-US">英語 (en-US)</SelectItem>
                      <SelectItem value="zh-CN">中国語 (zh-CN)</SelectItem>
                      <SelectItem value="ko-KR">韓国語 (ko-KR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voice">音声合成ボイス</Label>
                  <Select
                    value={settings.azureSpeech.azureVoice}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      azureSpeech: { ...prev.azureSpeech, azureVoice: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <CustomVocabularySettings />
          </div>
        </TabsContent>

        <TabsContent value="asterisk">
          <AsteriskSettings
            settings={settings.asterisk}
            onSettingsChange={(asteriskSettings) => setSettings(prev => ({
              ...prev,
              asterisk: asteriskSettings
            }))}
          />
        </TabsContent>


        <TabsContent value="dify">
          <DifySettings
            settings={settings.dify}
            onSettingsChange={(difySettings) => setSettings(prev => ({
              ...prev,
              dify: difySettings
            }))}
          />
        </TabsContent>

        <TabsContent value="response">
          <ResponseSettings
            settings={settings.response}
            onSettingsChange={(responseSettings) => setSettings(prev => ({
              ...prev,
              response: responseSettings
            }))}
          />
        </TabsContent>

        <TabsContent value="numbers">
          <NumberManagement />
        </TabsContent>

        <TabsContent value="staff">
          <StaffManagement availableDepartments={availableDepartments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}