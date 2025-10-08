import { Metadata } from 'next';
import SettingsManagement from '@/components/settings/settings-management';

export const metadata: Metadata = {
  title: 'Settings | Voice AI Call System',
  description: 'Configure system settings and TTS voice options',
};

export default function SettingsPage() {
  return <SettingsManagement />;
}