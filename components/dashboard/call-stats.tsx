"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart } from '@/components/ui/chart';

interface CallStatsProps {
  period: "daily" | "weekly" | "monthly";
}

// Sample data - in a real app, this would come from your API
const generateSampleData = (period: "daily" | "weekly" | "monthly") => {
  if (period === "daily") {
    return [
      { name: "9:00", "受電_電話": 5, "受電_FAX": 1, "架電_電話": 3, "架電_FAX": 0 },
      { name: "10:00", "受電_電話": 8, "受電_FAX": 2, "架電_電話": 4, "架電_FAX": 1 },
      { name: "11:00", "受電_電話": 12, "受電_FAX": 1, "架電_電話": 6, "架電_FAX": 2 },
      { name: "12:00", "受電_電話": 10, "受電_FAX": 0, "架電_電話": 5, "架電_FAX": 1 },
      { name: "13:00", "受電_電話": 7, "受電_FAX": 2, "架電_電話": 4, "架電_FAX": 0 },
      { name: "14:00", "受電_電話": 15, "受電_FAX": 1, "架電_電話": 8, "架電_FAX": 2 },
      { name: "15:00", "受電_電話": 18, "受電_FAX": 2, "架電_電話": 9, "架電_FAX": 1 },
      { name: "16:00", "受電_電話": 12, "受電_FAX": 1, "架電_電話": 6, "架電_FAX": 2 },
      { name: "17:00", "受電_電話": 10, "受電_FAX": 0, "架電_電話": 5, "架電_FAX": 1 },
    ];
  } else if (period === "weekly") {
    return [
      { name: "月", "受電_電話": 45, "受電_FAX": 8, "架電_電話": 30, "架電_FAX": 5 },
      { name: "火", "受電_電話": 52, "受電_FAX": 10, "架電_電話": 35, "架電_FAX": 7 },
      { name: "水", "受電_電話": 48, "受電_FAX": 7, "架電_電話": 32, "架電_FAX": 4 },
      { name: "木", "受電_電話": 55, "受電_FAX": 12, "架電_電話": 38, "架電_FAX": 8 },
      { name: "金", "受電_電話": 50, "受電_FAX": 9, "架電_電話": 34, "架電_FAX": 6 },
    ];
  } else {
    return [
      { name: "第1週", "受電_電話": 250, "受電_FAX": 45, "架電_電話": 180, "架電_FAX": 30 },
      { name: "第2週", "受電_電話": 280, "受電_FAX": 50, "架電_電話": 200, "架電_FAX": 35 },
      { name: "第3週", "受電_電話": 260, "受電_FAX": 48, "架電_電話": 190, "架電_FAX": 32 },
      { name: "第4週", "受電_電話": 290, "受電_FAX": 52, "架電_電話": 210, "架電_FAX": 38 },
    ];
  }
};

export function CallStats({ period }: CallStatsProps) {
  const data = generateSampleData(period);

  return (
    <BarChart
      data={data}
      index="name"
      categories={["受電_電話", "受電_FAX", "架電_電話", "架電_FAX"]}
      colors={["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]}
      valueFormatter={(value) => `${value}件`}
      className="h-[400px]"
    />
  );
}