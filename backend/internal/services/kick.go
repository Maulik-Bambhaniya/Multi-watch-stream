package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
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
	log.Printf("[Kick] Searching for: %s", query)

	// Clean the query - remove spaces and convert to lowercase for slug
	cleanQuery := strings.ToLower(strings.TrimSpace(query))
	cleanQuery = strings.ReplaceAll(cleanQuery, " ", "")

	// Try the channel endpoint directly for exact matches
	channel, err := s.GetChannelInfo(cleanQuery)
	if err == nil && channel != nil {
		log.Printf("[Kick] Found channel: %s", channel.DisplayName)
		return []models.Streamer{*channel}, nil
	}

	log.Printf("[Kick] No exact match found for: %s (error: %v)", cleanQuery, err)
	// Return empty - Kick doesn't have a public search API
	return []models.Streamer{}, nil
}

// SearchLiveStreams searches for live streams on Kick
func (s *KickService) SearchLiveStreams(query string, maxResults int) ([]models.Streamer, error) {
	return s.SearchChannels(query, maxResults)
}

// GetChannelInfo gets detailed info for a specific channel
func (s *KickService) GetChannelInfo(channelSlug string) (*models.Streamer, error) {
	// Clean the slug
	cleanSlug := strings.ToLower(strings.TrimSpace(channelSlug))
	cleanSlug = strings.ReplaceAll(cleanSlug, " ", "")

	channelURL := fmt.Sprintf("%s/channels/%s", s.BaseURL, url.PathEscape(cleanSlug))
	log.Printf("[Kick] Fetching channel: %s", channelURL)

	req, err := http.NewRequest("GET", channelURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers to look like a browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Origin", "https://kick.com")
	req.Header.Set("Referer", "https://kick.com/")

	resp, err := s.Client.Do(req)
	if err != nil {
		log.Printf("[Kick] HTTP error: %v", err)
		return nil, fmt.Errorf("failed to get channel info: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Kick] API error (status %d): %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("channel not found: %s", cleanSlug)
	}

	var channelResp KickChannelResponse
	if err := json.Unmarshal(body, &channelResp); err != nil {
		log.Printf("[Kick] JSON decode error: %v", err)
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	log.Printf("[Kick] Successfully fetched channel: %s (ID: %d)", channelResp.User.Username, channelResp.ID)

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

	if streamer.Title == "" && len(channelResp.RecentCategories) > 0 {
		streamer.Title = channelResp.RecentCategories[0].Name
	}

	if streamer.Title == "" {
		streamer.Title = channelResp.User.Username
	}

	return streamer, nil
}
