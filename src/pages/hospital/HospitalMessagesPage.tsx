import { RoleMessagingPanel } from '../../components/messaging/RoleMessagingPanel';
import { useAuth } from '../../context/AuthContext';

export function HospitalMessagesPage() {
  const { user } = useAuth();
  const mode = user?.role === 'Referral Hospital' ? 'referral' : 'district';

  return (
    <RoleMessagingPanel
      mode={mode}
      className="w-full max-w-[1240px] mx-auto space-y-8 animate-in fade-in duration-500"
    />
  );
}
