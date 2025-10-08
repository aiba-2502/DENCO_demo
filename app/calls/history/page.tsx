import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CallHistory = dynamicImport(() => import('@/components/calls/history'), { ssr: false });

export default function CallHistoryPage() {
  return <CallHistory />;
}