import CustomerManagement from '@/components/users/customer-management';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CustomerManagementPage() {
  return <CustomerManagement />;
}