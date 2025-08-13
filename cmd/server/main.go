package main

import (
	"context"
	"log"
	"os"

	"kubelens/internal/db"

	"github.com/gin-gonic/gin"
)

func main() {
	pgURL := getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/kubelens?sslmode=disable")
	listenAddr := getenv("LISTEN_ADDR", ":8081")

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
	r.GET("/api/namespaces", getNamespaces)
	r.GET("/api/workloads", getWorkloads)
	r.GET("/api/pods", getPods)
	r.GET("/api/nodes", getNodes)
	r.GET("/api/events", getEvents)
	r.GET("/api/metrics/nodes", getNodeMetrics)
	r.GET("/api/metrics/pods", getPodMetrics)
	r.GET("/api/services", getServices)
	r.GET("/api/configmaps", getConfigMaps)
	r.GET("/api/pvs", getPVs)
	r.GET("/api/pvcs", getPVCs)
	// Summary endpoint for dashboard
	r.GET("/api/summary", getSummary)
	// Notifications (placeholder)
	r.GET("/api/notifications", getNotifications)

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
