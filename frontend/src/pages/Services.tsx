import React, { useState, useEffect } from 'react';
import Table from '../components/Table';

interface Service {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP: string;
  ports: string;
  age: string;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesResponse, namespacesResponse] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/namespaces')
      ]);
      
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.items || []);
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

  const getServiceTypeBadge = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'ClusterIP': 'default',
      'NodePort': 'warning',
      'LoadBalancer': 'success',
      'ExternalName': 'info'
    };
    return (
      <span className={`status-badge status-${typeMap[type] || 'default'}`}>
        {type}
      </span>
    );
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.namespace.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNamespace = selectedNamespace === 'all' || service.namespace === selectedNamespace;
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
      key: 'type',
      title: '类型',
      width: '120px',
      render: (value: string) => getServiceTypeBadge(value)
    },
    {
      key: 'clusterIP',
      title: '集群 IP',
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
      key: 'ports',
      title: '端口',
      width: '150px',
      render: (value: any) => {
        if (!value) return '-';
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) {
          return value.map((port: any, index: number) => (
            <div key={index} style={{ 
              display: 'inline-block',
              margin: '2px',
              padding: '2px 6px',
              background: '#e0f2fe',
              color: '#0277bd',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500
            }}>
              {port.port || port.targetPort}{port.protocol ? `/${port.protocol}` : ''}
              {port.nodePort ? `:${port.nodePort}` : ''}
            </div>
          ));
        }
        // Single port object
        return (
          <span style={{ 
            padding: '2px 6px',
            background: '#e0f2fe',
            color: '#0277bd',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500
          }}>
            {value.port || value.targetPort}{value.protocol ? `/${value.protocol}` : ''}
            {value.nodePort ? `:${value.nodePort}` : ''}
          </span>
        );
      }
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
          🌐 服务
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
          gridTemplateColumns: '1fr auto', 
          gap: '16px', 
          alignItems: 'center' 
        }}>
          <input
            type="text"
            placeholder="搜索服务..."
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
          <span>总计: <strong>{filteredServices.length}</strong> 个服务</span>
          <span>ClusterIP: <strong>{filteredServices.filter(s => s.type === 'ClusterIP').length}</strong></span>
          <span>NodePort: <strong>{filteredServices.filter(s => s.type === 'NodePort').length}</strong></span>
          <span>LoadBalancer: <strong>{filteredServices.filter(s => s.type === 'LoadBalancer').length}</strong></span>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredServices}
        loading={loading}
      />
    </div>
  );
};

export default Services;