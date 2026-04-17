import React, { useEffect, useState, useRef } from 'react';
import { BellIcon, XIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
export function NotificationBell({
  variant = 'dark',
  indicator = 'count',
  disablePopover = false,
}: {
  variant?: 'dark' | 'light';
  indicator?: 'count' | 'dot';
  disablePopover?: boolean;
}) {
  const { notifications, unreadCount, markNotificationRead, user } = useAuth();
  const role = user?.role ?? null;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const roleNotifs = notifications
    .filter((n) => n.targetRole === role || role === 'Admin')
    .slice(0, 10);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const typeColors: Record<string, string> = {
    alert: 'bg-danger-100 text-danger-700 border-danger-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    success: 'bg-success-100 text-success-700 border-success-200'
  };
  const iconColor =
    variant === 'dark' ? 'text-white' : 'text-[var(--dash-text,#111827)]';
  const hoverBg =
    variant === 'dark' ? 'hover:bg-white/10' : 'hover:bg-[#F9FAFB]';
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative rounded-lg p-2 transition-colors ${hoverBg}`}
        aria-label="Notifications">
        
        <BellIcon size={20} className={iconColor} />
        {unreadCount > 0 && indicator === 'dot' && (
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white"
            aria-hidden
          />
        )}
        {unreadCount > 0 && indicator === 'count' && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger-600 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {!disablePopover && open && (
          <motion.div
          initial={{
            opacity: 0,
            y: -8,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            y: -8,
            scale: 0.95
          }}
          transition={{
            duration: 0.15
          }}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[480px] overflow-hidden">
          
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-gray-100 rounded">
              
                <XIcon size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              {roleNotifs.length === 0 ?
            <div className="p-6 text-center text-gray-500 text-sm">
                  No notifications
                </div> :

            roleNotifs.map((n) =>
            <button
              key={n.id}
              onClick={() => void markNotificationRead(n.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-teal-50/50' : ''}`}>
              
                    <div className="flex items-start gap-3">
                      <span
                  className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium border ${typeColors[n.type] || typeColors.info}`}>
                  
                        {n.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                    className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!n.read &&
                <span className="w-2 h-2 bg-teal-700 rounded-full mt-1.5 flex-shrink-0" />
                }
                    </div>
                  </button>
            )
            }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>);

}