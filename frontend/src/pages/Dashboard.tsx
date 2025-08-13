import React, { useState, useEffect } from 'react';
import Table from '../components/Table';

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

  const StatCard = ({ title, value, subtitle, icon, color, trend }: any) => (
    <div className="card hover-lift" style={{ padding: '24px', textAlign: 'center', height: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '28px', color }}>{icon}</div>
        {trend && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '12px', 
            fontWeight: 500,
            color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#6b7280'
          }}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <div style={{ marginTop: '16px', color: '#6b7280' }}>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 800, 
          margin: 0, 
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          集群总览
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={fetchData}
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <StatCard
            title="Pods"
            value={summary.totalPods}
            subtitle={`${summary.runningPods} 运行中`}
            icon="🚀"
            color="#3b82f6"
            trend={2.5}
          />
          <StatCard
            title="节点"
            value={summary.totalNodes}
            subtitle={`${summary.readyNodes} 就绪`}
            icon="🖥️"
            color="#10b981"
            trend={0}
          />
          <StatCard
            title="服务"
            value={summary.totalServices}
            subtitle="活跃服务"
            icon="🌐"
            color="#8b5cf6"
            trend={-1.2}
          />
          <StatCard
            title="工作负载"
            value={summary.totalWorkloads}
            subtitle="部署应用"
            icon="⚙️"
            color="#f59e0b"
            trend={5.7}
          />
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 700, 
          margin: '0 0 20px 0', 
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
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