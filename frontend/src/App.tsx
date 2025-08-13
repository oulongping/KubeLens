import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pods from './pages/Pods';
import Nodes from './pages/Nodes';
import Workloads from './pages/Workloads';
import Events from './pages/Events';
import Services from './pages/Services';
import Sidebar from './components/Sidebar';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const fadeInRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 检查本地存储的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
      setIsDarkTheme(false);
      document.body.classList.remove('dark-theme');
    } else {
      // 如果没有保存的主题设置，根据系统偏好设置
      const systemPrefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(systemPrefersDark);
      if (systemPrefersDark) {
        document.body.classList.add('dark-theme');
      }
    }
  }, []);

  useEffect(() => {
    // 页面切换时触发动画
    if (fadeInRef.current) {
      fadeInRef.current.classList.remove('loaded');
      // 触发重排
      void fadeInRef.current.offsetWidth;
      fadeInRef.current.classList.add('loaded');
    }
  }, [location]);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    if (newTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="app-container">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="kubelens-page-title">
            {location.pathname === '/' && '📊 集群总览'}
            {location.pathname === '/pods' && '🚀 Pods'}
            {location.pathname === '/workloads' && '⚙️ 工作负载'}
            {location.pathname === '/nodes' && '🖥️ 节点'}
            {location.pathname === '/services' && '🌐 服务'}
            {location.pathname === '/events' && '📋 事件'}
          </h1>
        </div>
        <div className="topbar-right">
          <button 
            onClick={toggleTheme}
            className="kubelens-btn kubelens-btn-icon kubelens-btn-secondary"
            aria-label="切换主题"
            title={`切换到${isDarkTheme ? '浅色' : '深色'}主题`}
          >
            {isDarkTheme ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <main className="main-content">
        <div ref={fadeInRef} className="fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pods" element={<Pods />} />
            <Route path="/workloads" element={<Workloads />} />
            <Route path="/nodes" element={<Nodes />} />
            <Route path="/services" element={<Services />} />
            <Route path="/events" element={<Events />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;