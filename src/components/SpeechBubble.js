import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SpeechBubble.css';

const SpeechBubble = ({ isVisible, message, petColor, onClick }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="speech-bubble"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          style={{ '--pet-color': petColor }}
          onClick={onClick}
        >
          <p className="speech-bubble-text">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeechBubble;