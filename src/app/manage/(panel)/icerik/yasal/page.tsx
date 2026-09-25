import { ContentType } from '@prisma/client';
import { ContentTypeListPage } from '../_shared/ContentRoutePages';

export default function LegalPagesPage() {
  return <ContentTypeListPage type={ContentType.LEGAL} />;
}
