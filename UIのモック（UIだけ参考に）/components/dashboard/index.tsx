"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, ChevronDown } from "lucide-react";
import { SystemStatus } from "@/components/dashboard/system-status";
import { CallStats } from "@/components/dashboard/call-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentCalls } from "@/components/dashboard/recent-calls";
import { RecentFaxes } from "@/components/dashboard/recent-faxes";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="calls" className="w-full">
            <TabsList className="w-full border-b rounded-none">
              <TabsTrigger value="calls" className="flex-1">通話履歴</TabsTrigger>
              <TabsTrigger value="faxes" className="flex-1">FAX履歴</TabsTrigger>
            </TabsList>
            <TabsContent value="calls" className="p-4">
              <RecentCalls />
            </TabsContent>
            <TabsContent value="faxes" className="p-4">
              <RecentFaxes />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SystemStatus />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>発着信数</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList>
              <TabsTrigger value="daily">今日の発着信数</TabsTrigger>
              <TabsTrigger value="weekly">今週の発着信数</TabsTrigger>
              <TabsTrigger value="monthly">今月の発着信数</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <CallStats period="daily" />
            </TabsContent>
            <TabsContent value="weekly">
              <CallStats period="weekly" />
            </TabsContent>
            <TabsContent value="monthly">
              <CallStats period="monthly" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}