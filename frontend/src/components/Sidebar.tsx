import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const navItems: NavItem[] = [
    { path: '/', label: '总览', icon: '📊', exact: true },
    { path: '/pods', label: 'Pods', icon: '🚀' },
    { path: '/workloads', label: '工作负载', icon: '⚙️' },
    { path: '/nodes', label: '节点', icon: '🖥️' },
    { path: '/services', label: '服务', icon: '🌐' },
    { path: '/events', label: '事件', icon: '📋' }
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <div className="sidebar-logo">KubeLens</div>}
        <button 
          onClick={onToggle}
          className="kubelens-btn kubelens-btn-icon kubelens-btn-secondary"
          aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
          title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="sidebar-menu">
        {navItems.map((item) => (
          <NavLink 
            key={item.path}
            to={item.path}
            end={item.exact}
            className="sidebar-menu-item"
            title={isCollapsed ? item.label : ''}
          >
            <span>{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;