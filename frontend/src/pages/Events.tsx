import React, { useState, useEffect } from 'react';
import Table from '../components/Table';

interface Event {
  type: string;
  reason: string;
  object: string;
  message: string;
  count: number;
  firstTime: string;
  lastTime: string;
  namespace: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsResponse, namespacesResponse] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/namespaces')
      ]);
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.items || []);
      }
      
      if (namespacesResponse.ok) {
        const namespacesData = await namespacesResponse.json();
        setNamespaces(namespacesData.items?.map((ns: any) => ns.name) || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTypeBadge = (type: string) => {
    const typeMap: { [key: string]: { color: string; icon: string } } = {
      'Normal': { color: 'success', icon: '✅' },
      'Warning': { color: 'warning', icon: '⚠️' },
      'Error': { color: 'error', icon: '❌' }
    };
    const config = typeMap[type] || { color: 'default', icon: 'ℹ️' };
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon} {type}
      </span>
    );
  };

  const getReasonBadge = (reason: string) => {
    const reasonColors: { [key: string]: string } = {
      'Created': '#10b981',
      'Started': '#3b82f6',
      'Pulled': '#8b5cf6',
      'Scheduled': '#06b6d4',
      'Failed': '#ef4444',
      'Killing': '#f59e0b',
      'FailedMount': '#ef4444',
      'Unhealthy': '#f59e0b'
    };
    const color = reasonColors[reason] || '#6b7280';
    return (
      <span style={{ 
        padding: '4px 8px', 
        background: `${color}15`, 
        color: color,
        borderRadius: '4px', 
        fontSize: '12px',
        fontWeight: 500,
        border: `1px solid ${color}30`
      }}>
        {reason}
      </span>
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNamespace = selectedNamespace === 'all' || event.namespace === selectedNamespace;
    const matchesType = selectedType === 'all' || event.type === selectedType;
    return matchesSearch && matchesNamespace && matchesType;
  });

  const eventTypes = Array.from(new Set(events.map(e => e.type))).sort();

  const columns = [
    {
      key: 'type',
      title: '类型',
      width: '120px',
      render: (value: string) => getTypeBadge(value)
    },
    {
      key: 'reason',
      title: '原因',
      width: '150px',
      render: (value: string) => getReasonBadge(value)
    },
    {
      key: 'object',
      title: '对象',
      width: '200px',
      render: (value: string) => (
        <code style={{ 
          background: '#f1f5f9', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {value}
        </code>
      )
    },
    {
      key: 'namespace',
      title: '命名空间',
      width: '120px',
      render: (value: string) => (
        <span style={{ 
          padding: '4px 8px', 
          background: '#f3f4f6', 
          borderRadius: '4px', 
          fontSize: '12px',
          fontWeight: 500
        }}>
          {value || 'default'}
        </span>
      )
    },
    {
      key: 'message',
      title: '消息',
      render: (value: string) => (
        <div style={{ 
          maxWidth: '300px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '13px'
        }} title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'count',
      title: '次数',
      width: '80px',
      render: (value: number) => (
        <span style={{ 
          color: value > 1 ? '#f59e0b' : '#6b7280',
          fontWeight: value > 1 ? 600 : 400
        }}>
          {value}
        </span>
      )
    },
    {
      key: 'lastTime',
      title: '最后发生',
      width: '120px',
      render: (value: string) => (
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {formatTime(value)}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 800, 
          margin: 0, 
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          📋 事件
        </h1>
        <button 
          onClick={fetchData}
          className="btn btn-primary"
          style={{ padding: '12px 24px' }}
        >
          🔄 刷新
        </button>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto auto', 
          gap: '16px', 
          alignItems: 'center' 
        }}>
          <input
            type="text"
            placeholder="搜索事件..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ fontSize: '14px' }}
          />
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="select"
            style={{ minWidth: '150px' }}
          >
            <option value="all">所有命名空间</option>
            {namespaces.map(ns => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="select"
            style={{ minWidth: '120px' }}
          >
            <option value="all">所有类型</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          color: '#fff',
          fontSize: '14px'
        }}>
          <span>总计: <strong>{filteredEvents.length}</strong> 个事件</span>
          <span>正常: <strong>{filteredEvents.filter(e => e.type === 'Normal').length}</strong></span>
          <span>警告: <strong>{filteredEvents.filter(e => e.type === 'Warning').length}</strong></span>
          <span>错误: <strong>{filteredEvents.filter(e => e.type === 'Error').length}</strong></span>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredEvents}
        loading={loading}
      />
    </div>
  );
};

export default Events;