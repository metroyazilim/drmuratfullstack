import { ContentType } from '@prisma/client';
import { ContentTypeCreatePage } from '../../_shared/ContentRoutePages';

export default function NewPostPage() {
  return <ContentTypeCreatePage type={ContentType.POST} />;
}
