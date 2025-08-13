import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import StatCard from '../components/StatCard';

interface Summary {
  totalPods: number;
  runningPods: number;
  totalNodes: number;
  readyNodes: number;
  totalServices: number;
  totalWorkloads: number;
}

interface RecentEvent {
  type: string;
  reason: string;
  object: string;
  message: string;
  time: string;
}

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchRecentEvents = async () => {
    try {
      const response = await fetch('/api/events?limit=5');
      if (response.ok) {
        const data = await response.json();
        setRecentEvents(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent events:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchRecentEvents()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'Normal': 'success',
      'Warning': 'warning',
      'Error': 'error'
    };
    return (
      <span className={`status-badge status-${typeMap[type] || 'default'}`}>
        {type}
      </span>
    );
  };

  const columns = [
    {
      key: 'type',
      title: '类型',
      width: '100px',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'reason',
      title: '原因',
      width: '150px'
    },
    {
      key: 'object',
      title: '对象',
      width: '200px'
    },
    {
      key: 'message',
      title: '消息'
    },
    {
      key: 'time',
      title: '时间',
      width: '180px',
      render: (value: string) => new Date(value).toLocaleString('zh-CN')
    }
  ];



  if (loading) {
    return (
      <div className="kubelens-dashboard-loading">
        <div className="kubelens-table-loading">
          <div className="kubelens-loading-spinner"></div>
          <div className="kubelens-table-loading-text">正在加载集群数据...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="kubelens-dashboard">
      <div className="kubelens-dashboard-header">
        <div className="kubelens-dashboard-actions">
          <button 
            onClick={fetchData}
            className="kubelens-btn kubelens-btn-primary"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {summary && (
        <div className="kubelens-stats">
          <div className="kubelens-stat-card">
            <div className="kubelens-stat-label">Pods</div>
            <div className="kubelens-stat-value">{summary.totalPods}</div>
            <div className="kubelens-stat-subtitle">{summary.runningPods} 运行中</div>
          </div>
          <div className="kubelens-stat-card">
            <div className="kubelens-stat-label">节点</div>
            <div className="kubelens-stat-value">{summary.totalNodes}</div>
            <div className="kubelens-stat-subtitle">{summary.readyNodes} 就绪</div>
          </div>
          <div className="kubelens-stat-card">
            <div className="kubelens-stat-label">服务</div>
            <div className="kubelens-stat-value">{summary.totalServices}</div>
            <div className="kubelens-stat-subtitle">活跃服务</div>
          </div>
          <div className="kubelens-stat-card">
            <div className="kubelens-stat-label">工作负载</div>
            <div className="kubelens-stat-value">{summary.totalWorkloads}</div>
            <div className="kubelens-stat-subtitle">部署应用</div>
          </div>
        </div>
      )}

      <div className="kubelens-card">
        <h2 className="kubelens-dashboard-section-title">
          <span>📋</span>
          <span>最近事件</span>
        </h2>
        <Table
          columns={columns}
          data={recentEvents}
          sortable
        />
      </div>
    </div>
  );
};

export default Dashboard;