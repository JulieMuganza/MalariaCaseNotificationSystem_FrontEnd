import { useLocation } from 'react-router-dom';
import { RoleMessagingPanel } from '../../components/messaging/RoleMessagingPanel';
import { hcPage } from '../../theme/appShell';

export function HCMessagesPage() {
  const { pathname } = useLocation();
  const mode = pathname.startsWith('/lc') ? 'lc' : 'hc';

  return (
    <div className={hcPage.wrap}>
      <RoleMessagingPanel mode={mode} />
    </div>
  );
}
