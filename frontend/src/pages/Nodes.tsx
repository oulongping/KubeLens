import React, { useState, useEffect } from 'react';
import Table from '../components/Table';

interface Node {
  name: string;
  status: string;
  roles: string;
  age: string;
  version: string;
  internalIP: string;
  externalIP: string;
  osImage: string;
  kernelVersion: string;
  containerRuntime: string;
}

const Nodes: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/nodes');
      if (response.ok) {
        const data = await response.json();
        setNodes(data.items || []);
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
      'Ready': 'success',
      'NotReady': 'error',
      'Unknown': 'warning'
    };
    return (
      <span className={`status-badge status-${statusMap[status] || 'default'}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (roles: string) => {
    if (roles.includes('master') || roles.includes('control-plane')) {
      return (
        <span className="status-badge status-info">
          🎯 {roles}
        </span>
      );
    }
    return (
      <span className="status-badge status-default">
        🔧 {roles || 'worker'}
      </span>
    );
  };

  const filteredNodes = nodes.filter(node => {
    return node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           node.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
           node.roles.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = [
    {
      key: 'name',
      title: '名称',
      width: '200px'
    },
    {
      key: 'status',
      title: '状态',
      width: '120px',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'roles',
      title: '角色',
      width: '150px',
      render: (value: string) => getRoleBadge(value)
    },
    {
      key: 'age',
      title: '运行时间',
      width: '120px'
    },
    {
      key: 'version',
      title: 'Kubernetes 版本',
      width: '150px',
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
      key: 'internalIP',
      title: '内部 IP',
      width: '140px',
      render: (value: string) => (
        <code style={{ 
          background: '#f1f5f9', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {value || '-'}
        </code>
      )
    },
    {
      key: 'externalIP',
      title: '外部 IP',
      width: '140px',
      render: (value: string) => (
        value ? (
          <code style={{ 
            background: '#ecfdf5', 
            color: '#065f46',
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {value}
          </code>
        ) : '-'
      )
    },
    {
      key: 'osImage',
      title: '操作系统'
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
          🖥️ 节点
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
        <input
          type="text"
          placeholder="搜索节点..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input"
          style={{ fontSize: '14px', width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          color: '#fff',
          fontSize: '14px'
        }}>
          <span>总计: <strong>{filteredNodes.length}</strong> 个节点</span>
          <span>就绪: <strong>{filteredNodes.filter(n => n.status === 'Ready').length}</strong></span>
          <span>未就绪: <strong>{filteredNodes.filter(n => n.status === 'NotReady').length}</strong></span>
          <span>主节点: <strong>{filteredNodes.filter(n => n.roles.includes('master') || n.roles.includes('control-plane')).length}</strong></span>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredNodes}
        loading={loading}
      />
    </div>
  );
};

export default Nodes;