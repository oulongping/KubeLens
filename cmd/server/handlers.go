package main

import (
	"context"
	"log"
	"net/http"

	"kubelens/internal/k8s"

	"github.com/gin-gonic/gin"
)

var k8sClient *k8s.Client

func init() {
	var err error
	k8sClient, err = k8s.NewClient()
	if err != nil {
		log.Printf("Failed to create k8s client: %v", err)
		panic(err)
	}
	log.Printf("K8s client initialized successfully")
}

func getNamespaces(c *gin.Context) {
	log.Printf("Received request for namespaces")
	namespaces, err := k8sClient.GetNamespaces(context.Background())
	if err != nil {
		log.Printf("Error getting namespaces: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Printf("Successfully retrieved %d namespaces", len(namespaces))
	c.JSON(http.StatusOK, gin.H{"items": namespaces})
}

func getWorkloads(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	workloads, err := k8sClient.GetWorkloads(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": workloads})
}

func getPods(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	pods, err := k8sClient.GetPods(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": pods})
}

func getServices(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	svcs, err := k8sClient.GetServices(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": svcs})
}

func getNodes(c *gin.Context) {
	nodes, err := k8sClient.GetNodes(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": nodes})
}

func getEvents(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	events, err := k8sClient.GetEvents(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": events})
}

func getNodeMetrics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"items": []map[string]interface{}{{}}})
}

func getPodMetrics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"items": []map[string]interface{}{{}}})
}

func getConfigMaps(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	items, err := k8sClient.GetConfigMaps(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func getPVs(c *gin.Context) {
	items, err := k8sClient.GetPVs(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func getPVCs(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "")
	items, err := k8sClient.GetPVCs(context.Background(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// getNotifications returns empty list for now to avoid 404 noise
func getSummary(c *gin.Context) {
	// Get all pods to calculate summary
	pods, err := k8sClient.GetPods(context.Background(), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get all nodes
	nodes, err := k8sClient.GetNodes(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get all services
	services, err := k8sClient.GetServices(context.Background(), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get all workloads
	workloads, err := k8sClient.GetWorkloads(context.Background(), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate running pods
	runningPods := 0
	for _, pod := range pods {
		if pod.Status == "Running" {
			runningPods++
		}
	}

	// Calculate ready nodes
	readyNodes := 0
	for _, node := range nodes {
		if node.Status == "Ready" {
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

func getNotifications(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"items": []interface{}{}})
}
