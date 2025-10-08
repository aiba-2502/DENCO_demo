import { Metadata } from 'next';
import { SessionDetail } from '@/components/calls/session-detail';

export const metadata: Metadata = {
  title: 'Call Session Details | Voice AI Call System',
  description: 'Detailed view of a call session and conversation transcript',
};

// Sample call IDs for static generation
export function generateStaticParams() {
  return [
    { id: 'call-1' },
    { id: 'call-101' },
    { id: 'call-102' },
    { id: 'call-103' },
    { id: 'call-104' },
    { id: 'call-105' },
    { id: 'call-106' },
    { id: 'call-107' },
    { id: 'call-108' },
    { id: 'call-109' },
    { id: 'call-109' },
    { id: 'call-110' },
    { id: 'call-111' },
    { id: 'call-112' },
    { id: 'call-113' },
    { id: 'call-114' },
    { id: 'call-115' },
  ];
}

export default function CallSessionDetailPage({ params }: { params: { id: string } }) {
  return <SessionDetail id={params.id} />;
}