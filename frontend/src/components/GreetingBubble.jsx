import { motion, AnimatePresence } from "framer-motion";

export default function GreetingBubble({ text }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-2">
      <AnimatePresence mode="wait">
        {text ? (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="speech-bubble" role="status" aria-live="polite">
              {text}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-[24px]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
