import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SpeechBubble.css';

const SpeechBubble = ({ isVisible, message, petColor, onClick }) => {
  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div 
          className="speech-bubble"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          style={{ '--pet-color': petColor }}
          onClick={onClick}
          key={message} // 添加key以便内容变化时重新动画
        >
          <p className="speech-bubble-text">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeechBubble;