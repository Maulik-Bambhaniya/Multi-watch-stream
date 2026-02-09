package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"multistream/backend/internal/models"
)

// KickService handles Kick API interactions (unofficial)
type KickService struct {
	BaseURL string
	Client  *http.Client
}

// NewKickService creates a new Kick service
func NewKickService() *KickService {
	return &KickService{
		BaseURL: "https://kick.com/api/v1",
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// KickChannelResponse represents the channel API response
type KickChannelResponse struct {
	ID   int    `json:"id"`
	Slug string `json:"slug"`
	User struct {
		Username   string `json:"username"`
		ProfilePic string `json:"profile_pic"`
	} `json:"user"`
	Livestream *struct {
		ID           int    `json:"id"`
		SessionTitle string `json:"session_title"`
		IsLive       bool   `json:"is_live"`
		ViewerCount  int    `json:"viewer_count"`
		Thumbnail    struct {
			URL string `json:"url"`
		} `json:"thumbnail"`
	} `json:"livestream"`
	RecentCategories []struct {
		Name string `json:"name"`
	} `json:"recent_categories"`
	Verified bool `json:"verified"`
}

// SearchChannels searches for channels on Kick
func (s *KickService) SearchChannels(query string, maxResults int) ([]models.Streamer, error) {
	// Try the channel endpoint directly for exact matches
	channel, err := s.GetChannelInfo(query)
	if err == nil && channel != nil {
		return []models.Streamer{*channel}, nil
	}

	// If exact match fails, return empty (Kick doesn't have a public search API)
	// We'll rely on YouTube for general searches
	return []models.Streamer{}, nil
}

// SearchLiveStreams searches for live streams on Kick
func (s *KickService) SearchLiveStreams(query string, maxResults int) ([]models.Streamer, error) {
	return s.SearchChannels(query, maxResults)
}

// GetChannelInfo gets detailed info for a specific channel
func (s *KickService) GetChannelInfo(channelSlug string) (*models.Streamer, error) {
	// Use v1 API for channel info
	channelURL := fmt.Sprintf("%s/channels/%s", s.BaseURL, url.PathEscape(channelSlug))

	req, err := http.NewRequest("GET", channelURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers to look like a browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Referer", "https://kick.com/")

	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get channel info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("channel not found (status %d): %s", resp.StatusCode, string(body))
	}

	var channelResp KickChannelResponse
	if err := json.NewDecoder(resp.Body).Decode(&channelResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	streamer := &models.Streamer{
		ID:          fmt.Sprintf("%d", channelResp.ID),
		Platform:    "kick",
		Username:    channelResp.Slug,
		DisplayName: channelResp.User.Username,
		Thumbnail:   channelResp.User.ProfilePic,
		IsLive:      false,
		EmbedURL:    fmt.Sprintf("https://player.kick.com/%s", channelResp.Slug),
		ChatURL:     fmt.Sprintf("https://kick.com/%s/chatroom", channelResp.Slug),
	}

	if channelResp.Livestream != nil {
		streamer.Title = channelResp.Livestream.SessionTitle
		streamer.ViewerCount = channelResp.Livestream.ViewerCount
		streamer.IsLive = channelResp.Livestream.IsLive
		if channelResp.Livestream.Thumbnail.URL != "" {
			streamer.Thumbnail = channelResp.Livestream.Thumbnail.URL
		}
	}

	// Add category info to title if no livestream title
	if streamer.Title == "" && len(channelResp.RecentCategories) > 0 {
		streamer.Title = channelResp.RecentCategories[0].Name
	}

	return streamer, nil
}
