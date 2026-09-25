import { ContentType } from '@prisma/client';
import { ContentTypeListPage } from '../_shared/ContentRoutePages';

export default function CorporatePagesPage() {
  return <ContentTypeListPage type={ContentType.PAGE} />;
}
