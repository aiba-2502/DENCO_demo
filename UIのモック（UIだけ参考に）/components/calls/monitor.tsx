"use client";

import { useState } from "react";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CallList } from "@/components/calls/call-list";
import { ChatInterface } from "@/components/calls/chat-interface";
import { RefreshCw, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

export default function CallMonitor() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCall, setSelectedCall] = useState<string | null>("call-1");
  const [muted, setMuted] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [micMuted, setMicMuted] = useState(true);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [micVolume, setMicVolume] = useState([50]);
  const [speakerVolume, setSpeakerVolume] = useState([75]);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState("00:00");
  
  // 通話時間の更新
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isJoined && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isJoined, callStartTime]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleJoinCall = () => {
    if (!selectedCall) return;
    setIsJoinModalOpen(true);
  };

  const handleConfirmJoin = () => {
    setConnectionStatus("connecting");
    setIsJoinModalOpen(false);
    
    // 接続開始のトースト
    toast.loading("通話に接続中...", {
      id: "call-connection",
      duration: Infinity,
    });
    
    // Simulate connection process
    setTimeout(() => {
      setConnectionStatus("connected");
      setIsJoined(true);
      setIsListening(true);
      setCallStartTime(new Date());
      setCallDuration("00:00");
      
      // 接続成功のトースト
      toast.success("通話に参加しました", {
        id: "call-connection",
        description: `${getSelectedCallInfo().user} (${getSelectedCallInfo().phoneNumber})`,
        duration: 3000,
      });
      
      // 参加中の継続トースト
      setTimeout(() => {
        const updateCallToast = () => {
          toast.info("🔊 通話参加中", {
            id: "call-active",
            description: `${getSelectedCallInfo().user} (${getSelectedCallInfo().phoneNumber}) - ${callDuration}`,
            duration: Infinity,
            action: {
              label: "退出",
              onClick: handleLeaveCall,
            },
          });
        };
        
        updateCallToast();
        
        // 通話時間を定期的に更新
        const toastUpdateInterval = setInterval(() => {
          if (isJoined) {
            updateCallToast();
          } else {
            clearInterval(toastUpdateInterval);
          }
        }, 1000);
        
        // クリーンアップ用にintervalを保存
        (window as any).callToastInterval = toastUpdateInterval;
      }, 3500);
    }, 2000);
  };

  const handleLeaveCall = () => {
    // アクティブなトーストを削除
    toast.dismiss("call-active");
    
    // トースト更新のintervalをクリア
    if ((window as any).callToastInterval) {
      clearInterval((window as any).callToastInterval);
      (window as any).callToastInterval = null;
    }
    
    setConnectionStatus("disconnected");
    setIsJoined(false);
    setIsListening(false);
    setMicMuted(true);
    setCallStartTime(null);
    setCallDuration("00:00");
    
    // 退出完了のトースト
    toast.success("通話から退出しました", {
      description: `${getSelectedCallInfo().user} との通話を終了`,
      duration: 2000,
    });
  };

  const toggleMic = () => {
    setMicMuted(!micMuted);
    
    // マイク状態変更のトースト
    if (!micMuted) {
      toast.info("🎤 マイクをミュートしました", {
        description: `${getSelectedCallInfo().user} との通話中`,
        duration: 2000,
      });
    } else {
      toast.info("🎤 マイクのミュートを解除しました", {
        description: `${getSelectedCallInfo().user} との通話中`,
        duration: 2000,
      });
    }
  };

  const toggleSpeaker = () => {
    setSpeakerMuted(!speakerMuted);
    
    // スピーカー状態変更のトースト
    if (!speakerMuted) {
      toast.info("🔇 スピーカーをミュートしました", {
        description: `${getSelectedCallInfo().user} との通話中`,
        duration: 2000,
      });
    } else {
      toast.info("🔊 スピーカーのミュートを解除しました", {
        description: `${getSelectedCallInfo().user} との通話中`,
        duration: 2000,
      });
    }
  };

  const getSelectedCallInfo = () => {
    // This would normally come from your call data
    return {
      user: "山田 太郎",
      phoneNumber: "090-1234-5678",
      duration: "05:23",
      tenant: "株式会社ABC"
    };
  };
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">通話モニター</h1>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 h-full min-h-0">
        <Card className="lg:col-span-1 h-full flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>アクティブな通話</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <CallList selectedCall={selectedCall} onSelectCall={setSelectedCall} />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 h-full flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>通話詳細</CardTitle>
              {isJoined && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                    参加中
                  </Badge>
                  {connectionStatus === "connecting" && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      接続中...
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isJoined ? (
                <Button variant="outline" size="sm" onClick={handleJoinCall} disabled={!selectedCall}>
                  <Phone className="h-4 w-4 mr-1" />
                  参加
                </Button>
              ) : (
                <>
                  <Button
                    variant={micMuted ? "outline" : "default"}
                    size="sm"
                    onClick={toggleMic}
                  >
                    {micMuted ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                    {micMuted ? "ミュート" : "ミュート解除"}
                  </Button>
                  <Button
                    variant={speakerMuted ? "outline" : "default"}
                    size="sm"
                    onClick={toggleSpeaker}
                  >
                    {speakerMuted ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                    {speakerMuted ? "スピーカー" : "スピーカー"}
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pb-0">
            {selectedCall ? (
              <ChatInterface callId={selectedCall} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">通話を選択してモニタリングを開始</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 通話参加モーダル */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>通話に参加</DialogTitle>
            <DialogDescription>
              以下の通話に参加しますか？
            </DialogDescription>
          </DialogHeader>
          
          {selectedCall && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">顧客名:</span>
                    <span className="font-medium">{getSelectedCallInfo().user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">電話番号:</span>
                    <span className="font-medium">{getSelectedCallInfo().phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">通話時間:</span>
                    <span className="font-medium">{getSelectedCallInfo().duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">テナント:</span>
                    <span className="font-medium">{getSelectedCallInfo().tenant}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mic-muted">マイクをミュートで参加</Label>
                <Switch
                  id="mic-muted"
                  checked={micMuted}
                  onCheckedChange={setMicMuted}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleConfirmJoin}>
              <Phone className="h-4 w-4 mr-1" />
              参加する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}