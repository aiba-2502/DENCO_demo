"use client";

import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  Download,
  Calendar,
  Building,
  Phone,
  User,
  File,
  Play,
  Pause,
  Volume2,
  RotateCcw,
  SkipBack,
  SkipForward,
  Send,
} from "lucide-react";
import Link from "next/link";
import { ChatInterface } from "./chat-interface";

// Sample call session data - would be fetched from API in real app
const sessionsData = {
  "call-101": {
    id: "call-101",
    user: {
      name: "山田 太郎",
      phoneNumber: "090-1234-5678",
      email: "yamada.t@example.com",
    },
    startTime: "2025-04-11T14:30:00",
    endTime: "2025-04-11T14:38:45",
    duration: "08:45",
    status: "completed",
    tenant: "株式会社ABC",
    notes: "請求に関する問い合わせ。解決済み。",
    recordingUrl: "/recordings/call-101.mp3",
    hasRecording: true,
    memos: [
      {
        id: "memo-1",
        content: "顧客から請求書の内容について質問がありました。",
        timestamp: "2025-04-11T14:32:00",
        author: "管理者"
      },
      {
        id: "memo-2", 
        content: "請求書の詳細を説明し、顧客は納得されました。",
        timestamp: "2025-04-11T14:35:00",
        author: "管理者"
      }
    ]
  },
  "call-1": {
    id: "call-1",
    user: {
      name: "山田 太郎",
      phoneNumber: "090-1234-5678",
      email: "yamada.t@example.com",
    },
    startTime: "2025-04-12T09:45:00",
    endTime: null, // Still active
    duration: "05:23",
    status: "active",
    tenant: "株式会社ABC",
    notes: "ログインに関する問い合わせ。",
    recordingUrl: "/recordings/call-1.mp3",
    hasRecording: true,
    memos: [
      {
        id: "memo-3",
        content: "パスワードリセットの手順を案内中です。",
        timestamp: "2025-04-12T09:47:00",
        author: "管理者"
      }
    ]
  },
};

interface SessionDetailProps {
  id: string;
}

export function SessionDetail({ id }: SessionDetailProps) {
  const [sessionData, setSessionData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    loadSessionData();
  }, [id]);
  
  const loadSessionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/calls/${id}`, {
        headers: { 'Authorization': 'Bearer default-tenant' }
      });
      if (response.ok) {
        const data = await response.json();
        setSessionData(data.session);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  
  if (!sessionData) {
    return <div className="p-6">Session not found</div>;
  }
  
  const mockSessionData = sessionsData[id as keyof typeof sessionsData];
  const [memos, setMemos] = useState(sessionData?.memos || []);
  const [newMemo, setNewMemo] = useState("");
  const [isSendingMemo, setIsSendingMemo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  
  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Handle memo send
  const handleSendMemo = async () => {
    if (!newMemo.trim()) return;
    
    setIsSendingMemo(true);

    try {
      // Here you would typically make an API call to save the memo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newMemoObj = {
        id: `memo-${Date.now()}`,
        content: newMemo.trim(),
        timestamp: new Date().toISOString(),
        author: "管理者" // This would come from your auth context
      };
      
      setMemos([...memos, newMemoObj]);
      setNewMemo("");
      
    } catch (error) {
      console.error('Failed to save memo:', error);
    } finally {
      setIsSendingMemo(false);
    }
  };

  // Audio control functions
  const togglePlayPause = () => {
    if (!audioRef) return;
    
    if (isPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef) return;
    const newTime = (value[0] / 100) * duration;
    audioRef.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef) return;
    const newVolume = value[0] / 100;
    audioRef.volume = newVolume;
    setVolume(value);
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!audioRef) return;
    audioRef.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const skipTime = (seconds: number) => {
    if (!audioRef) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audioRef.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatDuration = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatMemoTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadRecording = () => {
    if (!sessionData?.recordingUrl) return;
    
    const link = document.createElement('a');
    link.href = sessionData.recordingUrl;
    link.download = `recording-${sessionData.id}-${sessionData.user.name}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!sessionData) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link href="/calls/history">
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              通話履歴に戻る
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <File className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">通話セッションが見つかりません</h2>
              <p className="text-muted-foreground">
                指定された通話セッションは存在しないか、削除された可能性があります。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/calls/history">
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              通話履歴に戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">通話詳細</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>通話情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {getInitials(sessionData.user.name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="text-xl font-semibold mb-1">{sessionData.user.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{sessionData.user.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{sessionData.user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{sessionData.tenant}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">日付</span>
                </div>
                <span>{formatDate(sessionData.startTime)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">時間</span>
                </div>
                <span>
                  {formatTime(sessionData.startTime)} ～{" "}
                  {sessionData.endTime ? formatTime(sessionData.endTime) : "通話中"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">通話時間</span>
                </div>
                <span>{sessionData.duration}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">状態</span>
                </div>
                <Badge
                  variant={
                    sessionData.status === "completed"
                      ? "default"
                      : sessionData.status === "active"
                      ? "outline"
                      : sessionData.status === "abandoned"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {sessionData.status === "completed" ? "完了" :
                   sessionData.status === "active" ? "通話中" :
                   sessionData.status === "abandoned" ? "放棄" : "失敗"}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-4">メモ</h4>
            <div className="border rounded-lg">
              {/* メモ履歴 */}
              <div className="max-h-60 overflow-y-auto p-4 space-y-3">
                {memos.length > 0 ? (
                  memos.map((memo) => (
                    <div key={memo.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">管</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm">{memo.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{memo.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatMemoTime(memo.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    まだメモがありません
                  </div>
                )}
              </div>
              
              {/* メモ入力 */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    placeholder="メモを入力..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMemo();
                      }
                    }}
                    disabled={isSendingMemo}
                  />
                  <Button 
                    onClick={handleSendMemo}
                    disabled={!newMemo.trim() || isSendingMemo}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>会話記録</CardTitle>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              会話記録をエクスポート
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <div className="min-h-full">
            <ChatInterface callId={id} />
          </div>
        </CardContent>
      </Card>
      
      {/* 通話録音セクション */}
      {sessionData.hasRecording && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>通話録音</CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownloadRecording} className="gap-1">
                <Download className="h-4 w-4" />
                ダウンロード
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 隠れた音声要素 */}
              <audio
                ref={setAudioRef}
                src={sessionData.recordingUrl}
                onLoadedMetadata={(e) => {
                  const audio = e.currentTarget;
                  setDuration(audio.duration);
                  audio.volume = volume[0] / 100;
                }}
                onTimeUpdate={(e) => {
                  setCurrentTime(e.currentTarget.currentTime);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
              />
              
              {/* 再生コントロール */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => skipTime(-10)}
                  disabled={!audioRef}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlayPause}
                  disabled={!audioRef}
                  className="h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => skipTime(10)}
                  disabled={!audioRef}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 進捗バー */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
                <Slider
                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="w-full"
                  disabled={!audioRef}
                />
              </div>
              
              {/* 音量とスピード調整 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm font-medium">音量: {volume[0]}%</span>
                  </div>
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-sm font-medium">再生速度: {playbackRate}x</span>
                  </div>
                  <div className="flex gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <Button
                        key={rate}
                        variant={playbackRate === rate ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePlaybackRateChange(rate)}
                        className="text-xs"
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 録音情報 */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ファイル形式:</span>
                    <span className="ml-2 font-medium">MP3</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">録音時間:</span>
                    <span className="ml-2 font-medium">{sessionData.duration}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">音質:</span>
                    <span className="ml-2 font-medium">44.1kHz, 128kbps</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ファイルサイズ:</span>
                    <span className="ml-2 font-medium">約 2.1MB</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}