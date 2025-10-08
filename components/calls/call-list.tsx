"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Sample data - would be fetched from API in real app
const activeCalls = [
  {
    id: "call-1",
    user: "山田 太郎",
    phoneNumber: "090-1234-5678",
    startTime: new Date(),
    duration: "05:23",
    status: "active",
    tenant: "株式会社ABC",
  },
  {
    id: "call-2",
    user: "佐藤 花子",
    phoneNumber: "090-8765-4321",
    startTime: new Date(Date.now() - 15 * 60 * 1000),
    duration: "15:12",
    status: "active",
    tenant: "株式会社ABC",
  },
  {
    id: "call-3",
    user: "鈴木 一郎",
    phoneNumber: "090-2345-6789",
    startTime: new Date(Date.now() - 3 * 60 * 1000),
    duration: "03:45",
    status: "active",
    tenant: "株式会社XYZ",
  },
];

interface CallListProps {
  selectedCall: string | null;
  onSelectCall: (callId: string) => void;
}

export function CallList({ selectedCall, onSelectCall }: CallListProps) {
  // Function to format duration as mm:ss
  const formatDuration = (startTime: Date) => {
    const diffMs = Date.now() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-2">
      {activeCalls.map((call) => (
        <div
          key={call.id}
          className={cn(
            "flex items-center p-3 rounded-md transition-colors cursor-pointer hover:bg-accent",
            selectedCall === call.id ? "bg-accent" : ""
          )}
          onClick={() => onSelectCall(call.id)}
        >
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback>{getInitials(call.user)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium truncate">{call.user}</p>
              <Badge variant="outline" className="ml-2 shrink-0">
                {formatDuration(call.startTime)}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="truncate">{call.phoneNumber}</span>
              <span className="ml-2 shrink-0">{call.tenant}</span>
            </div>
          </div>
        </div>
      ))}
      
      {activeCalls.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          現在アクティブな通話はありません
        </div>
      )}
    </div>
  );
}