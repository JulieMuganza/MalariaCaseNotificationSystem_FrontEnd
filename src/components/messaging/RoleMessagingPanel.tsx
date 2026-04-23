import { useEffect, useRef, useState } from 'react';
import {
  Building2Icon,
  CheckCheckIcon,
  HospitalIcon,
  SendHorizontalIcon,
  UserRoundIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

type ConversationRole =
  | 'CHW'
  | 'Health Center'
  | 'Health Post'
  | 'Local Clinic'
  | 'District Hospital'
  | 'Referral Hospital';

type MessageItem = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  senderName: string;
  senderRole: ConversationRole;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  caseRef?: string;
};

type ConversationItem = {
  id: string;
  name: string;
  role: ConversationRole;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
  messages: MessageItem[];
};

type Props = {
  mode: 'chw' | 'hc' | 'lc' | 'district' | 'referral';
  className?: string;
};

function roleIcon(role: ConversationRole) {
  if (role === 'CHW') return <UserRoundIcon size={18} />;
  if (role === 'Health Center' || role === 'Local Clinic' || role === 'Health Post')
    return <Building2Icon size={18} />;
  return <HospitalIcon size={18} />;
}

export function RoleMessagingPanel({ mode, className }: Props) {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { refreshMessageUnread } = useAuth();
  const en = language === 'en';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState('');

  const activeChat = conversations.find((c) => c.id === activeId) ?? null;

  const loadConversations = async () => {
    const res = await apiFetch<{ data: { conversations: ConversationItem[] } }>(
      '/api/v1/messages/conversations'
    );
    const loaded = res.data.conversations ?? [];
    setConversations(loaded);
    setActiveId((prev) => {
      if (prev && loaded.some((c) => c.id === prev)) return prev;
      return loaded[0]?.id ?? '';
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadConversations();
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'Could not load messages');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadConversations().catch(() => {
        // silent polling failure
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages.length]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void (async () => {
      try {
        await apiFetch('/api/v1/messages/conversations/read', {
          method: 'POST',
          body: JSON.stringify({ conversationId: activeId }),
        });
        if (!cancelled) await refreshMessageUnread();
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, refreshMessageUnread]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      await apiFetch('/api/v1/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          text: inputText.trim(),
          conversationId: activeChat.id,
        }),
      });
      setInputText('');
      await loadConversations();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const subtitle =
    mode === 'chw'
      ? en
        ? 'Case coordination messages.'
        : 'Ubutumwa bwo guhuza ubuvuzi.'
      : mode === 'hc' || mode === 'lc'
        ? en
          ? 'Messages with CHW and district hospital.'
          : 'Ubutumwa na CHW n’ibitaro by’akarere.'
        : mode === 'district'
          ? en
            ? 'Messages with health center and referral hospital.'
            : 'Ubutumwa n’ikigo nderabuzima n’ibitaro byo kohereza.'
          : en
            ? 'Messages with district hospital.'
            : 'Ubutumwa n’ibitaro by’akarere.';

  return (
    <div className={className ?? 'space-y-6'}>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">
          {en ? 'Messages' : 'Ubutumwa'}
        </h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>

      <div className="flex h-[calc(100vh-210px)] w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all lg:h-[calc(100vh-190px)]">
        <div className="flex w-full flex-col border-r border-gray-100 sm:w-80 md:w-96">
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-500">
                {en ? 'No chats yet.' : 'Nta butumwa buratangira.'}
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                    activeId === c.id ? 'bg-[color:var(--role-accent-soft)] shadow-sm' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
                        activeId === c.id
                          ? 'border-[color:var(--role-accent)] bg-[color:var(--role-accent)] text-white'
                          : 'border-gray-100 bg-white text-gray-400 group-hover:border-[color:var(--role-accent)]/25 group-hover:text-[color:var(--role-accent)]'
                      }`}
                    >
                      {roleIcon(c.role)}
                    </div>
                    {c.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`truncate text-sm font-bold ${
                          activeId === c.id ? 'text-[color:var(--role-accent)]' : 'text-gray-900'
                        }`}
                      >
                        {c.name}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium text-gray-400">
                        {c.time}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium text-gray-600">
                        {c.lastMessage || (en ? 'No messages yet' : 'Nta butumwa burajyamo')}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="hidden flex-1 flex-col bg-white sm:flex">
          <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
            {activeChat ? (
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--role-accent)]/25 bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]">
                  {roleIcon(activeChat.role)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{activeChat.name}</h3>
                    <span className="rounded-full bg-[color:var(--role-accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--role-accent)]">
                      {activeChat.role}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        activeChat.online ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    {activeChat.online
                      ? en
                        ? 'Online'
                        : 'Kuri murandasi'
                      : en
                        ? 'Offline'
                        : 'Ntabwo ari kuri murandasi'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {en ? 'Select a conversation' : 'Hitamo ikiganiro'}
              </p>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-gray-50/30 p-6">
            {activeChat?.messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex w-full ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                    m.sender === 'me'
                      ? 'rounded-tr-none bg-[color:var(--role-accent)] text-white'
                      : 'rounded-tl-none border border-gray-100 bg-white text-gray-800'
                  }`}
                >
                  <p className="text-xs font-semibold opacity-80">{m.senderName}</p>
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  {m.caseRef && (
                    <p
                      className={`mt-1 text-[10px] ${
                        m.sender === 'me' ? 'text-white/85' : 'text-gray-500'
                      }`}
                    >
                      Case: {m.caseRef}
                    </p>
                  )}
                  <div
                    className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${
                      m.sender === 'me' ? 'text-white/80' : 'text-gray-400'
                    }`}
                  >
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {m.sender === 'me' && <CheckCheckIcon size={12} />}
                  </div>
                </div>
              </motion.div>
            ))}
            {activeChat && activeChat.messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                {en ? 'No messages yet. Start the chat.' : 'Nta butumwa buragenda. Tangiza ikiganiro.'}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-white p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-2 pl-4 shadow-inner">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                disabled={!activeChat || sending}
                placeholder={en ? 'Type a message...' : 'Andika ubutumwa...'}
                className="flex-1 border-none bg-transparent py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-0 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || !activeChat || sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--role-accent)] text-white shadow-md transition hover:brightness-95 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
              >
                <SendHorizontalIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
