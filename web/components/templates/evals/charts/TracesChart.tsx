import { LazyAreaChart as AreaChart } from "@/components/shared/charts";


interface TracesChartProps {
  overTime: { date: string; count: number }[];
}

export const TracesChart: React.FC<TracesChartProps> = ({ overTime }) => (
  <div className="h-16 w-full">
    <AreaChart
      className="h-full"
      data={overTime}
      index="date"
      categories={["count"]}
      colors={["indigo"]}
      showXAxis={false}
      showYAxis={false}
      showLegend={false}
      showTooltip={true}
      showGridLines={false}
      curveType="monotone"
    />
  </div>
);
