import { ContentType } from '@prisma/client';
import { ContentTypeCreatePage } from '../../_shared/ContentRoutePages';

export default function NewServicePage() {
  return <ContentTypeCreatePage type={ContentType.SERVICE} />;
}
