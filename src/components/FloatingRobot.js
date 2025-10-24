import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import './FloatingRobot.css';

const FloatingRobot = ({ onClick, petColor = '#4A90E2' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="floating-robot"
      style={{ 
        backgroundColor: petColor,
        boxShadow: `0 4px 20px ${petColor}80`
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <MessageCircle size={24} color="white" />
    </motion.div>
  );
};

export default FloatingRobot;