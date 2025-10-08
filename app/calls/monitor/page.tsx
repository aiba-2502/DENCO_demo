import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CallMonitor = dynamicImport(() => import('@/components/calls/monitor'), { ssr: false });

export default function CallMonitorPage() {
  return <CallMonitor />;
}