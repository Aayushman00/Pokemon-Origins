// frontend/src/pages/Game/battle/MessageLog.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Renders the accumulating list of lines for the current beat (cleared by
 * BattleSim.jsx whenever a fresh player turn begins). Replaces the old
 * single-line currentMessage plus the separate collapsed "DEVELOPER LOG"
 * accordion -- this is now the one place players see the full event text.
 */
const MessageLog = ({ lines }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="gba-message-log" ref={scrollRef}>
      {lines.map((line, index) => (
        <motion.p
          key={index}
          className="gba-dialog-text"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
};

export default MessageLog;
