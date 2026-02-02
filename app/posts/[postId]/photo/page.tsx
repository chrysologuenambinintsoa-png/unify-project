import PhotoViewerClient from './PhotoViewerClient';

export default function Page({ params }: { params: { postId: string } }) {
  return <PhotoViewerClient postId={params.postId} />;
}
