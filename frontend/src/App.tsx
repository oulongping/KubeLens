import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pods from './pages/Pods';
import Nodes from './pages/Nodes';
import Workloads from './pages/Workloads';
import Events from './pages/Events';
import Services from './pages/Services';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const location = useLocation();

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

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    padding: '16px 24px',
    minHeight: '72px',
    justifyContent: 'space-between'
  };
  
  const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const linkStyle = ({ isActive }: any) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    color: isActive ? (isDarkTheme ? '#93c5fd' : '#1d4ed8') : (isDarkTheme ? '#cbd5e1' : '#6b7280'),
    background: isActive ? (isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)') : 'transparent',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
    fontSize: '14px',
    transition: 'all 0.2s ease',
    border: isActive ? (isDarkTheme ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)') : '1px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: isDarkTheme ? '#0f172a' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  const mainStyle: React.CSSProperties = {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 72px)'
  };

  const navItems = [
    { path: '/', label: '总览', icon: '📊', exact: true },
    { path: '/pods', label: 'Pods', icon: '🚀' },
    { path: '/workloads', label: '工作负载', icon: '⚙️' },
    { path: '/nodes', label: '节点', icon: '🖥️' },
    { path: '/services', label: '服务', icon: '🌐' },
    { path: '/events', label: '事件', icon: '📋' }
  ];

  return (
    <div style={containerStyle}>
      <header className="glass-header" style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div className="gradient-text" style={{ fontSize: '24px', fontWeight: 800 }}>
            KubeLens
          </div>
          <nav style={navStyle}>
            {navItems.map((item) => (
              <NavLink 
                key={item.path}
                to={item.path}
                end={item.exact}
                style={linkStyle}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <button 
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="切换主题"
          title={`切换到${isDarkTheme ? '浅色' : '深色'}主题`}
        >
          {isDarkTheme ? '☀️' : '🌙'}
        </button>
      </header>
      <main style={mainStyle}>
        <div className="fade-in">
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