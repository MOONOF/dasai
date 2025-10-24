import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mic, 
  MicOff, 
  Sparkles,
  Heart,
  Star,
  BookOpen,
  Calculator,
  Target,
  TrendingUp,
  Play,
  Pause
} from 'lucide-react';
import Player from 'react-lottie-player';
import deepseekService from '../services/deepseekService';
import ttsService from '../services/ttsService';

import './ChatModal.css';

const ChatModal = ({ 
  isOpen, 
  onClose, 
  selectedPet, 
  onSendMessage 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [learningState, setLearningState] = useState(null);
  const [showLearningStats, setShowLearningStats] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // 宠物信息配置
  const petConfig = {
    fox: {
      name: '小狐狸',
      avatar: '🦊',
      color: '#FF6B6B',
      personality: '聪明活泼',
      greeting: '你好呀！我是小狐狸，很高兴认识你！有什么想聊的吗？'
    },
    dolphin: {
      name: '小海豚',
      avatar: '🐬',
      color: '#4ECDC4',
      personality: '友善温柔',
      greeting: '嗨！我是小海豚，我最喜欢和朋友们一起学习新知识啦！'
    },
    owl: {
      name: '小猫头鹰',
      avatar: '🦉',
      color: '#45B7D1',
      personality: '博学睿智',
      greeting: '你好！我是小猫头鹰，我知道很多有趣的知识，想听听吗？'
    }
  };

  const currentPet = petConfig[selectedPet] || petConfig.fox;

  // 初始化欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        text: currentPet.greeting,
        sender: 'pet',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // 自动朗读欢迎消息
      setTimeout(() => {
        speakText(currentPet.greeting);
      }, 1000); // 稍微延迟一下，让模态框完全打开
    }
  }, [isOpen, currentPet.greeting, messages.length]);

  // 清理语音播放
  useEffect(() => {
    return () => {
      // 停止TTS播放
      ttsService.stopCurrentAudio();
      setIsSpeaking(false);
    };
  }, [isOpen]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 组件卸载时清理语音识别
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // 获取学习状态
  useEffect(() => {
    if (isOpen) {
      const state = deepseekService.getLearningState();
      setLearningState(state);
    }
  }, [isOpen, messages]);

  // 发送消息 (支持流式显示)
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);
    setIsStreaming(true);
    setStreamingMessage('');
    
    // 发送消息后重置麦克风状态
    if (isRecording) {
      stopVoiceRecognition();
    }

    // 添加一个占位消息用于流式显示
    const streamingMessageId = Date.now() + 1;
    const initialPetMessage = {
      id: streamingMessageId,
      text: '',
      sender: 'pet',
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, initialPetMessage]);

    try {
      // 调用父组件的发送消息函数，传入流式回调
      const response = await onSendMessage(currentInput, selectedPet, (chunk, fullText) => {
        // 更新流式消息
        setStreamingMessage(fullText);
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, text: fullText }
            : msg
        ));
      });
      
      // 流式完成后的处理
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, text: response || '哇，这个问题很有趣呢！让我想想怎么回答你...', isStreaming: false }
            : msg
        ));
        setIsTyping(false);
        setIsStreaming(false);
        setStreamingMessage('');
        
        // 自动朗读AI回复
        setTimeout(() => {
          speakText(response || '哇，这个问题很有趣呢！让我想想怎么回答你...');
        }, 500);
      }, 500);
    } catch (error) {
      setTimeout(() => {
        const errorText = '哎呀，我现在有点累了，稍后再聊好吗？';
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, text: errorText, isStreaming: false }
            : msg
        ));
        setIsTyping(false);
        setIsStreaming(false);
        setStreamingMessage('');
        
        // 自动朗读错误消息
        setTimeout(() => {
          speakText(errorText);
        }, 500);
      }, 1000);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 语音录制功能（真实语音识别）
  const toggleRecording = () => {
    if (!isRecording) {
      startVoiceRecognition();
    } else {
      stopVoiceRecognition();
    }
  };

  // 开始语音识别
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别功能，请使用Chrome浏览器');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'zh-CN';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      console.log('语音识别开始');
    };

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

      // 更新输入框内容
      setInputValue(finalTranscript + interimTranscript);

      // 如果有最终结果，重置静音计时器
      if (finalTranscript) {
        resetSilenceTimer();
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      setIsRecording(false);
      clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current.onend = () => {
      console.log('语音识别结束');
      setIsRecording(false);
      clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current.start();
    resetSilenceTimer();
  };

  // 停止语音识别
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    clearTimeout(silenceTimerRef.current);
    setIsRecording(false);
  };

  // 重置静音计时器
  const resetSilenceTimer = () => {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      console.log('检测到3秒静音，自动发送消息');
      stopVoiceRecognition();
      // 如果有内容，自动发送
      if (inputValue.trim()) {
        setTimeout(() => {
          handleSendMessage();
        }, 100);
      }
    }, 3000); // 3秒静音后自动发送
  };

  // 语音朗读功能 - 使用TTS服务
  const speakText = async (text, messageId = null) => {
    try {
      console.log('🔊 ChatModal speakText调用:', { text, selectedPet, messageId });
      await ttsService.playText(
        text, 
        selectedPet,
        () => {
          console.log('🎬 ChatModal TTS播放开始');
          setIsSpeaking(true);
          if (messageId) setPlayingMessageId(messageId);
        },
        () => {
          console.log('🎬 ChatModal TTS播放结束');
          setIsSpeaking(false);
          setPlayingMessageId(null);
        },
        (error) => {
          console.error('❌ ChatModal TTS播放错误:', error);
          setIsSpeaking(false);
          setPlayingMessageId(null);
        }
      );
    } catch (error) {
      console.error('❌ ChatModal TTS播放失败:', error);
      setIsSpeaking(false);
      setPlayingMessageId(null);
    }
  };

  // 播放/暂停消息音频
  const toggleMessageAudio = async (message) => {
    // 如果当前消息正在播放，则暂停
    if (playingMessageId === message.id && isSpeaking) {
      ttsService.stopCurrentAudio();
      setIsSpeaking(false);
      setPlayingMessageId(null);
    } else {
      // 停止当前播放的音频（如果有）
      if (isSpeaking) {
        ttsService.stopCurrentAudio();
        setIsSpeaking(false);
        setPlayingMessageId(null);
      }
      // 播放新的音频
      await speakText(message.text, message.id);
    }
  };



  // 格式化时间
  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 生成语文题目
  const generateLanguageQuestion = () => {
    const questionData = deepseekService.generateLanguageQuestion();
    const message = `📚 语文练习 (难度${questionData.difficulty}/3)\n\n${questionData.question}`;
    
    const questionMessage = {
      id: Date.now(),
      text: message,
      sender: 'pet',
      timestamp: new Date(),
      isQuestion: true,
      subject: 'language',
      answer: questionData.answer
    };
    
    setMessages(prev => [...prev, questionMessage]);
    
    // 自动朗读题目
    setTimeout(() => {
      speakText(questionData.question);
    }, 500);
  };

  // 生成数学题目
  const generateMathQuestion = () => {
    const questionData = deepseekService.generateMathQuestion();
    const message = `🔢 数学练习 (难度${questionData.difficulty}/3)\n\n${questionData.question}`;
    
    const questionMessage = {
      id: Date.now(),
      text: message,
      sender: 'pet',
      timestamp: new Date(),
      isQuestion: true,
      subject: 'math',
      answer: questionData.answer
    };
    
    setMessages(prev => [...prev, questionMessage]);
    
    // 自动朗读题目
    setTimeout(() => {
      speakText(questionData.question);
    }, 500);
  };

  // 切换学习模式
  const toggleLearningMode = () => {
    setLearningMode(!learningMode);
    if (!learningMode) {
      const welcomeMessage = {
        id: Date.now(),
        text: `🎓 欢迎进入学习模式！我可以为你出语文识字题和数学加减法题。点击下面的按钮开始练习吧！`,
        sender: 'pet',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, welcomeMessage]);
      
      // 自动朗读欢迎消息
      setTimeout(() => {
        speakText(welcomeMessage.text);
      }, 500);
    }
  };

  // 切换学习统计显示
  const toggleLearningStats = () => {
    setShowLearningStats(!showLearningStats);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="chat-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="chat-modal"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{ '--pet-color': currentPet.color }}
        >
          {/* 头部 */}
          <div className="chat-header">
            <div className="pet-info">
              <div className="pet-avatar">
                <span className="pet-emoji">{currentPet.avatar}</span>
                <motion.div 
                  className="status-indicator"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="pet-details">
                <h3>{currentPet.name}</h3>
                <p>{currentPet.personality}</p>
              </div>
            </div>
            
            <div className="chat-controls">
              <motion.button
                className={`control-btn ${learningMode ? 'active' : ''}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleLearningMode}
                title="学习模式"
              >
                <BookOpen size={18} />
              </motion.button>
              
              <motion.button
                className={`control-btn ${showLearningStats ? 'active' : ''}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleLearningStats}
                title="学习统计"
              >
                <TrendingUp size={18} />
              </motion.button>
              

              
              <motion.button
                className="close-btn"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* 消息区域 */}
          <div className="chat-messages">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`message ${message.sender}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {message.sender === 'pet' && (
                  <div className="message-avatar">
                    {currentPet.avatar}
                  </div>
                )}
                
                <div className="message-content">
                  <div className={`message-bubble ${message.isStreaming ? 'streaming' : ''}`}>
                    {message.text}
                    {message.isStreaming && (
                      <motion.span
                        className="streaming-cursor"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        |
                      </motion.span>
                    )}
                    {message.sender === 'pet' && !message.isStreaming && (
                      <>
                        <div className="message-decorations">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="decoration-sparkle"
                              animate={{
                                scale: [0, 1, 0],
                                rotate: [0, 180, 360],
                                opacity: [0, 1, 0]
                              }}
                              transition={{
                                duration: 2,
                                delay: i * 0.3,
                                repeat: Infinity,
                                repeatDelay: 3
                              }}
                            >
                              <Sparkles size={8} />
                            </motion.div>
                          ))}
                        </div>
                        <motion.button
                          className={`message-audio-btn ${playingMessageId === message.id && isSpeaking ? 'playing' : ''}`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleMessageAudio(message)}
                          title={playingMessageId === message.id && isSpeaking ? '暂停播放' : '播放消息'}
                        >
                          {playingMessageId === message.id && isSpeaking ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </motion.button>
                      </>
                    )}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                
                {message.sender === 'user' && (
                  <div className="message-avatar user-avatar">
                    👤
                  </div>
                )}
              </motion.div>
            ))}
            
            {/* AI思考加载动画 */}
            {isTyping && (
              <motion.div
                className="ai-thinking-indicator"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
            
            <div ref={messagesEndRef} />
          </div>

          {/* 学习统计面板 */}
          {showLearningStats && learningState && (
            <motion.div
              className="learning-stats-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="stats-header">
                <Target size={16} />
                <span>学习统计</span>
              </div>
              <div className="stats-content">
                <div className="stat-item">
                  <span className="stat-label">总题数:</span>
                  <span className="stat-value">{learningState.totalQuestions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">正确数:</span>
                  <span className="stat-value">{learningState.correctAnswers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">总正确率:</span>
                  <span className="stat-value">{learningState.accuracy}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">近期正确率:</span>
                  <span className="stat-value">{learningState.recentAccuracy}%</span>
                </div>
                <div className="difficulty-levels">
                  <div className="difficulty-item">
                    <BookOpen size={14} />
                    <span>语文难度: {learningState.languageDifficulty}/3</span>
                  </div>
                  <div className="difficulty-item">
                    <Calculator size={14} />
                    <span>数学难度: {learningState.mathDifficulty}/3</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 输入区域 */}
          <div className="chat-input-area">
            <div className="input-container">
              <motion.button
                className={`voice-btn ${isRecording ? 'recording' : ''}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleRecording}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                {isRecording && (
                  <motion.div 
                    className="recording-pulse"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`和${currentPet.name}聊天...`}
                className="message-input"
                disabled={isRecording}
              />
              

            </div>
            
            {/* 快捷回复 */}
            <div className="quick-replies">
              {learningMode ? (
                // 学习模式下的快捷按钮
                <>
                  <motion.button
                    className="quick-reply-btn learning-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateLanguageQuestion}
                  >
                    📚 语文题
                  </motion.button>
                  <motion.button
                    className="quick-reply-btn learning-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateMathQuestion}
                  >
                    🔢 数学题
                  </motion.button>
                  <motion.button
                    className="quick-reply-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInputValue('我不会这道题')}
                  >
                    不会做
                  </motion.button>
                  <motion.button
                    className="quick-reply-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInputValue('再来一题')}
                  >
                    再来一题
                  </motion.button>
                </>
              ) : (
                // 普通聊天模式下的快捷回复
                ['你好', '今天天气怎么样？', '讲个故事吧', '我想学习'].map((reply, index) => (
                  <motion.button
                    key={index}
                    className="quick-reply-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInputValue(reply)}
                  >
                    {reply}
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* 背景装饰 */}
          <div className="chat-background-decorations">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="floating-heart"
                style={{
                  left: `${20 + i * 15}%`,
                  animationDelay: `${i * 0.5}s`
                }}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Heart size={12} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatModal;