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
  
  // 日志相关状态
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

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

  // 获取Pod日志
  const fetchPodLogs = async (pod: Pod) => {
    setSelectedPod(pod);
    setShowLogsModal(true);
    setLogsLoading(true);
    setLogs('');
    
    try {
      const response = await fetch(`/api/pods/${pod.namespace}/${pod.name}/logs?tail=200`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || '没有找到日志');
      } else {
        setLogs('获取日志失败');
      }
    } catch (error) {
      console.error('Failed to fetch pod logs:', error);
      setLogs('获取日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  // 关闭日志模态框
  const closeLogsModal = () => {
    setShowLogsModal(false);
    setSelectedPod(null);
    setLogs('');
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
        <span className="kubelens-namespace-badge">
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
        <span className={`kubelens-count-cell ${value > 0 ? 'kubelens-count-warning' : ''}`}>
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
    },
    {
      key: 'actions',
      title: '操作',
      width: '100px',
      render: (_: any, row: Pod) => (
        <button
          onClick={() => fetchPodLogs(row)}
          className="kubelens-btn kubelens-btn-sm kubelens-btn-secondary"
          title="查看日志"
        >
          📋 日志
        </button>
      )
    }
  ];

  return (
    <div className="kubelens-pods">
      <div className="kubelens-pods-header">
        <div className="kubelens-pods-actions">
          <button 
            onClick={fetchData}
            className="kubelens-btn kubelens-btn-primary"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="kubelens-card kubelens-pods-filters">
        <div className="kubelens-pods-filter-controls">
          <div className="kubelens-search-container">
            <input
              type="text"
              placeholder="搜索 Pods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="kubelens-input"
            />
            <div className="kubelens-search-icon">🔍</div>
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
          <div className="kubelens-stat-label">总计 Pods</div>
          <div className="kubelens-stat-value">{filteredPods.length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">运行中</div>
          <div className="kubelens-stat-value">{filteredPods.filter(p => p.status === 'Running').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">等待中</div>
          <div className="kubelens-stat-value">{filteredPods.filter(p => p.status === 'Pending').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">失败</div>
          <div className="kubelens-stat-value">{filteredPods.filter(p => p.status === 'Failed').length}</div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredPods}
        loading={loading}
        sortable
      />

      {/* 日志模态框 */}
      {showLogsModal && (
        <div className="kubelens-modal-overlay" onClick={closeLogsModal}>
          <div className="kubelens-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kubelens-modal-header">
              <h3>
                <span>📋</span>
                <span>Pod 日志 - {selectedPod?.name}</span>
              </h3>
              <button 
                onClick={closeLogsModal}
                className="kubelens-modal-close"
              >
                ✕
              </button>
            </div>
            <div className="kubelens-modal-content">
              {selectedPod && (
                <div className="kubelens-pod-info">
                  <div className="kubelens-pod-meta">
                    <span className="kubelens-namespace-badge">{selectedPod.namespace}</span>
                    <span className={`status-badge status-${
                      selectedPod.status === 'Running' ? 'success' : 
                      selectedPod.status === 'Pending' ? 'warning' : 
                      selectedPod.status === 'Failed' ? 'error' : 'default'
                    }`}>
                      {selectedPod.status}
                    </span>
                  </div>
                  <div className="kubelens-pod-details">
                    <span>节点: {selectedPod.node}</span>
                    <span>就绪: {selectedPod.ready}</span>
                    <span>重启: {selectedPod.restarts}</span>
                  </div>
                </div>
              )}
              <div className="kubelens-logs-container">
                {logsLoading ? (
                  <div className="kubelens-logs-loading">
                    <div className="kubelens-loading-spinner"></div>
                    <div>正在加载日志...</div>
                  </div>
                ) : (
                  <pre className="kubelens-logs-content">{logs}</pre>
                )}
              </div>
            </div>
            <div className="kubelens-modal-footer">
              <button 
                onClick={closeLogsModal}
                className="kubelens-btn kubelens-btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pods;