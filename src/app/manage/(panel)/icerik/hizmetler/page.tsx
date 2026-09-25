import { ContentType } from '@prisma/client';
import { ContentTypeListPage } from '../_shared/ContentRoutePages';

export default function ServicesPage() {
  return <ContentTypeListPage type={ContentType.SERVICE} />;
}
