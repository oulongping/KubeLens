package main

import (
	"context"
	"log"
	"os"

	"kubelens/internal/db"
	"kubelens/internal/k8s"

	"github.com/gin-gonic/gin"
)

var k8sClient *k8s.Client

func main() {
	pgURL := getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/kubelens?sslmode=disable")
	listenAddr := getenv("LISTEN_ADDR", ":8082")

	// Initialize k8s client
	var err error
	k8sClient, err = k8s.NewClient()
	if err != nil {
		log.Printf("Failed to create k8s client: %v", err)
		panic(err)
	}
	log.Printf("K8s client initialized successfully")
	// Assign k8s client to handlers
	k8s.K8sClient = k8sClient

	// connect db (optional in dev)
	store, err := db.New(pgURL)
	if err != nil {
		log.Printf("[warn] db connect error: %v (continue without DB)", err)
	} else {
		defer store.Close()
		if err := store.EnsureSchema(context.Background()); err != nil {
			log.Printf("[warn] db ensure schema error: %v (continue without DB)", err)
		}
	}

	r := gin.Default()
	r.Use(corsMiddleware())

	// Debug: log all requests
	r.Use(gin.Logger())

	// Debug: catch all unmatched routes
	r.NoRoute(func(c *gin.Context) {
		log.Printf("No route found for: %s %s", c.Request.Method, c.Request.URL.Path)
		c.JSON(404, gin.H{"error": "route not found"})
	})

	// Health
	r.GET("/api/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

	// Kubernetes endpoints
	r.GET("/api/namespaces", k8s.GetNamespacesHandlerFunc)
	r.GET("/api/workloads", k8s.GetWorkloadsHandlerFunc)
	r.GET("/api/pods", k8s.GetPodsHandlerFunc)
	r.GET("/api/nodes", k8s.GetNodesHandlerFunc)
	r.GET("/api/events", k8s.GetEventsHandlerFunc)
	r.GET("/api/metrics/nodes", k8s.GetNodeMetricsHandlerFunc)
	r.GET("/api/metrics/pods", k8s.GetPodMetricsHandlerFunc)
	r.GET("/api/services", k8s.GetServicesHandlerFunc)
	r.GET("/api/configmaps", k8s.GetConfigMapsHandlerFunc)
	r.GET("/api/pvs", k8s.GetPVsHandlerFunc)
	r.GET("/api/pvcs", k8s.GetPVCsHandlerFunc)
	r.GET("/api/summary", k8s.GetSummaryHandlerFunc)
	r.GET("/api/notifications", k8s.GetNotificationsHandlerFunc)
	r.GET("/api/pods/:namespace/:podName/logs", k8s.GetPodLogsHandlerFunc)

	log.Printf("Starting KubeLens server on %s", listenAddr)
	if err := r.Run(listenAddr); err != nil {
		log.Fatal(err)
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// Handlers defined in handlers.go
