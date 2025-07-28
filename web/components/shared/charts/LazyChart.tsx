import dynamic from "next/dynamic";
import { ComponentProps, Suspense } from "react";

// Lazy load Tremor components to reduce initial bundle size
const AreaChart = dynamic(
  () => import("@tremor/react").then((mod) => ({ default: mod.AreaChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton type="area" />,
  }
);

const BarChart = dynamic(
  () => import("@tremor/react").then((mod) => ({ default: mod.BarChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton type="bar" />,
  }
);

const LineChart = dynamic(
  () => import("@tremor/react").then((mod) => ({ default: mod.LineChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton type="line" />,
  }
);

const DonutChart = dynamic(
  () => import("@tremor/react").then((mod) => ({ default: mod.DonutChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton type="donut" />,
  }
);

const ScatterChart = dynamic(
  () => import("@tremor/react").then((mod) => ({ default: mod.ScatterChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton type="scatter" />,
  }
);

// Lazy load Recharts components
const RechartsAreaChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.AreaChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton type="area" />,
  }
);

const RechartsBarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.BarChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton type="bar" />,
  }
);

const RechartsLineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton type="line" />,
  }
);

// Chart loading skeleton component
interface ChartSkeletonProps {
  type: "area" | "bar" | "line" | "donut" | "scatter";
  height?: number;
}

const ChartSkeleton = ({ type, height = 300 }: ChartSkeletonProps) => {
  return (
    <div 
      className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-spin border-2 border-transparent border-t-gray-400"></div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading {type} chart...
        </div>
      </div>
    </div>
  );
};

// Wrapper components with proper typing
interface LazyAreaChartProps extends ComponentProps<typeof AreaChart> {}
interface LazyBarChartProps extends ComponentProps<typeof BarChart> {}
interface LazyLineChartProps extends ComponentProps<typeof LineChart> {}
interface LazyDonutChartProps extends ComponentProps<typeof DonutChart> {}
interface LazyScatterChartProps extends ComponentProps<typeof ScatterChart> {}

export const LazyAreaChart = (props: LazyAreaChartProps) => (
  <Suspense fallback={<ChartSkeleton type="area" />}>
    <AreaChart {...props} />
  </Suspense>
);

export const LazyBarChart = (props: LazyBarChartProps) => (
  <Suspense fallback={<ChartSkeleton type="bar" />}>
    <BarChart {...props} />
  </Suspense>
);

export const LazyLineChart = (props: LazyLineChartProps) => (
  <Suspense fallback={<ChartSkeleton type="line" />}>
    <LineChart {...props} />
  </Suspense>
);

export const LazyDonutChart = (props: LazyDonutChartProps) => (
  <Suspense fallback={<ChartSkeleton type="donut" />}>
    <DonutChart {...props} />
  </Suspense>
);

export const LazyScatterChart = (props: LazyScatterChartProps) => (
  <Suspense fallback={<ChartSkeleton type="scatter" />}>
    <ScatterChart {...props} />
  </Suspense>
);

// Recharts lazy components
export const LazyRechartsAreaChart = (props: ComponentProps<typeof RechartsAreaChart>) => (
  <Suspense fallback={<ChartSkeleton type="area" />}>
    <RechartsAreaChart {...props} />
  </Suspense>
);

export const LazyRechartsBarChart = (props: ComponentProps<typeof RechartsBarChart>) => (
  <Suspense fallback={<ChartSkeleton type="bar" />}>
    <RechartsBarChart {...props} />
  </Suspense>
);

export const LazyRechartsLineChart = (props: ComponentProps<typeof RechartsLineChart>) => (
  <Suspense fallback={<ChartSkeleton type="line" />}>
    <RechartsLineChart {...props} />
  </Suspense>
);

// Export all chart components for easy migration
export {
  AreaChart as TremorAreaChart,
  BarChart as TremorBarChart,
  LineChart as TremorLineChart,
  DonutChart as TremorDonutChart,
  ScatterChart as TremorScatterChart,
  RechartsAreaChart,
  RechartsBarChart,
  RechartsLineChart,
};