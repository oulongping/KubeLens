package k8s

import (
	"context"
	"fmt"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
	metricsclientset "k8s.io/metrics/pkg/client/clientset/versioned"
)

type Client struct {
	Clientset     *kubernetes.Clientset
	MetricsClient *metricsclientset.Clientset
}

func NewClient() (*Client, error) {
	config, err := getKubeConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get kubeconfig: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset: %w", err)
	}

	metricsClient, err := metricsclientset.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create metrics client: %w", err)
	}

	return &Client{
		Clientset:     clientset,
		MetricsClient: metricsClient,
	}, nil
}

func getKubeConfig() (*rest.Config, error) {
	// Try in-cluster config first
	if config, err := rest.InClusterConfig(); err == nil {
		return config, nil
	}

	// Fall back to kubeconfig file
	var kubeconfig string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = filepath.Join(home, ".kube", "config")
	}

	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
	}

	return config, nil
}

// GetNamespaces returns a list of namespaces
func (c *Client) GetNamespaces(ctx context.Context) ([]map[string]interface{}, error) {
	nsList, err := c.Clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var namespaces []map[string]interface{}
	for _, ns := range nsList.Items {
		namespaces = append(namespaces, map[string]interface{}{
			"name": ns.Name,
			"age":  formatAge(ns.CreationTimestamp.Time),
		})
	}

	return namespaces, nil
}

// GetWorkloads returns a list of workloads (Deployments, StatefulSets, DaemonSets)
func (c *Client) GetWorkloads(ctx context.Context, namespace string) ([]map[string]interface{}, error) {
	var workloads []map[string]interface{}

	// Get Deployments
	deployments, err := c.Clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	for _, deploy := range deployments.Items {
		workloads = append(workloads, map[string]interface{}{
			"name":      deploy.Name,
			"namespace": deploy.Namespace,
			"kind":      "Deployment",
			"ready":     fmt.Sprintf("%d/%d", deploy.Status.ReadyReplicas, deploy.Status.Replicas),
			"age":       formatAge(deploy.CreationTimestamp.Time),
		})
	}

	// Get StatefulSets
	statefulSets, err := c.Clientset.AppsV1().StatefulSets(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	for _, sts := range statefulSets.Items {
		workloads = append(workloads, map[string]interface{}{
			"name":      sts.Name,
			"namespace": sts.Namespace,
			"kind":      "StatefulSet",
			"ready":     fmt.Sprintf("%d/%d", sts.Status.ReadyReplicas, sts.Status.Replicas),
			"age":       formatAge(sts.CreationTimestamp.Time),
		})
	}

	// Get DaemonSets
	daemonSets, err := c.Clientset.AppsV1().DaemonSets(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	for _, ds := range daemonSets.Items {
		workloads = append(workloads, map[string]interface{}{
			"name":      ds.Name,
			"namespace": ds.Namespace,
			"kind":      "DaemonSet",
			"ready":     fmt.Sprintf("%d/%d", ds.Status.NumberReady, ds.Status.DesiredNumberScheduled),
			"age":       formatAge(ds.CreationTimestamp.Time),
		})
	}

	return workloads, nil
}

// GetPods returns a list of pods
func (c *Client) GetPods(ctx context.Context, namespace string) ([]map[string]interface{}, error) {
	var podsList *corev1.PodList
	var err error

	if namespace == "" {
		podsList, err = c.Clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	} else {
		podsList, err = c.Clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	}
	if err != nil {
		return nil, err
	}

	var pods []map[string]interface{}
	for _, pod := range podsList.Items {
		pods = append(pods, map[string]interface{}{
			"name":       pod.Name,
			"namespace":  pod.Namespace,
			"status":     string(pod.Status.Phase),
			"ready":      fmt.Sprintf("%d/%d", countReadyContainers(pod), len(pod.Spec.Containers)),
			"restarts":   countRestarts(pod),
			"age":        formatAge(pod.CreationTimestamp.Time),
			"node":       pod.Spec.NodeName,
			"containers": getContainerImages(pod),
		})
	}

	return pods, nil
}

// GetServices returns a list of services
func (c *Client) GetServices(ctx context.Context, namespace string) ([]map[string]interface{}, error) {
	var svcList *corev1.ServiceList
	var err error

	if namespace == "" {
		svcList, err = c.Clientset.CoreV1().Services("").List(ctx, metav1.ListOptions{})
	} else {
		svcList, err = c.Clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	}
	if err != nil {
		return nil, err
	}

	var svcs []map[string]interface{}
	for _, svc := range svcList.Items {
		var ports []map[string]interface{}
		for _, port := range svc.Spec.Ports {
			ports = append(ports, map[string]interface{}{
				"port":       port.Port,
				"targetPort": port.TargetPort.IntVal,
				"nodePort":   port.NodePort,
				"protocol":   string(port.Protocol),
			})
		}

		svcs = append(svcs, map[string]interface{}{
			"name":       svc.Name,
			"namespace":  svc.Namespace,
			"type":       string(svc.Spec.Type),
			"clusterIP":  svc.Spec.ClusterIP,
			"externalIP": getExternalIP(svc),
			"ports":      ports,
			"age":        formatAge(svc.CreationTimestamp.Time),
		})
	}

	return svcs, nil
}

// GetNodes returns a list of nodes
func (c *Client) GetNodes(ctx context.Context) ([]map[string]interface{}, error) {
	nodesList, err := c.Clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var nodes []map[string]interface{}
	for _, node := range nodesList.Items {
		nodes = append(nodes, map[string]interface{}{
			"name":             node.Name,
			"status":           getNodeStatus(node),
			"roles":            getRoles(node),
			"age":              formatAge(node.CreationTimestamp.Time),
			"version":          node.Status.NodeInfo.KubeletVersion,
			"internalIP":       getInternalIP(node),
			"osImage":          node.Status.NodeInfo.OSImage,
			"containerRuntime": node.Status.NodeInfo.ContainerRuntimeVersion,
			"kernelVersion":    node.Status.NodeInfo.KernelVersion,
			"architecture":     node.Status.NodeInfo.Architecture,
		})
	}

	return nodes, nil
}

// GetEvents returns a list of events
func (c *Client) GetEvents(ctx context.Context, namespace string) ([]map[string]interface{}, error) {
	var eventList *corev1.EventList
	var err error

	if namespace == "" {
		eventList, err = c.Clientset.CoreV1().Events("").List(ctx, metav1.ListOptions{})
	} else {
		eventList, err = c.Clientset.CoreV1().Events(namespace).List(ctx, metav1.ListOptions{})
	}
	if err != nil {
		return nil, err
	}

	var events []map[string]interface{}
	for _, event := range eventList.Items {
		events = append(events, map[string]interface{}{
			"type":      event.Type,
			"reason":    event.Reason,
			"object":    fmt.Sprintf("%s/%s", event.InvolvedObject.Kind, event.InvolvedObject.Name),
			"message":   event.Message,
			"age":       formatAge(event.CreationTimestamp.Time),
			"namespace": event.Namespace,
		})
	}

	return events, nil
}

// GetConfigMaps returns a list of configmaps
func (c *Client) GetConfigMaps(ctx context.Context, namespace string) ([]map[string]interface{}, error) {
	var cmList *corev1.ConfigMapList
	var err error

	if namespace == "" {
		cmList, err = c.Clientset.CoreV1().ConfigMaps("").List(ctx, metav1.ListOptions{})
	} else {
		cmList, err = c.Clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
	}
	if err != nil {
		return nil, err
	}

	var cms []map[string]interface{}
	for _, cm := range cmList.Items {
		cms = append(cms, map[string]interface{}{
			"name":      cm.Name,
			"namespace": cm.Namespace,
			"age":       formatAge(cm.CreationTimestamp.Time),
		})
	}

	return cms, nil
}

// GetPVs returns a list of persistent volumes
func (c *Client) GetPVs(ctx context.Context) ([]map[string]interface{}, error) {
	pvList, err := c.Clientset.CoreV1().PersistentVolumes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var pvs []map[string]interface{}
	for _, pv := range pvList.Items {
		pvs = append(pvs, map[string]interface{}{
			"name":  pv.Name,
			"phase": string(pv.Status.Phase),
			"age":   formatAge(pv.CreationTimestamp.Time),
		})
	}

	return pvs, nil
}

// GetPVCs returns a list of persistent volume claims
func (c *Client) GetPVCs(ctx context.Context, namespace string) ([]map[string]interface{}, error) {
	var pvcList *corev1.PersistentVolumeClaimList
	var err error

	if namespace == "" {
		pvcList, err = c.Clientset.CoreV1().PersistentVolumeClaims("").List(ctx, metav1.ListOptions{})
	} else {
		pvcList, err = c.Clientset.CoreV1().PersistentVolumeClaims(namespace).List(ctx, metav1.ListOptions{})
	}
	if err != nil {
		return nil, err
	}

	var pvcs []map[string]interface{}
	for _, pvc := range pvcList.Items {
		pvcs = append(pvcs, map[string]interface{}{
			"name":      pvc.Name,
			"namespace": pvc.Namespace,
			"status":    string(pvc.Status.Phase),
			"age":       formatAge(pvc.CreationTimestamp.Time),
		})
	}

	return pvcs, nil
}

// Helper functions
func formatAge(t time.Time) string {
	duration := time.Since(t)

	if duration < time.Minute {
		return fmt.Sprintf("%ds", int(duration.Seconds()))
	} else if duration < time.Hour {
		return fmt.Sprintf("%dm", int(duration.Minutes()))
	} else if duration < 24*time.Hour {
		return fmt.Sprintf("%dh", int(duration.Hours()))
	} else {
		days := int(duration.Hours() / 24)
		return fmt.Sprintf("%dd", days)
	}
}

func countReadyContainers(pod corev1.Pod) int {
	ready := 0
	for _, status := range pod.Status.ContainerStatuses {
		if status.Ready {
			ready++
		}
	}
	return ready
}

func countRestarts(pod corev1.Pod) int32 {
	var restarts int32
	for _, status := range pod.Status.ContainerStatuses {
		restarts += status.RestartCount
	}
	return restarts
}

func getContainerImages(pod corev1.Pod) []string {
	var images []string
	for _, container := range pod.Spec.Containers {
		images = append(images, container.Image)
	}
	return images
}

func getRoles(node corev1.Node) string {
	var roles []string

	for label := range node.Labels {
		if strings.HasPrefix(label, "node-role.kubernetes.io/") {
			role := strings.TrimPrefix(label, "node-role.kubernetes.io/")
			if role != "" {
				roles = append(roles, role)
			}
		}
	}

	if len(roles) == 0 {
		return "<none>"
	}

	return strings.Join(roles, ",")
}

func getNodeStatus(node corev1.Node) string {
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady {
			if condition.Status == corev1.ConditionTrue {
				return "Ready"
			} else {
				return "NotReady"
			}
		}
	}
	return "Unknown"
}

func getInternalIP(node corev1.Node) string {
	for _, address := range node.Status.Addresses {
		if address.Type == corev1.NodeInternalIP {
			return address.Address
		}
	}
	return "<none>"
}

func getExternalIP(svc corev1.Service) string {
	if len(svc.Status.LoadBalancer.Ingress) > 0 {
		return svc.Status.LoadBalancer.Ingress[0].IP
	}
	return "<none>"
}

// GetPodLogs 获取指定Pod的日志
func (c *Client) GetPodLogs(ctx context.Context, namespace, podName string, tailLines *int64) (string, error) {
	// 设置日志获取选项
	options := &corev1.PodLogOptions{}
	if tailLines != nil {
		options.TailLines = tailLines
	}

	// 获取日志流
	req := c.Clientset.CoreV1().Pods(namespace).GetLogs(podName, options)
	logStream, err := req.Stream(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get log stream: %w", err)
	}
	defer logStream.Close()

	// 读取日志内容
	buf := make([]byte, 1024)
	var logs strings.Builder
	for {
		n, err := logStream.Read(buf)
		if n > 0 {
			logs.Write(buf[:n])
		}
		if err != nil {
			break
		}
	}

	return logs.String(), nil
}

// RestartWorkload 重启工作负载
// kind: Deployment, StatefulSet, DaemonSet
func (c *Client) RestartWorkload(ctx context.Context, namespace, name, kind string) error {
	// 添加重启注解以触发滚动更新
	annotations := map[string]string{
		"kubectl.kubernetes.io/restartedAt": time.Now().Format(time.RFC3339),
	}

	switch kind {
	case "Deployment":
		// 获取现有的Deployment
		deployment, err := c.Clientset.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
		if err != nil {
			return fmt.Errorf("failed to get deployment: %w", err)
		}

		// 更新注解
		if deployment.Spec.Template.Annotations == nil {
			deployment.Spec.Template.Annotations = make(map[string]string)
		}
		for k, v := range annotations {
			deployment.Spec.Template.Annotations[k] = v
		}

		// 更新Deployment
		_, err = c.Clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
		if err != nil {
			return fmt.Errorf("failed to update deployment: %w", err)
		}

		return nil

	case "StatefulSet":
		// 获取现有的StatefulSet
		statefulSet, err := c.Clientset.AppsV1().StatefulSets(namespace).Get(ctx, name, metav1.GetOptions{})
		if err != nil {
			return fmt.Errorf("failed to get statefulset: %w", err)
		}

		// 更新注解
		if statefulSet.Spec.Template.Annotations == nil {
			statefulSet.Spec.Template.Annotations = make(map[string]string)
		}
		for k, v := range annotations {
			statefulSet.Spec.Template.Annotations[k] = v
		}

		// 更新StatefulSet
		_, err = c.Clientset.AppsV1().StatefulSets(namespace).Update(ctx, statefulSet, metav1.UpdateOptions{})
		if err != nil {
			return fmt.Errorf("failed to update statefulset: %w", err)
		}

		return nil

	case "DaemonSet":
		// 获取现有的DaemonSet
		daemonSet, err := c.Clientset.AppsV1().DaemonSets(namespace).Get(ctx, name, metav1.GetOptions{})
		if err != nil {
			return fmt.Errorf("failed to get daemonset: %w", err)
		}

		// 更新注解
		if daemonSet.Spec.Template.Annotations == nil {
			daemonSet.Spec.Template.Annotations = make(map[string]string)
		}
		for k, v := range annotations {
			daemonSet.Spec.Template.Annotations[k] = v
		}

		// 更新DaemonSet
		_, err = c.Clientset.AppsV1().DaemonSets(namespace).Update(ctx, daemonSet, metav1.UpdateOptions{})
		if err != nil {
			return fmt.Errorf("failed to update daemonset: %w", err)
		}

		return nil

	default:
		return fmt.Errorf("unsupported workload kind: %s", kind)
	}
}
