import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

/**
 * 统计卡片组件
 * 用于展示关键指标数据
 * @param title - 卡片标题
 * @param value - 主要数值
 * @param subtitle - 副标题
 * @param icon - 图标
 * @param color - 颜色
 * @param trend - 趋势值
 */
const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => {
  return (
    <div className="kubelens-stat-card">
      <div className="kubelens-stat-card-icon" style={{ color }}>
        {icon}
      </div>
      <div className="kubelens-stat-card-value" style={{ color }}>
        {value}
      </div>
      <div className="kubelens-stat-card-title">{title}</div>
      {subtitle && <div className="kubelens-stat-card-subtitle">{subtitle}</div>}
      {trend !== undefined && (
        <div className={`kubelens-stat-card-trend ${trend > 0 ? 'up' : trend < 0 ? 'down' : ''}`}>
          {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;