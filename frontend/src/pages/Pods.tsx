import React, { useState, useEffect } from 'react';
import Table from '../components/Table';

interface Pod {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  node: string;
}

const Pods: React.FC = () => {
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [podsResponse, namespacesResponse] = await Promise.all([
        fetch('/api/pods'),
        fetch('/api/namespaces')
      ]);
      
      if (podsResponse.ok) {
        const podsData = await podsResponse.json();
        setPods(podsData.items || []);
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

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Running': 'success',
      'Pending': 'warning',
      'Failed': 'error',
      'Succeeded': 'success',
      'Unknown': 'default'
    };
    return (
      <span className={`status-badge status-${statusMap[status] || 'default'}`}>
        {status}
      </span>
    );
  };

  const filteredPods = pods.filter(pod => {
    const matchesSearch = pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pod.namespace.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNamespace = selectedNamespace === 'all' || pod.namespace === selectedNamespace;
    return matchesSearch && matchesNamespace;
  });

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
      key: 'status',
      title: '状态',
      width: '120px',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'ready',
      title: '就绪',
      width: '80px'
    },
    {
      key: 'restarts',
      title: '重启次数',
      width: '100px',
      render: (value: number) => (
        <span style={{ 
          color: value > 0 ? '#f59e0b' : '#6b7280',
          fontWeight: value > 0 ? 600 : 400
        }}>
          {value}
        </span>
      )
    },
    {
      key: 'age',
      title: '运行时间',
      width: '120px'
    },
    {
      key: 'node',
      title: '节点'
    }
  ];

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
          🚀 Pods
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

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto', 
          gap: '16px', 
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="搜索 Pods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ 
                fontSize: '14px',
                width: '100%',
                paddingLeft: '36px'
              }}
            />
            <div style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#9ca3af' 
            }}>
              🔍
            </div>
          </div>
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
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          color: '#fff',
          fontSize: '14px',
          flexWrap: 'wrap'
        }}>
          <span>总计: <strong>{filteredPods.length}</strong> 个 Pod</span>
          <span>运行中: <strong>{filteredPods.filter(p => p.status === 'Running').length}</strong></span>
          <span>等待中: <strong>{filteredPods.filter(p => p.status === 'Pending').length}</strong></span>
          <span>失败: <strong>{filteredPods.filter(p => p.status === 'Failed').length}</strong></span>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredPods}
        loading={loading}
        sortable
      />
    </div>
  );
};

export default Pods;