import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';


import VoiceChat from './VoiceChat';
import FloatingRobot from './FloatingRobot';
import SpeechBubble from './SpeechBubble';
import deepseekService from '../services/deepseekService';
import ttsService from '../services/ttsService';
import './MainPage.css';

const MainPage = ({ selectedPet }) => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hoveredMedia, setHoveredMedia] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isPetHovered, setIsPetHovered] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 视频ref
  const mainVideoRef = useRef(null);
  // 组件加载时播放欢迎语音
  // useEffect(() => {
  //   // 测试TTS API
  //   const testAPI = async () => {
  //     const isAPIWorking = await ttsService.testAPI();
  //     console.log('🧪 TTS API可用性:', isAPIWorking);
  //   };
    
  //   testAPI();
    
  //   const timer = setTimeout(() => {
  //     speakText('你想和聪明的小狐狸茸茸、友好的小海豚闪闪，或者呆萌的小猫头鹰绒绒做朋友吗？');
  //   }, 500);

  //   return () => clearTimeout(timer);
  // }, []);

  // 生成宠物对话消息
  const generatePetMessage = async () => {
    if (selectedPet && selectedPet.id) {
      const message = await deepseekService.generatePetProactiveChatMessage(selectedPet.id);
      setBubbleMessage(message);
      setShowBubble(true);
      
      // 5秒后隐藏气泡
      setTimeout(() => {
        setShowBubble(false);
      }, 5000);
    }
  };

  // 处理气泡点击事件
  const handleBubbleClick = async () => {
    // 打开聊天框
    handleOpenChat();
    
    // 直接发送气泡内容给大模型生成问题
    if (bubbleMessage) {
      try {
        // 设置加载状态
        setIsLoading(true);
        
        // 1. 发送气泡内容给大模型，生成问题
        const generatedQuestion = await deepseekService.generateQuestionFromBubble(bubbleMessage);
        
        // 添加用户问题到对话历史
        const userMessage = {
          role: 'user',
          content: generatedQuestion,
          timestamp: new Date().toISOString()
        };
        
        setConversationHistory(prev => [...prev, userMessage]);
        
        // 2. 发送生成的问题给大模型获取回答
        const aiResponse = await deepseekService.chatWithPet(generatedQuestion, selectedPet.id);
        
        // 添加AI回答到对话历史
        const aiMessage = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        };
        
        setConversationHistory(prev => [...prev, aiMessage]);
        
        // 3. 播放AI回答的语音
        setTimeout(() => {
          speakText(aiResponse, selectedPet.id);
        }, 500);
        
      } catch (error) {
        console.error('处理气泡点击时出错:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 初始化和定时触发宠物对话
  useEffect(() => {
    if (selectedPet && selectedPet.id) {
      // 页面加载后5秒显示第一条消息
      const initialTimer = setTimeout(() => {
        generatePetMessage();
      }, 5000);

      // 每10秒显示一条消息
      const intervalTimer = setInterval(() => {
        generatePetMessage();
      }, 10000);

      return () => {
        clearTimeout(initialTimer);
        clearInterval(intervalTimer);
      };
    }
  }, [selectedPet]);

  const speakText = async (text, petType = 'fox') => {
    try {
      console.log('🔊 MainPage speakText调用:', { text, petType });
      await ttsService.playText(text, petType);
    } catch (error) {
      console.error('❌ MainPage TTS播放失败:', error);
    }
  };

  // 媒体鼠标事件处理
  const handleMediaMouseEnter = async () => {
    console.log('🎬 Mouse enter on main pet');
    setHoveredMedia('main');

    // 使用 setTimeout 确保状态更新后再播放视频
    setTimeout(async () => {
      console.log('🎬 Attempting to play main video, ref exists:', !!mainVideoRef.current);

      if (mainVideoRef.current) {
        const video = mainVideoRef.current;
        console.log('🎬 Main video state:', {
          readyState: video.readyState,
          networkState: video.networkState,
          paused: video.paused,
          ended: video.ended,
          currentTime: video.currentTime,
          duration: video.duration,
          src: video.src
        });

        try {
          video.currentTime = 0;
          console.log('🎬 Starting main video playback...');
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('🎬 Main video started successfully');
          }
        } catch (error) {
          console.error('🎬 Main video play failed:', error);
          // 如果播放失败，不做任何处理，保持图片显示
        }
      } else {
        console.error('🎬 Main video ref is null');
      }
    }, 50);
  };

  const handleMediaMouseLeave = () => {
    setHoveredMedia(null);
    if (mainVideoRef.current) {
      try {
        mainVideoRef.current.pause();
        mainVideoRef.current.currentTime = 0;
      } catch (error) {
        console.log('Main video pause failed:', error);
      }
    }
  };

  // 如果没有选择宠物，返回选择页面
  useEffect(() => {
    if (!selectedPet) {
      navigate('/');
    }
  }, [selectedPet, navigate]);

  if (!selectedPet) {
    return null;
  }



  // 处理发送消息 (流式版本)
  const handleSendMessage = async (message, petType, onStreamChunk = null) => {
    try {
      let streamingResponse = '';

      const response = await deepseekService.sendMessageStream(
        message,
        petType,
        conversationHistory,
        (chunk) => {
          streamingResponse += chunk;
          if (onStreamChunk) {
            onStreamChunk(chunk, streamingResponse);
          }
        }
      );

      // 更新对话历史
      const newHistory = [
        ...conversationHistory,
        { sender: 'user', text: message, timestamp: new Date() },
        { sender: 'pet', text: response, timestamp: new Date() }
      ];
      setConversationHistory(newHistory);

      return response;
    } catch (error) {
      return '哎呀，我现在有点累了，稍后再聊好吗？';
    }
  };

  // 打开聊天框
  const handleOpenChat = () => {
    console.log('=== 头像点击事件触发 ===');
    console.log('当前isChatOpen状态:', isChatOpen);
    console.log('准备设置isChatOpen为true');
    setIsChatOpen(true);
    console.log('=== 头像点击事件处理完成 ===');
  };

  // 关闭聊天框
  const handleCloseChat = () => {
    setIsChatOpen(false);
  };



  // 根据选择的宠物设置主题
  const getThemeStyles = () => {
    switch (selectedPet.id) {
      case 'fox':
        return {
          background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.7) 0%, rgba(255, 142, 142, 0.7) 50%, rgba(255, 182, 182, 0.7) 100%)',
          primaryColor: '#FF6B6B',
          secondaryColor: '#FFF5F5',
          hasVideoBackground: true,
          videoSrc: '/狐狸动画.mp4'
        };
      case 'dolphin':
        return {
          background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.7) 0%, rgba(255, 142, 142, 0.7) 50%, rgba(255, 182, 182, 0.7) 100%)',
          primaryColor: '#4ECDC4',
          secondaryColor: '#F0FDFC',
          hasVideoBackground: true,
          videoSrc: '/海豚动画.mp4'
        };
      case 'owl':
        return {
          background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.7) 0%, rgba(255, 142, 142, 0.7) 50%, rgba(255, 182, 182, 0.7) 100%)',
          primaryColor: '#45B7D1',
          secondaryColor: '#F0F9FF',
          hasVideoBackground: true,
          videoSrc: '/猫头鹰动画.mp4'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          primaryColor: '#667eea',
          secondaryColor: '#f8f9ff'
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div
      className="main-page"
      style={{ background: themeStyles.background }}
    >
      {/* 视频背景 - 仅在狐狸主题时显示 */}
      {(
        <video
          className="video-background"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={themeStyles.videoSrc} type="video/mp4" />
          您的浏览器不支持视频播放。
        </video>
      )}

      {/* 主要内容区域 */}
      <div className="main-content">
        {/* 动态背景装饰 */}
        <div className="background-decorations">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="floating-element"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: themeStyles.primaryColor + '30'
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* 中央宠物展示区 */}
        <motion.div
          className="pet-showcase"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div
            className="pet-avatar-large"
            style={{
              backgroundColor: themeStyles.secondaryColor,
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={handleOpenChat}
            onMouseEnter={() => setIsPetHovered(true)}
            onMouseLeave={() => setIsPetHovered(false)}
          >
            {/* 宠物对话气泡 */}
            <SpeechBubble 
              isVisible={showBubble} 
              message={bubbleMessage} 
              petColor={themeStyles.primaryColor}
              onClick={handleBubbleClick}
            />
            
            <motion.div
              className="pet-emoji-large"
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              onMouseEnter={handleMediaMouseEnter}
              onMouseLeave={handleMediaMouseLeave}
            >
              {(
                <video
                  ref={mainVideoRef}
                  muted
                  loop
                  preload="auto"
                  src={selectedPet.id === 'fox' ? "/狐狸头像动画.mp4" : selectedPet.id === 'owl' ? "/猫头鹰头像动画.mp4" : "/海豚头像动画.mp4"}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onLoadedData={(e) => {
                    // 视频加载完成后自动播放
                    const video = e.target;
                    video.play().catch(error => {
                      console.log(`${selectedPet.id} video autoplay failed (this is normal):`, error);
                    });
                  }}
                  onError={(e) => {
                    console.error('Main video failed to load:', e.target.error);
                    console.error('Main video error details:', e);
                    // 如果视频加载失败，回退到图片
                    setHoveredMedia(null);
                  }}
                >
                  您的浏览器不支持视频播放。
                </video>

              )}
            </motion.div>

            {/* Hover提示 */}
            {isPetHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  position: 'absolute',
                  top: '-50px',
                  left: '0',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                  pointerEvents: 'none'
                }}
              >
                点击开始对话
              </motion.div>
            )}
          </div>

          <motion.div
            className="pet-welcome"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <h2>你好！我是{selectedPet.name}</h2>
            <p>{selectedPet.description}</p>
          </motion.div>
        </motion.div>

        {/* 学习模块预览 */}

      </div>

      {/* 浮动机器人助手 */}
      <FloatingRobot 
        onClick={handleOpenChat} 
        petColor={themeStyles.primaryColor}
        petType={selectedPet.id}
      />

      {/* 语音对话界面 */}
      <VoiceChat
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        selectedPet={selectedPet.id}
        onSendMessage={handleSendMessage}
        conversationHistory={conversationHistory}
      />
    </div>
  );
};

export default MainPage;