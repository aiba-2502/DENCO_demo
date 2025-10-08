"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isProcessing?: boolean;
}

interface ChatInterfaceProps {
  callId: string;
}

// Sample conversation - in a real app would be streamed via WebSocket
const SAMPLE_CONVERSATION: Message[] = [
  {
    id: "1",
    content: "アカウントについて問い合わせがあります。",
    sender: "user",
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
  },
  {
    id: "2",
    content: "承知いたしました。アカウントの確認のため、メールアドレスまたはアカウント番号をお教えいただけますでしょうか？",
    sender: "ai",
    timestamp: new Date(Date.now() - 3.8 * 60 * 1000),
  },
  {
    id: "3",
    content: "メールアドレスはyamada.t@example.comです。ログインができなくて困っています。",
    sender: "user",
    timestamp: new Date(Date.now() - 3.5 * 60 * 1000),
  },
  {
    id: "4",
    content: "ご不便をおかけして申し訳ございません。ログインの際にどのような問題が発生しているか、詳しくお聞かせいただけますでしょうか？",
    sender: "ai",
    timestamp: new Date(Date.now() - 3.3 * 60 * 1000),
  },
  {
    id: "5",
    content: "パスワードが間違っていると表示されます。正しいパスワードを入力しているはずなのですが、何度リセットしても同じ状態です。",
    sender: "user",
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
  },
  {
    id: "6",
    content: "ご不便をおかけしております。アカウントの状態を確認させていただきます。少々お待ちください。",
    sender: "ai",
    timestamp: new Date(Date.now() - 2.8 * 60 * 1000),
  },
  {
    id: "7",
    content: "確認いたしました。複数回のログイン試行により、セキュリティのためアカウントがロックされていました。ロックを解除いたしましたので、再度パスワードリセットをお試しください。",
    sender: "ai",
    timestamp: new Date(Date.now() - 2.5 * 60 * 1000),
  },
];

export function ChatInterface({ callId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(SAMPLE_CONVERSATION);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex-1 overflow-y-auto mb-4 px-1">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 max-w-[85%] ${
              message.sender === "user" ? "mr-auto" : "ml-auto flex-row-reverse"
            }`}
          >
            <Avatar className={`h-8 w-8 ${message.sender === "ai" ? "bg-primary" : ""}`}>
              <AvatarFallback>
                {message.sender === "user" ? "UT" : "AI"}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div
                className={`rounded-lg p-3 ${
                  message.sender === "user"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.isProcessing ? (
                  <div className="flex items-center">
                    <span>{message.content}</span>
                    <span className="ml-2 flex space-x-1">
                      <span className="animate-bounce delay-0">.</span>
                      <span className="animate-bounce delay-150">.</span>
                      <span className="animate-bounce delay-300">.</span>
                    </span>
                  </div>
                ) : (
                  message.content
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}