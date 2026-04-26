import { motion, AnimatePresence } from 'framer-motion';

export default function EnhancedModal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 !backdrop-blur-[12px] bg-black/40">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
        
            {/* Modal content */}
            <motion.div
              className="inline-block w-full max-w-md  overflow-hidden text-left align-middle  backdrop-blur-2xl  rounded-2xl relative z-50"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
          