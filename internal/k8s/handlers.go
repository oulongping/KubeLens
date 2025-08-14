package k8s

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

var K8sClient *Client

func GetNamespacesHandlerFunc(c *gin.Context) {
	log.Printf("Received request for namespaces")
	namespaces, err := K8sClient.GetNamespaces(context.Background())
	if err != nil {
		log.Printf("Error getting namespaces: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Printf("Successfully retrieved %d namespaces", len(namespaces))
	c.JSON(http.StatusOK, gin.H{"items": namespaces})
}

func GetWorkloadsHandlerFunc(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	workloads, err := K8sClient.GetWorkloads(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": workloads})
}

func GetPodsHandlerFunc(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	pods, err := K8sClient.GetPods(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": pods})
}

func GetServicesHandlerFunc(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	svcs, err := K8sClient.GetServices(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": svcs})
}

func GetNodesHandlerFunc(c *gin.Context) {
	nodes, err := K8sClient.GetNodes(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": nodes})
}

func GetEventsHandlerFunc(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	events, err := K8sClient.GetEvents(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": events})
}

func GetNodeMetricsHandlerFunc(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"items": []map[string]interface{}{{}}})
}

func GetPodMetricsHandlerFunc(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"items": []map[string]interface{}{{}}})
}

func GetConfigMapsHandlerFunc(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	items, err := K8sClient.GetConfigMaps(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func GetPVsHandlerFunc(c *gin.Context) {
	items, err := K8sClient.GetPVs(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func GetPVCsHandlerFunc(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	items, err := K8sClient.GetPVCs(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// getNotifications returns empty list for now to avoid 404 noise
func GetSummaryHandlerFunc(c *gin.Context) {
	// Get all pods to calculate summary
	pods, err := K8sClient.GetPods(context.Background(), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get all nodes
	nodes, err := K8sClient.GetNodes(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get all services
	services, err := K8sClient.GetServices(context.Background(), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get all workloads
	workloads, err := K8sClient.GetWorkloads(context.Background(), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate running pods
	runningPods := 0
	for _, pod := range pods {
		if pod["status"] == "Running" {
			runningPods++
		}
	}

	// Calculate ready nodes
	readyNodes := 0
	for _, node := range nodes {
		if node["status"] == "Ready" {
			readyNodes++
		}
	}

	summary := gin.H{
		"totalPods":      len(pods),
		"runningPods":    runningPods,
		"totalNodes":     len(nodes),
		"readyNodes":     readyNodes,
		"totalServices":  len(services),
		"totalWorkloads": len(workloads),
	}

	c.JSON(http.StatusOK, summary)
}

func GetNotificationsHandlerFunc(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"items": []interface{}{}})
}

// GetPodLogsHandlerFunc 处理获取Pod日志的请求
func GetPodLogsHandlerFunc(c *gin.Context) {
	namespace := c.Param("namespace")
	podName := c.Param("podName")
	
	if namespace == "" || podName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "namespace and podName are required"})
		return
	}
	
	// 获取tailLines参数，默认获取最新100行
	tailLines := int64(100)
	if tailParam := c.Query("tail"); tailParam != "" {
		if parsed, err := strconv.ParseInt(tailParam, 10, 64); err == nil {
			tailLines = parsed
		}
	}
	
	logs, err := K8sClient.GetPodLogs(context.Background(), namespace, podName, &tailLines)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

// RestartWorkloadHandlerFunc 处理重启工作负载的请求
func RestartWorkloadHandlerFunc(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	kind := c.Param("kind")

	if namespace == "" || name == "" || kind == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "namespace, name and kind are required"})
		return
	}

	// 验证kind参数
	supportedKinds := map[string]bool{
		"Deployment":  true,
		"StatefulSet": true,
		"DaemonSet":   true,
	}

	if !supportedKinds[kind] {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("unsupported workload kind: %s", kind)})
		return
	}

	// 重启工作负载
	err := K8sClient.RestartWorkload(context.Background(), namespace, name, kind)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Successfully restarted %s %s in namespace %s", kind, name, namespace)})
}
