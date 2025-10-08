import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AICallPage = dynamicImport(() => import('./page-api'), { ssr: false });

export default function AICallPageWrapper() {
  return <AICallPage />;
}
