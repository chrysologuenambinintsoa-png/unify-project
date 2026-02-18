import { GroupDetailClient } from './group-client';

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  return <GroupDetailClient groupId={groupId} />;
}
