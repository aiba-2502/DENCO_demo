"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall, PhoneOutgoing, Fan as Fax, SendHorizonal, TrendingDown, TrendingUp } from "lucide-react";

const statusItems = [
  {
    title: "今日の着信",
    icon: PhoneCall,
    value: "12",
    description: "電話: 8 / FAX: 4",
    colorClass: "text-blue-500",
    change: {
      value: -15,
      description: "昨日: 14件"
    }
  },
  {
    title: "今日の発信",
    icon: PhoneOutgoing,
    value: "15",
    description: "電話: 12 / FAX: 3",
    colorClass: "text-green-500",
    change: {
      value: 25,
      description: "昨日: 12件"
    }
  },
  {
    title: "今週の通信",
    icon: Fax,
    value: "86",
    description: "着信: 45 / 発信: 41",
    colorClass: "text-indigo-500",
    change: {
      value: 10,
      description: "先週: 78件"
    }
  },
  {
    title: "今月の通信",
    icon: SendHorizonal,
    value: "342",
    description: "着信: 180 / 発信: 162",
    colorClass: "text-amber-500",
    change: {
      value: -5,
      description: "先月: 360件"
    }
  },
];

export function SystemStatus() {
  return (
    <>
      {statusItems.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.colorClass}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${item.colorClass}`}>
                {item.value}
              </div>
              <div className="flex items-center text-sm">
                {item.change.value > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={item.change.value > 0 ? "text-green-500" : "text-red-500"}>
                  {item.change.value > 0 ? "+" : ""}{item.change.value}%
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.change.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}