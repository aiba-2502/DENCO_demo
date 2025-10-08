"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, BarList } from '@/components/ui/chart';

// Sample data - in a real app, this would come from your API
const serverLoadData = [
  { name: "00:00", value: 25 },
  { name: "01:00", value: 18 },
  { name: "02:00", value: 10 },
  { name: "03:00", value: 8 },
  { name: "04:00", value: 12 },
  { name: "05:00", value: 15 },
  { name: "06:00", value: 20 },
  { name: "07:00", value: 38 },
  { name: "08:00", value: 45 },
  { name: "09:00", value: 55 },
  { name: "10:00", value: 62 },
  { name: "11:00", value: 68 },
  { name: "12:00", value: 80 },
];

const latencyData = [
  { name: "Azure STT", value: 125 },
  { name: "Dify AI", value: 180 },
  { name: "Azure TTS", value: 75 },
  { name: "Total", value: 380 },
];

export function ServerMetrics() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Server Load</CardTitle>
          <CardDescription>
            System load over the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChart
            data={serverLoadData}
            index="name"
            categories={["value"]}
            colors={["chart-1"]}
            valueFormatter={(value) => `${value}%`}
            className="h-72"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Response Latency</CardTitle>
          <CardDescription>
            Average response time in milliseconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarList
            data={latencyData}
            index="name"
            categories={["value"]}
            colors={["chart-2"]}
            valueFormatter={(value) => `${value}ms`}
            className="h-72"
          />
        </CardContent>
      </Card>
    </div>
  );
}