import { Metadata } from 'next';
import Dashboard from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | Voice AI Call System',
  description: 'System overview and metrics',
};

export default function Home() {
  return <Dashboard />;
}