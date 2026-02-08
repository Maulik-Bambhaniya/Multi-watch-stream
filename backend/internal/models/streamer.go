package models

// Streamer represents a live streamer from any platform
type Streamer struct {
	ID          string `json:"id"`
	Platform    string `json:"platform"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Thumbnail   string `json:"thumbnail"`
	Title       string `json:"title"`
	ViewerCount int    `json:"viewerCount"`
	IsLive      bool   `json:"isLive"`
	EmbedURL    string `json:"embedUrl,omitempty"`
	ChatURL     string `json:"chatUrl,omitempty"`
}

// SearchResponse is the response for search API
type SearchResponse struct {
	Streamers []Streamer `json:"streamers"`
	Platform  string     `json:"platform"`
	Query     string     `json:"query"`
}

// StreamResponse is the response for stream info API
type StreamResponse struct {
	Streamer Streamer `json:"streamer"`
	EmbedURL string   `json:"embedUrl"`
	ChatURL  string   `json:"chatUrl"`
}

// ErrorResponse for API errors
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}
