import { ContentType } from '@prisma/client';
import { ContentTypeCreatePage } from '../../_shared/ContentRoutePages';

export default function NewLegalPage() {
  return <ContentTypeCreatePage type={ContentType.LEGAL} />;
}
