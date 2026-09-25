import { ContentType } from '@prisma/client';
import { ContentTypeListPage } from '../_shared/ContentRoutePages';

export default function PostsPage() {
  return <ContentTypeListPage type={ContentType.POST} />;
}
