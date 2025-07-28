// Centralized exports for lazy-loaded chart components
export {
  LazyAreaChart,
  LazyBarChart,
  LazyLineChart,
  LazyDonutChart,
  LazyScatterChart,
  LazyRechartsAreaChart,
  LazyRechartsBarChart,
  LazyRechartsLineChart,
  TremorAreaChart,
  TremorBarChart,
  TremorLineChart,
  TremorDonutChart,
  TremorScatterChart,
  RechartsAreaChart,
  RechartsBarChart,
  RechartsLineChart,
} from './LazyChart';

// Re-export common chart types for easy migration
export { LazyAreaChart as AreaChart } from './LazyChart';
export { LazyBarChart as BarChart } from './LazyChart';
export { LazyLineChart as LineChart } from './LazyChart';
export { LazyDonutChart as DonutChart } from './LazyChart';
export { LazyScatterChart as ScatterChart } from './LazyChart';