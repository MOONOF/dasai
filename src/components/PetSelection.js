import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './PetSelection.css';

// 根据宠物ID获取对应的视频源
const getPetVideoSrc = (petId) => {
  const videoMap = {
    'fox': '/狐狸头像动画.mp4',
    'dolphin': '/海豚头像动画.mp4',
    'owl': '/猫头鹰头像动画.mp4'
  };
  return videoMap[petId] || null;
};

const pets = [
  {
    id: 'fox',
    name: '小狐狸茸茸',
    personality: '聪明好奇',
    description: '善于探索发现',
    color: '#FF6B6B',
    bgColor: '#FFF5F5',
    emoji: '🦊',
    traits: ['聪明', '好奇', '探索']
  },
  {
    id: 'dolphin',
    name: '小海豚闪闪',
    personality: '友好热情',
    description: '充满鼓励能量',
    color: '#4ECDC4',
    bgColor: '#F0FDFC',
    emoji: '🐬',
    traits: ['友好', '热情', '鼓励']
  },
  {
    id: 'owl',
    name: '小猫头鹰绒绒',
    personality: '呆萌耐心',
    description: '节奏舒缓温和',
    color: '#45B7D1',
    bgColor: '#F0F9FF',
    emoji: '🦉',
    traits: ['耐心', '温和', '细致']
  }
];

const PetSelection = ({ selectedPet, setSelectedPet }) => {
  const [hoveredPet, setHoveredPet] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hoveredMedia, setHoveredMedia] = useState(null);
  const navigate = useNavigate();

  // 视频引用
  const foxVideoRef = useRef(null);
  const owlVideoRef = useRef(null);
  const patVideoRef = useRef(null);

  // 媒体控制函数
  const handleMediaMouseEnter = async (petId) => {
    console.log(`🎬 Mouse enter on ${petId} pet`);
    setHoveredMedia(petId);

    setTimeout(async () => {
      const videoRef = petId === 'fox' ? foxVideoRef : petId === 'owl' ? owlVideoRef : patVideoRef;
      console.log(`🎬 Attempting to play ${petId} video, ref exists:`, !!videoRef.current);

      if (videoRef.current) {
        const video = videoRef.current;
        console.log(`🎬 Video ${petId} state:`, {
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
          console.log(`🎬 Starting ${petId} video playback...`);
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log(`🎬 ${petId} video started successfully`);
          }
        } catch (error) {
          console.error(`🎬 ${petId} video play failed:`, error);
        }
      } else {
        console.error(`🎬 ${petId} video ref is null`);
      }
    }, 50);
  };

  const handleMediaMouseLeave = (petId) => {
    setHoveredMedia(null);
    const videoRef = petId === 'fox' ? foxVideoRef : petId === 'owl' ? owlVideoRef : patVideoRef;
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (error) {
        console.log('Video pause failed:', error);
      }
    }
  };

  // 本地音频播放函数
  const playLocalAudio = (petType) => {
    try {
      // 根据宠物类型获取对应的本地MP3文件路径
      const audioFiles = {
        'fox': '/小狐狸选择.mp3',
        'dolphin': '/小海豚选择.mp3',
        'owl': '/小猫头鹰选择.mp3'
      };

      const audioSrc = audioFiles[petType];
      if (audioSrc) {
        const audio = new Audio(audioSrc);
        audio.play().catch(error => {
          console.error('本地音频播放失败:', error);
        });
      }
    } catch (error) {
      console.error('音频播放错误:', error);
    }
  };

  const handlePetSelect = (pet) => {
    setSelectedPet(pet);
    setShowPopup(true);

    // 播放对应宠物的本地音频文件
    playLocalAudio(pet.id);
  };

  const handleStartLearning = () => {
    setShowPopup(false);
    // 暂停播放所有视频
    [foxVideoRef, owlVideoRef, patVideoRef].forEach(videoRef => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    });
    setTimeout(() => {
      navigate('/main');
    }, 500);
  };

  return (
    <div className="pet-selection">
      <motion.div
        className="selection-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className="title"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          学伴萌宠
        </motion.h1>

        <motion.p
          className="subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        > 
          寓教于乐，情智共育
        </motion.p>

        <div className="pets-grid">
          {pets.map((pet, index) => (
            <motion.div
              key={pet.id}
              className={`pet-card ${selectedPet?.id === pet.id ? 'selected' : ''}`}
              style={{
                backgroundColor: pet.bgColor,
                borderColor: pet.color
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.05,
                boxShadow: `0 10px 30px ${pet.color}40`
              }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => {
                setHoveredPet(pet.id);
                if (getPetVideoSrc(pet.id)) {
                  handleMediaMouseEnter(pet.id);
                }
              }}
              onHoverEnd={() => {
                setHoveredPet(null);
                if (getPetVideoSrc(pet.id)) {
                  handleMediaMouseLeave(pet.id);
                }
              }}
              onClick={() => handlePetSelect(pet)}
            >
              <div className="pet-avatar">
                <motion.div
                  className="pet-emoji"
                  animate={{
                    rotate: hoveredPet === pet.id ? [0, -10, 10, 0] : 0,
                    scale: hoveredPet === pet.id ? 1.1 : 1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {getPetVideoSrc(pet.id) ? (
                    <div
                      style={{ width: '100%', height: '100%', position: 'relative' }}
                    >
                      <video
                        ref={pet.id === 'fox' ? foxVideoRef : pet.id === 'owl' ? owlVideoRef : patVideoRef}
                        muted
                        loop
                        preload="auto"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        src={getPetVideoSrc(pet.id)}
                        onLoadedData={(e) => {
                          console.log(`${pet.id} video loaded and ready to play11111`);
                          // 视频加载完成后自动播放
                          const video = e.target;
                          video.play().catch(error => {
                            console.log(`${pet.id} video autoplay failed (this is normal):`, error);
                          });
                        }}
                        onError={(e) => {
                          console.error(`${pet.id} video failed to load:`, e.target.error);
                          console.error(`${pet.id} video error details:`, e);
                          setHoveredMedia(null);
                        }}
                      >
                        您的浏览器不支持视频播放。
                      </video>
                    </div>
                  ) : (
                    pet.emoji
                  )}
                </motion.div>
              </div>

              <div className="pet-info">
                <h3 className="pet-name" style={{ color: pet.color }}>
                  {pet.name}
                </h3>
                <p className="pet-personality">{pet.personality}</p>
                <p className="pet-description">{pet.description}</p>

                <div className="pet-traits">
                  {pet.traits.map((trait, idx) => (
                    <span
                      key={idx}
                      className="trait-tag"
                      style={{
                        backgroundColor: pet.color + '20',
                        color: pet.color
                      }}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {selectedPet?.id === pet.id && (
                <motion.div
                  className="selection-indicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ backgroundColor: pet.color }}
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

      </motion.div>

      {/* 卡通弹窗 */}
      <AnimatePresence>
        {showPopup && selectedPet && (
          <motion.div
            className="popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              setShowPopup(false);
              setSelectedPet(null);
              // 停止播放
              if (selectedPet.id === 'fox') {
                foxVideoRef.current.pause();
                foxVideoRef.current.currentTime = 0;
              } else if (selectedPet.id === 'owl') {
                owlVideoRef.current.pause();
                owlVideoRef.current.currentTime = 0;
              } else if (selectedPet.id === 'pat') {
                patVideoRef.current.pause();
                patVideoRef.current.currentTime = 0;
              }
            }}
          >
            <motion.div
              className="cartoon-popup"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 300,
                duration: 0.5
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗装饰 */}
              <div className="popup-decorations">
                <motion.div
                  className="star star-1"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ⭐
                </motion.div>
                <motion.div
                  className="star star-2"
                  animate={{
                    rotate: [360, 0],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="star star-3"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                >
                  💫
                </motion.div>
              </div>

              {/* 弹窗内容 */}
              <div className="popup-content">
                <motion.div
                  className="popup-pet-avatar"
                  style={{ backgroundColor: selectedPet.bgColor }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* <span className="popup-pet-emoji">{selectedPet.emoji}</span> */}
                  <div className="pet-avatar">
                    <motion.div
                      className="pet-emoji"
                      animate={{
                        rotate: hoveredPet === selectedPet.id ? [0, -10, 10, 0] : 0,
                        scale: hoveredPet === selectedPet.id ? 1.1 : 1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {getPetVideoSrc(selectedPet.id) ? (
                        <div
                          style={{ width: '100%', height: '100%', position: 'relative' }}
                        >
                          <video
                            ref={selectedPet.id === 'fox' ? foxVideoRef : selectedPet.id === 'owl' ? owlVideoRef : patVideoRef}
                            muted
                            loop
                            preload="auto"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            src={getPetVideoSrc(selectedPet.id)}
                            onLoadedData={(e) => {
                              console.log(`${selectedPet.id} video loaded and ready to play11111`);
                              // 视频加载完成后自动播放
                              const video = e.target;
                              video.play().catch(error => {
                                console.log(`${selectedPet.id} video autoplay failed (this is normal):`, error);
                              });
                            }}
                            onError={(e) => {
                              console.error(`${selectedPet.id} video failed to load:`, e.target.error);
                              console.error(`${selectedPet.id} video error details:`, e);
                              setHoveredMedia(null);
                            }}
                          >
                            您的浏览器不支持视频播放。
                          </video>
                        </div>
                      ) : (
                        selectedPet.emoji
                      )}
                    </motion.div>
                  </div>




                </motion.div>

                <motion.h2
                  className="popup-title"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  太棒了！🎉
                </motion.h2>

                <motion.p
                  className="popup-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  你选择了 <span style={{ color: selectedPet.color }}>{selectedPet.name}</span> 作为学习伙伴！
                </motion.p>

                <motion.button
                  className="start-learning-btn"
                  style={{
                    backgroundColor: selectedPet.color,
                    boxShadow: `0 4px 15px ${selectedPet.color}40`
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: `0 6px 20px ${selectedPet.color}60`
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartLearning}
                >
                  <span className="btn-icon">🚀</span>
                  开始学习
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PetSelection;