package config

import (
	"os"
)

// Config holds all configuration for the application
type Config struct {
	Port          string
	YouTubeAPIKey string
	Environment   string
}

// Load returns a new Config with values from environment variables
func Load() *Config {
	return &Config{
		Port:          getEnv("PORT", "8080"),
		YouTubeAPIKey: getEnv("YOUTUBE_API_KEY", ""),
		Environment:   getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
