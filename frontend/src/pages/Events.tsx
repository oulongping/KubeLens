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
      'Created': 'success',
      'Started': 'info',
      'Pulled': 'purple',
      'Scheduled': 'cyan',
      'Failed': 'error',
      'Killing': 'warning',
      'FailedMount': 'error',
      'Unhealthy': 'warning'
    };
    const colorClass = reasonColors[reason] || 'default';
    return (
      <span className={`kubelens-reason-badge kubelens-reason-badge-${colorClass}`}>
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
        <code className="kubelens-code kubelens-code-object">
          {value}
        </code>
      )
    },
    {
      key: 'namespace',
      title: '命名空间',
      width: '120px',
      render: (value: string) => (
        <span className="kubelens-namespace-badge">
          {value || 'default'}
        </span>
      )
    },
    {
      key: 'message',
      title: '消息',
      render: (value: string) => (
        <div className="kubelens-message-cell" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'count',
      title: '次数',
      width: '80px',
      render: (value: number) => (
        <span className={`kubelens-count-cell ${value > 1 ? 'kubelens-count-warning' : ''}`}>
          {value}
        </span>
      )
    },
    {
      key: 'lastTime',
      title: '最后发生',
      width: '120px',
      render: (value: string) => (
        <span className="kubelens-time-cell">
          {formatTime(value)}
        </span>
      )
    }
  ];

  return (
    <div className="kubelens-events">
      <div className="kubelens-events-header">
        <button 
          onClick={fetchData}
          className="kubelens-btn kubelens-btn-primary"
        >
          🔄 刷新
        </button>
      </div>

      <div className="kubelens-card kubelens-events-filters">
        <div className="kubelens-events-filter-controls">
          <div className="kubelens-search-container">
            <span className="kubelens-search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索事件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="kubelens-input"
            />
          </div>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="kubelens-select"
          >
            <option value="all">所有命名空间</option>
            {namespaces.map(ns => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="kubelens-select"
          >
            <option value="all">所有类型</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="kubelens-stats">
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">总计事件</div>
          <div className="kubelens-stat-value">{filteredEvents.length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">正常</div>
          <div className="kubelens-stat-value">{filteredEvents.filter(e => e.type === 'Normal').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">警告</div>
          <div className="kubelens-stat-value">{filteredEvents.filter(e => e.type === 'Warning').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">错误</div>
          <div className="kubelens-stat-value">{filteredEvents.filter(e => e.type === 'Error').length}</div>
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