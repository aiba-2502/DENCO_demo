import { Metadata } from 'next';
import FaxManagement from '@/components/fax/fax-management';

export const metadata: Metadata = {
  title: 'FAX管理 | 音声AIシステム',
  description: '送受信FAX文書の管理',
};

export default function FaxManagementPage() {
  return <FaxManagement />;
}