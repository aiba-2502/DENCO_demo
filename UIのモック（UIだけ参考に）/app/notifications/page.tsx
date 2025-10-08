import { Metadata } from 'next';
import NotificationSettings from '@/components/notifications/notification-settings';

export const metadata: Metadata = {
  title: '通知設定 | 音声AIシステム',
  description: '通知条件と通知方法の設定',
};

export default function NotificationSettingsPage() {
  return <NotificationSettings />;
}