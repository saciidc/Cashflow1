
import React from 'react';

interface PieChartProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  '#16a34a', // emerald-600
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#4ade80', // green-400
  '#10b981', // teal-500
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#64748b', // slate-500
  '#d946ef', // fuchsia-500
];

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">No expense data to display.</div>;
  }
  
  const total = data.reduce((acc, item) => acc + item.value, 0);
  
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="-1.1 -1.1 2.2 2.2" style={{ transform: 'rotate(-90deg)' }}>
          {data.map((slice, index) => {
            if (slice.value <= 0) return null;
            const percent = slice.value / total;
            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
            cumulativePercent += percent;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            
            const pathData = [
              `M ${startX} ${startY}`, // Move
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
              `L 0 0`, // Line to center
            ].join(' ');

            return <path key={index} d={pathData} fill={COLORS[index % COLORS.length]} />;
          })}
        </svg>
      </div>
      <div className="w-full">
        <ul className="space-y-2 text-sm">
          {data.slice(0, 7).map((slice, index) => ( // Show top 7 for cleaner UI
            <li key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-gray-600 dark:text-gray-300 truncate" title={slice.name}>{slice.name}</span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
                {((slice.value / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
           {data.length > 7 && (
             <li className="text-xs text-gray-400 dark:text-gray-500 pt-1">...and {data.length - 7} more.</li>
           )}
        </ul>
      </div>
    </div>
  );
};

export default PieChart;