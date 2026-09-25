import { ContentType } from '@prisma/client';
import { ContentTypeEditorPage } from '../../_shared/ContentRoutePages';

type PageProps = { params: Promise<{ id: string }> };

export default async function PostEditorPage({ params }: PageProps) {
  const { id } = await params;
  return <ContentTypeEditorPage type={ContentType.POST} id={id} />;
}
