import { ContentType } from '@prisma/client';
import { ContentTypeCreatePage } from '../../_shared/ContentRoutePages';

export default function NewTeamMemberPage() {
  return <ContentTypeCreatePage type={ContentType.TEAM} />;
}
