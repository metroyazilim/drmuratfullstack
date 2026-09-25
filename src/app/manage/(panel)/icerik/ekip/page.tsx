import { ContentType } from '@prisma/client';
import { ContentTypeListPage } from '../_shared/ContentRoutePages';

export default function TeamPage() {
  return <ContentTypeListPage type={ContentType.TEAM} />;
}
