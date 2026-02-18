import { PageDetailClient } from "./page-client";

export default async function PageDetailPage({ 
  params,
}: { 
  params: Promise<{ pageId: string }> 
}) {
  const { pageId } = await params;

  return <PageDetailClient pageId={pageId} />;
}
