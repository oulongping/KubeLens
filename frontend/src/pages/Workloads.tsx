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
        <span style={{ 
          padding: '4px 8px', 
          background: '#f3f4f6', 
          borderRadius: '4px', 
          fontSize: '12px',
          fontWeight: 500
        }}>
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
      render: (value: string) => getReadyStatus(value)
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
          ⚙️ 工作负载
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
            placeholder="搜索工作负载..."
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
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            className="select"
            style={{ minWidth: '120px' }}
          >
            <option value="all">所有类型</option>
            {workloadKinds.map(kind => (
              <option key={kind} value={kind}>{kind}</option>
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
          <span>总计: <strong>{filteredWorkloads.length}</strong> 个工作负载</span>
          <span>Deployment: <strong>{filteredWorkloads.filter(w => w.kind === 'Deployment').length}</strong></span>
          <span>StatefulSet: <strong>{filteredWorkloads.filter(w => w.kind === 'StatefulSet').length}</strong></span>
          <span>DaemonSet: <strong>{filteredWorkloads.filter(w => w.kind === 'DaemonSet').length}</strong></span>
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