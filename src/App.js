import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PetSelection from './components/PetSelection';
import MainPage from './components/MainPage';
import './App.css'; 

function App() {
  const [selectedPet, setSelectedPet] = useState(null);

  return (
    <Router>
      <div className="App">
        {/* 背景视频 */}
        <div className="background-video">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
          >
            <source src="/背景视频.mp4" type="video/mp4" />
            您的浏览器不支持视频播放。
          </video>
        </div>
        
        <Routes>
          <Route 
            path="/" 
            element={
              <PetSelection 
                selectedPet={selectedPet} 
                setSelectedPet={setSelectedPet} 
              />
            } 
          />
          <Route 
            path="/main" 
            element={
              <MainPage 
                selectedPet={selectedPet} 
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;