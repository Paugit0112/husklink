import { motion, AnimatePresence } from "motion/react";
import { Bell, X } from "lucide-react";

interface NotificationToastProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function NotificationToast({ show, title, message, onClose }: NotificationToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed top-20 right-6 z-[9999] max-w-sm"
        >
          <div className="bg-card border-2 border-primary shadow-2xl rounded-2xl p-4 texture-grain">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-success-green rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-white animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground mb-1">{title}</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>

              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-1 bg-gradient-to-r from-primary to-success-green rounded-full mt-3"
              onAnimationComplete={onClose}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
