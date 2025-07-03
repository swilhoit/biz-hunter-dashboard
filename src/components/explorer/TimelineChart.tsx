import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { ProcessedProduct } from '../../utils/explorer/dataProcessing';
import { format, parseISO } from 'date-fns';
import { useThemeProvider } from '../../utils/ThemeContext';
import { chartColors } from '../../charts/ChartjsConfig';

interface TimelineChartProps {
  data: ProcessedProduct[];
}

interface TimelineData {
  date: string;
  count: number;
  cumulative: number;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  const { currentTheme } = useThemeProvider();
  const darkMode = currentTheme === 'dark';
  const { gridColor, textColor } = chartColors;
  // Process data to get timeline information
  const processTimelineData = (): TimelineData[] => {
    // Group products by date
    const dateCounts: Record<string, number> = {};
    
    data.forEach(item => {
      if (item.dateFirstAvailable) {
        // Extract just the date part
        const date = item.dateFirstAvailable.split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    // Convert to array and sort by date
    const sortedData = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .filter(item => item.date !== 'Unknown' && item.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate cumulative counts
    let cumulative = 0;
    const timelineData: TimelineData[] = sortedData.map(item => {
      cumulative += item.count;
      return {
        date: item.date,
        count: item.count,
        cumulative
      };
    });

    return timelineData;
  };

  const timelineData = processTimelineData();

  if (timelineData.length === 0) {
    return (
      <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Product Launch Timeline</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cumulative product launches over time</p>
        </header>
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">No timeline data available</p>
        </div>
      </div>
    );
  }

  const formatXAxisTick = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      return format(date, 'MMM yy');
    } catch {
      return tickItem;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      try {
        const date = parseISO(label);
        const formattedDate = format(date, 'MMM dd, yyyy');
        
        return (
          <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs shadow-xl">
            <div className="font-medium text-gray-800 dark:text-gray-100">{formattedDate}</div>
            <div className="grid gap-1.5">
              {payload.map((entry: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{entry.name}:</span>
                  <span className="font-mono font-medium" style={{ color: entry.color }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      } catch {
        return null;
      }
    }
    return null;
  };

  const chartConfig = {
    cumulative: {
      label: "Cumulative Products",
      color: "#8b5cf6",
    },
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Product Launch Timeline</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Cumulative product launches over time</p>
      </header>
      <div className="p-5">
        <ChartContainer config={chartConfig} className="h-[350px]">
          <AreaChart data={timelineData} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulative)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-cumulative)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={darkMode ? gridColor.dark : gridColor.light}
              className="stroke-muted"
            />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisTick}
              tick={{ 
                fontSize: 12, 
                fill: darkMode ? textColor.dark : textColor.light 
              }}
              axisLine={{ stroke: darkMode ? gridColor.dark : gridColor.light }}
              tickLine={{ stroke: darkMode ? gridColor.dark : gridColor.light }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ 
                fontSize: 12, 
                fill: darkMode ? textColor.dark : textColor.light 
              }}
              axisLine={{ stroke: darkMode ? gridColor.dark : gridColor.light }}
              tickLine={{ stroke: darkMode ? gridColor.dark : gridColor.light }}
            />
            <ChartTooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="Cumulative Products"
              stroke="var(--color-cumulative)"
              fillOpacity={1}
              fill="url(#colorCumulative)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
};