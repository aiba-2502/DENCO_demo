import { Metadata } from 'next';
import KnowledgeDatabase from '@/components/knowledge/knowledge-database';

export const metadata: Metadata = {
  title: 'ナレッジデータベース | 音声AIシステム',
  description: 'お問い合わせ内容とナレッジデータベースの検索・管理',
};

export default function KnowledgeDatabasePage() {
  return <KnowledgeDatabase />;
}