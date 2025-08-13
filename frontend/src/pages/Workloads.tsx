import React, { useState, useEffect } from 'react';
import Table from '../components/Table';

interface Workload {
  name: string;
  namespace: string;
  kind: string;
  ready: string;
  upToDate: string;
  available: string;
  age: string;
}

const Workloads: React.FC = () => {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [selectedKind, setSelectedKind] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workloadsResponse, namespacesResponse] = await Promise.all([
        fetch('/api/workloads'),
        fetch('/api/namespaces')
      ]);
      
      if (workloadsResponse.ok) {
        const workloadsData = await workloadsResponse.json();
        setWorkloads(workloadsData.items || []);
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

  const getKindBadge = (kind: string) => {
    const kindMap: { [key: string]: { color: string; icon: string } } = {
      'Deployment': { color: 'success', icon: '🚀' },
      'StatefulSet': { color: 'info', icon: '📊' },
      'DaemonSet': { color: 'warning', icon: '⚙️' },
      'ReplicaSet': { color: 'default', icon: '📋' },
      'Job': { color: 'info', icon: '⏱️' },
      'CronJob': { color: 'warning', icon: '🕒' }
    };
    const config = kindMap[kind] || { color: 'default', icon: '📦' };
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon} {kind}
      </span>
    );
  };

  const getReadyStatus = (ready: string) => {
    const [current, desired] = ready.split('/').map(Number);
    if (isNaN(current) || isNaN(desired)) return ready;
    
    const isReady = current === desired && desired > 0;
    return (
      <span style={{ 
        color: isReady ? '#10b981' : '#f59e0b',
        fontWeight: 600
      }}>
        {ready}
      </span>
    );
  };

  const filteredWorkloads = workloads.filter(workload => {
    const matchesSearch = workload.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workload.namespace.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNamespace = selectedNamespace === 'all' || workload.namespace === selectedNamespace;
    const matchesKind = selectedKind === 'all' || workload.kind === selectedKind;
    return matchesSearch && matchesNamespace && matchesKind;
  });

  const workloadKinds = Array.from(new Set(workloads.map(w => w.kind))).sort();

  const columns = [
    {
      key: 'name',
      title: '名称',
      width: '200px'
    },
    {
      key: 'namespace',
      title: '命名空间',
      width: '150px',
      render: (value: string) => (
        <span className="kubelens-namespace-badge">
          {value}
        </span>
      )
    },
    {
      key: 'kind',
      title: '类型',
      width: '150px',
      render: (value: string) => getKindBadge(value)
    },
    {
      key: 'ready',
      title: '就绪',
      width: '100px',
      render: (value: string) => {
        const [current, desired] = value.split('/').map(Number);
        const isReady = !isNaN(current) && !isNaN(desired) && current === desired && desired > 0;
        return (
          <span className={`kubelens-ready-cell ${isReady ? 'kubelens-ready-success' : 'kubelens-ready-warning'}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'upToDate',
      title: '最新',
      width: '80px'
    },
    {
      key: 'available',
      title: '可用',
      width: '80px'
    },
    {
      key: 'age',
      title: '运行时间'
    }
  ];

  return (
    <div className="kubelens-workloads">
      <div className="kubelens-workloads-header">
        <button 
          onClick={fetchData}
          className="kubelens-btn kubelens-btn-primary"
        >
          🔄 刷新
        </button>
      </div>

      <div className="kubelens-card kubelens-workloads-filters">
        <div className="kubelens-workloads-filter-controls">
          <div className="kubelens-search-container">
            <span className="kubelens-search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索工作负载..."
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
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            className="kubelens-select"
          >
            <option value="all">所有类型</option>
            {workloadKinds.map(kind => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="kubelens-stats">
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">总计工作负载</div>
          <div className="kubelens-stat-value">{filteredWorkloads.length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">Deployment</div>
          <div className="kubelens-stat-value">{filteredWorkloads.filter(w => w.kind === 'Deployment').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">StatefulSet</div>
          <div className="kubelens-stat-value">{filteredWorkloads.filter(w => w.kind === 'StatefulSet').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">DaemonSet</div>
          <div className="kubelens-stat-value">{filteredWorkloads.filter(w => w.kind === 'DaemonSet').length}</div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredWorkloads}
        loading={loading}
      />
    </div>
  );
};

export default Workloads;