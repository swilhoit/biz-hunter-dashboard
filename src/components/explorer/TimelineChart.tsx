import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { ProcessedProduct } from '../../utils/explorer/dataProcessing';
import { format, parseISO } from 'date-fns';

interface TimelineChartProps {
  data: ProcessedProduct[];
}

interface TimelineData {
  date: string;
  count: number;
  cumulative: number;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
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
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Product Launch Timeline</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">No timeline data available</p>
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
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold mb-1">{formattedDate}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      } catch {
        return null;
      }
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Product Launch Timeline</h2>
      </header>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisTick}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="Cumulative Products"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorCumulative)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};