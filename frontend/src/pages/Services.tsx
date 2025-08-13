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
        <span className="kubelens-namespace-badge">
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
        <code className="kubelens-code kubelens-code-object">
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
          <code className="kubelens-code kubelens-code-external-ip">
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
            <div key={index} className="kubelens-port-badge">
              {port.port || port.targetPort}{port.protocol ? `/${port.protocol}` : ''}
              {port.nodePort ? `:${port.nodePort}` : ''}
            </div>
          ));
        }
        // Single port object
        return (
          <span className="kubelens-port-badge">
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
    <div className="kubelens-services">
      <div className="kubelens-services-header">
        <button 
          onClick={fetchData}
          className="kubelens-btn kubelens-btn-primary"
        >
          🔄 刷新
        </button>
      </div>

      <div className="kubelens-card kubelens-services-filters">
        <div className="kubelens-services-filter-controls">
          <div className="kubelens-search-container">
            <span className="kubelens-search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索服务..."
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
        </div>
      </div>

      <div className="kubelens-stats">
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">总计服务</div>
          <div className="kubelens-stat-value">{filteredServices.length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">ClusterIP</div>
          <div className="kubelens-stat-value">{filteredServices.filter(s => s.type === 'ClusterIP').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">NodePort</div>
          <div className="kubelens-stat-value">{filteredServices.filter(s => s.type === 'NodePort').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">LoadBalancer</div>
          <div className="kubelens-stat-value">{filteredServices.filter(s => s.type === 'LoadBalancer').length}</div>
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