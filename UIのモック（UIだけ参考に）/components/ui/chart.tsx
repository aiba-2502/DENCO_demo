"use client";

import { 
  AreaChart as RechartAreaChart,
  BarChart as RechartBarChart,
  LineChart as RechartLineChart, 
  PieChart as RechartPieChart,
  Area, 
  Bar, 
  Line, 
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

interface DonutChartProps {
  data: any[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

interface BarListProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function AreaChart({
  data,
  index,
  categories,
  colors = ["hsl(var(--chart-1))"],
  valueFormatter = (value: number) => value.toString(),
  className,
}: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartAreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={index} />
          <YAxis tickFormatter={valueFormatter} />
          <Tooltip formatter={valueFormatter} />
          <Legend />
          {categories.map((category, i) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.3}
            />
          ))}
        </RechartAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["hsl(var(--chart-1))"],
  valueFormatter = (value: number) => value.toString(),
  className,
}: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={index} />
          <YAxis tickFormatter={valueFormatter} />
          <Tooltip formatter={valueFormatter} />
          <Legend />
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[i % colors.length]}
            />
          ))}
        </RechartBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  index,
  category,
  colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"],
  valueFormatter = (value: number) => value.toString(),
  className,
}: DonutChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey={category}
            nameKey={index}
            label={(entry) => entry[index]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={valueFormatter} />
          <Legend />
        </RechartPieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarList({
  data,
  index,
  categories,
  colors = ["hsl(var(--chart-2))"],
  valueFormatter = (value: number) => value.toString(),
  className,
}: BarListProps) {
  // Horizontal bar chart
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartBarChart
          data={data}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={valueFormatter} />
          <YAxis type="category" dataKey={index} width={100} />
          <Tooltip formatter={valueFormatter} />
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[i % colors.length]}
            />
          ))}
        </RechartBarChart>
      </ResponsiveContainer>
    </div>
  );
}