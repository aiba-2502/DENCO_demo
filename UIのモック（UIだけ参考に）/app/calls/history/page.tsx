import { Metadata } from 'next';
import CallHistory from '@/components/calls/history';

export const metadata: Metadata = {
  title: 'Call History | Voice AI Call System',
  description: 'View past call sessions and conversation logs',
};

export default function CallHistoryPage() {
  return <CallHistory />;
}