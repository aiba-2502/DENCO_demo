import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

const SessionDetail = dynamicImport(() => import('@/components/calls/session-detail').then(mod => ({ default: mod.SessionDetail })), { ssr: false });

export default function CallSessionDetailPage({ params }: { params: { id: string } }) {
  return <SessionDetail id={params.id} />;
}