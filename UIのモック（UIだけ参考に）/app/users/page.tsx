import { Metadata } from 'next';
import CustomerManagement from '@/components/users/customer-management';

export const metadata: Metadata = {
  title: '顧客管理 | 音声AIシステム',
  description: '顧客情報と電話番号のマッピング管理',
};

export default function CustomerManagementPage() {
  return <CustomerManagement />;
}