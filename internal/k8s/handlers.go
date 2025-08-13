package k8s

import (
	"context"
	"fmt"
	"strings"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type NamespaceInfo struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Age    string `json:"age"`
}

type WorkloadInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Type      string `json:"type"`
	Ready     string `json:"ready"`
	Age       string `json:"age"`
}

type PodInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Ready     string `json:"ready"`
	Restarts  int32  `json:"restarts"`
	Age       string `json:"age"`
	Node      string `json:"node"`
}

type NodeInfo struct {
	Name    string `json:"name"`
	Status  string `json:"status"`
	Roles   string `json:"roles"`
	Age     string `json:"age"`
	Version string `json:"version"`
}

type EventInfo struct {
	Type      string `json:"type"`
	Reason    string `json:"reason"`
	Object    string `json:"object"`
	Message   string `json:"message"`
	Age       string `json:"age"`
	Namespace string `json:"namespace"`
}

type ServiceInfo struct {
	Name         string        `json:"name"`
	Namespace    string        `json:"namespace"`
	Type         string        `json:"type"`
	ClusterIP    string        `json:"clusterIP"`
	ExternalIPs  []string      `json:"externalIPs,omitempty"`
	Ports        []ServicePort `json:"ports"`
	Age          string        `json:"age"`
	ExternalName string        `json:"externalName,omitempty"`
	LoadBalancer string        `json:"loadBalancer,omitempty"`
}

type ServicePort struct {
	Name       string `json:"name,omitempty"`
	Protocol   string `json:"protocol"`
	Port       int32  `json:"port"`
	TargetPort string `json:"targetPort"`
	NodePort   int32  `json:"nodePort,omitempty"`
}

type IngressInfo struct {
	Name      string        `json:"name"`
	Namespace string        `json:"namespace"`
	Hosts     []string      `json:"hosts"`
	Address   string        `json:"address"`
	Ports     []IngressPort `json:"ports"`
	Age       string        `json:"age"`
}

type IngressPort struct {
	Port     int32  `json:"port"`
	Protocol string `json:"protocol"`
}

type ConfigMapInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Keys      int    `json:"keys"`
	Age       string `json:"age"`
}

type PersistentVolumeInfo struct {
	Name         string `json:"name"`
	Capacity     string `json:"capacity"`
	AccessModes  string `json:"accessModes"`
	ReclaimPolicy string `json:"reclaimPolicy"`
	Status       string `json:"status"`
	StorageClass string `json:"storageClass"`
	Age          string `json:"age"`
}

type PersistentVolumeClaimInfo struct {
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
	Status       string `json:"status"`
	Volume       string `json:"volume"`
	Capacity     string `json:"capacity"`
	AccessModes  string `json:"accessModes"`
	StorageClass string `json:"storageClass"`
	Age          string `json:"age"`
}

func (c *Client) GetNamespaces(ctx context.Context) ([]NamespaceInfo, error) {
	namespaces, err := c.Clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces: %w", err)
	}

	var result []NamespaceInfo
	for _, ns := range namespaces.Items {
		result = append(result, NamespaceInfo{
			Name:   ns.Name,
			Status: string(ns.Status.Phase),
			Age:    formatAge(ns.CreationTimestamp.Time),
		})
	}

	return result, nil
}

func (c *Client) GetPods(ctx context.Context, namespace string) ([]PodInfo, error) {
	pods, err := c.Clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	var result []PodInfo
	for _, pod := range pods.Items {
		ready := fmt.Sprintf("%d/%d", countReadyContainers(pod), len(pod.Spec.Containers))

		result = append(result, PodInfo{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			Status:    string(pod.Status.Phase),
			Ready:     ready,
			Restarts:  countRestarts(pod),
			Age:       formatAge(pod.CreationTimestamp.Time),
			Node:      pod.Spec.NodeName,
		})
	}

	return result, nil
}

func (c *Client) GetNodes(ctx context.Context) ([]NodeInfo, error) {
	nodes, err := c.Clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}

	var result []NodeInfo
	for _, node := range nodes.Items {
		status := "Unknown"
		for _, condition := range node.Status.Conditions {
			if condition.Type == corev1.NodeReady && condition.Status == corev1.ConditionTrue {
				status = "Ready"
				break
			}
		}

		roles := getRoles(node)

		result = append(result, NodeInfo{
			Name:    node.Name,
			Status:  status,
			Roles:   roles,
			Age:     formatAge(node.CreationTimestamp.Time),
			Version: node.Status.NodeInfo.KubeletVersion,
		})
	}

	return result, nil
}

func (c *Client) GetWorkloads(ctx context.Context, namespace string) ([]WorkloadInfo, error) {
	var result []WorkloadInfo

	// Get Deployments
	deployments, err := c.Clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, deploy := range deployments.Items {
			ready := fmt.Sprintf("%d/%d", deploy.Status.ReadyReplicas, deploy.Status.Replicas)
			result = append(result, WorkloadInfo{
				Name:      deploy.Name,
				Namespace: deploy.Namespace,
				Type:      "Deployment",
				Ready:     ready,
				Age:       formatAge(deploy.CreationTimestamp.Time),
			})
		}
	}

	// Get DaemonSets
	daemonsets, err := c.Clientset.AppsV1().DaemonSets(namespace).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, ds := range daemonsets.Items {
			ready := fmt.Sprintf("%d/%d", ds.Status.NumberReady, ds.Status.DesiredNumberScheduled)
			result = append(result, WorkloadInfo{
				Name:      ds.Name,
				Namespace: ds.Namespace,
				Type:      "DaemonSet",
				Ready:     ready,
				Age:       formatAge(ds.CreationTimestamp.Time),
			})
		}
	}

	// Get StatefulSets
	statefulsets, err := c.Clientset.AppsV1().StatefulSets(namespace).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, sts := range statefulsets.Items {
			ready := fmt.Sprintf("%d/%d", sts.Status.ReadyReplicas, sts.Status.Replicas)
			result = append(result, WorkloadInfo{
				Name:      sts.Name,
				Namespace: sts.Namespace,
				Type:      "StatefulSet",
				Ready:     ready,
				Age:       formatAge(sts.CreationTimestamp.Time),
			})
		}
	}

	return result, nil
}

func (c *Client) GetEvents(ctx context.Context, namespace string) ([]EventInfo, error) {
	events, err := c.Clientset.CoreV1().Events(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}

	var result []EventInfo
	for _, event := range events.Items {
		object := fmt.Sprintf("%s/%s", event.InvolvedObject.Kind, event.InvolvedObject.Name)

		result = append(result, EventInfo{
			Type:      event.Type,
			Reason:    event.Reason,
			Object:    object,
			Message:   event.Message,
			Age:       formatAge(event.CreationTimestamp.Time),
			Namespace: event.Namespace,
		})
	}

	return result, nil
}

func (c *Client) GetServices(ctx context.Context, namespace string) ([]ServiceInfo, error) {
	svcs, err := c.Clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list services: %w", err)
	}

	var result []ServiceInfo
	for _, s := range svcs.Items {
		ports := make([]ServicePort, 0, len(s.Spec.Ports))
		for _, p := range s.Spec.Ports {
			ports = append(ports, ServicePort{
				Name:       p.Name,
				Protocol:   string(p.Protocol),
				Port:       p.Port,
				TargetPort: p.TargetPort.String(),
				NodePort:   p.NodePort,
			})
		}

		lb := ""
		if s.Spec.Type == corev1.ServiceTypeLoadBalancer {
			for _, ing := range s.Status.LoadBalancer.Ingress {
				if ing.IP != "" {
					lb = ing.IP
					break
				}
				if ing.Hostname != "" {
					lb = ing.Hostname
					break
				}
			}
		}

		result = append(result, ServiceInfo{
			Name:         s.Name,
			Namespace:    s.Namespace,
			Type:         string(s.Spec.Type),
			ClusterIP:    s.Spec.ClusterIP,
			ExternalIPs:  append([]string{}, s.Spec.ExternalIPs...),
			Ports:        ports,
			Age:          formatAge(s.CreationTimestamp.Time),
			ExternalName: s.Spec.ExternalName,
			LoadBalancer: lb,
		})
	}

	return result, nil
}

func (c *Client) GetConfigMaps(ctx context.Context, namespace string) ([]ConfigMapInfo, error) {
	cms, err := c.Clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list configmaps: %w", err)
	}
	var result []ConfigMapInfo
	for _, cm := range cms.Items {
		result = append(result, ConfigMapInfo{
			Name:      cm.Name,
			Namespace: cm.Namespace,
			Keys:      len(cm.Data),
			Age:       formatAge(cm.CreationTimestamp.Time),
		})
	}
	return result, nil
}

func (c *Client) GetPVs(ctx context.Context) ([]PersistentVolumeInfo, error) {
	pvs, err := c.Clientset.CoreV1().PersistentVolumes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pvs: %w", err)
	}
	var result []PersistentVolumeInfo
	for _, pv := range pvs.Items {
		q := pv.Spec.Capacity[corev1.ResourceStorage]
		capStr := q.String()
		modes := make([]string, 0, len(pv.Spec.AccessModes))
		for _, m := range pv.Spec.AccessModes { modes = append(modes, string(m)) }
		result = append(result, PersistentVolumeInfo{
			Name:          pv.Name,
			Capacity:      capStr,
			AccessModes:   strings.Join(modes, ","),
			ReclaimPolicy: string(pv.Spec.PersistentVolumeReclaimPolicy),
			Status:        string(pv.Status.Phase),
			StorageClass:  pv.Spec.StorageClassName,
			Age:           formatAge(pv.CreationTimestamp.Time),
		})
	}
	return result, nil
}

func (c *Client) GetPVCs(ctx context.Context, namespace string) ([]PersistentVolumeClaimInfo, error) {
	pvcs, err := c.Clientset.CoreV1().PersistentVolumeClaims(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pvcs: %w", err)
	}
	var result []PersistentVolumeClaimInfo
	for _, pvc := range pvcs.Items {
		q := pvc.Status.Capacity[corev1.ResourceStorage]
		capStr := q.String()
		modes := make([]string, 0, len(pvc.Status.AccessModes))
		for _, m := range pvc.Status.AccessModes { modes = append(modes, string(m)) }
		cls := ""
		if pvc.Spec.StorageClassName != nil { cls = *pvc.Spec.StorageClassName }
		result = append(result, PersistentVolumeClaimInfo{
			Name:         pvc.Name,
			Namespace:    pvc.Namespace,
			Status:       string(pvc.Status.Phase),
			Volume:       pvc.Spec.VolumeName,
			Capacity:     capStr,
			AccessModes:  strings.Join(modes, ","),
			StorageClass: cls,
			Age:          formatAge(pvc.CreationTimestamp.Time),
		})
	}
	return result, nil
}
