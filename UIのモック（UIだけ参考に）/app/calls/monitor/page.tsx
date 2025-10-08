import { Metadata } from 'next';
import CallMonitor from '@/components/calls/monitor';

export const metadata: Metadata = {
  title: 'Call Monitor | Voice AI Call System',
  description: 'Real-time monitoring of ongoing calls',
};

export default function CallMonitorPage() {
  return <CallMonitor />;
}