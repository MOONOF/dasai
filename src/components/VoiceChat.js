import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X } from 'lucide-react';
import Player from 'react-lottie-player';
import './VoiceChat.css';
import deepseekService from '../services/deepseekService';
import ttsService from '../services/ttsService';

const VoiceChat = ({ 
  isOpen, 
  onClose, 
  selectedPet, 
  onSendMessage,
  conversationHistory = []
}) => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [currentText, setCurrentText] = useState('');
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // 同步外部对话历史到内部messages状态
  useEffect(() => {
    if (conversationHistory && conversationHistory.length > 0) {
      const formattedMessages = conversationHistory.map((msg, index) => ({
        id: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now() + index,
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'pet',
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));
      setMessages(formattedMessages);
    }
  }, [conversationHistory]);

  // 宠物信息配置
  const petConfig = {
    fox: {
      id: 'fox',
      name: '小狐狸',
      avatar: '🦊',
      color: '#FF6B6B',
      greeting: '你好呀！我是小狐狸，很高兴认识你！有什么想聊的吗？'
    },
    dolphin: {
      id: 'dolphin',
      name: '小海豚',
      avatar: '🐬',
      color: '#4ECDC4',
      greeting: '嗨！我是小海豚，我最喜欢和朋友们一起学习新知识啦！'
    },
    owl: {
      id: 'owl',
      name: '小猫头鹰',
      avatar: '🦉',
      color: '#45B7D1',
      greeting: '你好！我是小猫头鹰，我知道很多有趣的知识，想听听吗？'
    }
  };

  const currentPet = petConfig[selectedPet] || petConfig.fox;

  // 自动滚动到底部的函数
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // 初始化语音识别
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentText(interimTranscript);
        
        if (finalTranscript) {
          // 先显示最终识别结果，延迟一段时间后再处理消息
          setCurrentText(finalTranscript);
          setTimeout(() => {
            handleVoiceMessage(finalTranscript);
          }, 1000); // 延迟1秒，让用户看到识别结果
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // 停止TTS播放
      ttsService.stopCurrentAudio();
    };
  }, []);

  // 语音播放 - 使用TTS服务
  const speakText = useCallback(async (text) => {
    if (!isSpeaking) {
      try {
        console.log('🔊 VoiceChat speakText调用:', { text, selectedPet });
        await ttsService.playText(
          text, 
          selectedPet,
          () => {
            console.log('🎬 VoiceChat TTS播放开始');
            setIsSpeaking(true);
          },
          () => {
            console.log('🎬 VoiceChat TTS播放结束');
            setIsSpeaking(false);
          },
          (error) => {
            console.error('❌ VoiceChat TTS播放错误:', error);
            setIsSpeaking(false);
          }
        );
      } catch (error) {
        console.error('❌ VoiceChat TTS播放失败:', error);
        setIsSpeaking(false);
      }
    }
  }, [isSpeaking, selectedPet]);

  // 处理发送消息
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    
    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // 通知父组件
    if (onSendMessage) {
      onSendMessage(text);
    }
    
    // 设置处理中状态
    setIsProcessing(true);
    
    try {
      // 调用AI服务获取回复
      const response = await deepseekService.chatWithPet(text, selectedPet);
      
      // 添加AI回复消息
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'pet',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 语音播放AI回复
      speakText(response);
    } catch (error) {
      console.error('获取AI回复失败:', error);
      
      // 添加错误消息
      const errorMessage = {
        id: Date.now() + 1,
        text: '抱歉，我遇到了一点问题，请稍后再试。',
        sender: 'pet',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 监听messages变化，自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 处理语音消息
  const handleVoiceMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    // 延迟清空currentText，让用户看到识别结果
    setTimeout(() => {
      setCurrentText('');
    }, 500);

    const userMessage = {
      id: Date.now(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // 直接调用deepseekService获取AI回复，而不是使用onSendMessage回调
      const response = await deepseekService.chatWithPet(text, selectedPet);
      
      const petMessage = {
        id: Date.now() + 1,
        text: response || '哇，这个问题很有趣呢！让我想想怎么回答你...',
        sender: 'pet',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, petMessage]);
      
      // 语音播放回复
      speakText(petMessage.text);
      
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: '哎呀，我现在有点累了，稍后再聊好吗？',
        sender: 'pet',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText(errorMessage.text);
    }

    setIsProcessing(false);
  }, [selectedPet, speakText]);

  // 开始/停止语音识别
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // 如果正在播放TTS，先停止播放再开始语音识别
      if (isSpeaking) {
        console.log('🛑 停止TTS播放以启动语音识别');
        ttsService.stopCurrentAudio();
        setIsSpeaking(false);
      }
      
      recognitionRef.current.start();
      setIsListening(true);
      setCurrentText('');
    }
  };

  // 停止语音播放


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="voice-chat-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="voice-chat-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ '--pet-color': currentPet.color }}
        >
          {/* 头部控制区 */}
          <div className="voice-chat-header">
            <div className="pet-info">
              <span className="pet-avatar" style={{ width: '50px', height: '50px',borderRadius: '50%' }}>
                <img style={{ width: '100%', height: '100%', objectFit: 'cover',borderRadius: '50%' }} src={currentPet.id == 'fox' ? "/狐狸.png" : currentPet.id == 'owl' ? "/猫头鹰.png" : "/海豚.png"} alt={currentPet.name} />
              </span>
            </div>
            <div className="controls">
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* 对话显示区 */}
          <div className="messages-container" ref={messagesContainerRef}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`message ${message.sender}`}
                initial={{ opacity: 0, x: message.sender === 'user' ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="message-content">
                  {message.text}
                </div>
              </motion.div>
            ))}
            
            {/* 实时语音转文字显示 */}
            {currentText && (
              <motion.div
                className="message user interim"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="message-content">
                  {currentText}
                  <span className="typing-cursor">|</span>
                </div>
              </motion.div>
            )}

            {/* AI思考加载动画 */}
            {isProcessing && (
              <motion.div
                className="ai-thinking-indicator"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="thinking-animation">
                  <Player
                    autoplay
                    loop
                    src="/彩色加载loading2.json"
                    style={{ height: '60px', width: '60px' }}
                  />
                </div>
                <div className="thinking-text">
                  AI正在思考中...
                </div>
              </motion.div>
            )}
          </div>

          {/* 语音控制区 */}
          <div className="voice-controls">
            <motion.button
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              {isListening && (
                <motion.div 
                  className="listening-pulse"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>
            <div className="voice-hint">
              {isListening ? '正在聆听...' : '点击开始语音对话'}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceChat;