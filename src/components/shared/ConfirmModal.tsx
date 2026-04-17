import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon, XIcon } from 'lucide-react';
interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: 'teal' | 'danger' | 'amber' | 'success';
}
const colorMap = {
  teal: 'bg-teal-700 hover:bg-teal-800 text-white',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  success: 'bg-success-600 hover:bg-success-700 text-white'
};
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmColor = 'teal'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open &&
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}>
        
          <motion.div
          initial={{
            scale: 0.9,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          exit={{
            scale: 0.9,
            opacity: 0
          }}
          transition={{
            type: 'spring',
            duration: 0.3
          }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangleIcon size={20} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg">
              
                <XIcon size={18} className="text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6 ml-[52px]">{message}</p>
            <div className="flex gap-3 justify-end">
              <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
              
                Cancel
              </button>
              <button
              type="button"
              onClick={async () => {
                await Promise.resolve(onConfirm());
                onClose();
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${colorMap[confirmColor]}`}>
              
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}