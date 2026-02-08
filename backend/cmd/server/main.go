package main

import (
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"multistream/backend/internal/config"
	"multistream/backend/internal/handlers"
	"multistream/backend/internal/services"
)

func main() {
	// Load .env file from project root (one level up from backend)
	envPath := filepath.Join("..", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Println("⚠️  No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize services
	youtubeService := services.NewYouTubeService(cfg.YouTubeAPIKey)
	kickService := services.NewKickService()

	// Initialize handlers
	searchHandler := handlers.NewSearchHandler(youtubeService, kickService)
	streamHandler := handlers.NewStreamHandler(youtubeService, kickService)

	// Create router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Root endpoint
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"name":    "MultiStream API",
			"version": "1.0.0",
			"endpoints": []string{
				"GET /api/v1/search?platform={platform}&query={query}",
				"GET /api/v1/stream/{platform}/{id}",
				"GET /api/health",
			},
		})
	})

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Health check
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
		})

		// Legacy hello endpoint
		r.Get("/hello", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"message": "Hello from MultiStream Go Backend!",
				"status":  "ok",
			})
		})

		// V1 API
		r.Route("/v1", func(r chi.Router) {
			r.Get("/search", searchHandler.Search)
			r.Get("/stream/{platform}/{id}", streamHandler.GetStream)
		})
	})

	// Start server
	addr := ":" + cfg.Port
	log.Printf("🚀 MultiStream Backend started on http://localhost%s", addr)
	log.Printf("📺 YouTube API: %s", boolToStatus(cfg.YouTubeAPIKey != ""))
	log.Printf("🟢 Kick API: enabled (unofficial)")

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}

func boolToStatus(b bool) string {
	if b {
		return "configured"
	}
	return "not configured (set YOUTUBE_API_KEY)"
}
