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

// KickService handles Kick API interactions
// Note: Official Kick API requires OAuth. We use the unofficial v2 API for search.
type KickService struct {
	BaseURL string
	Client  *http.Client
}

// NewKickService creates a new Kick service
func NewKickService() *KickService {
	return &KickService{
		BaseURL: "https://kick.com/api/v2",
		Client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// KickSearchResponse represents the v2 search API response
type KickSearchResponse struct {
	Channels []KickSearchChannel `json:"channels"`
}

type KickSearchChannel struct {
	ID               int    `json:"id"`
	Username         string `json:"username"`
	Slug             string `json:"slug"`
	ProfilePic       string `json:"profile_pic"`
	IsLive           bool   `json:"is_live"`
	IsBanned         bool   `json:"is_banned"`
	ViewerCount      int    `json:"viewer_count"`
	FollowersCount   int    `json:"followers_count"`
	VerifiedChannel  bool   `json:"verified"`
	RecentCategories []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
		Slug string `json:"slug"`
	} `json:"recent_categories"`
}

// KickChannelResponse represents the v2 channel API response (for direct lookup)
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
	log.Printf("[Kick] ========== SEARCH DEBUG ==========")
	log.Printf("[Kick] Raw query received: '%s'", query)

	// Try multiple API endpoints
	endpoints := []string{
		fmt.Sprintf("https://kick.com/api/v2/search/channels?query=%s", url.QueryEscape(query)),
		fmt.Sprintf("https://kick.com/api/v1/search?query=%s", url.QueryEscape(query)),
		fmt.Sprintf("https://kick.com/api/search?query=%s", url.QueryEscape(query)),
	}

	for _, searchURL := range endpoints {
		log.Printf("[Kick] Trying: %s", searchURL)

		req, err := http.NewRequest("GET", searchURL, nil)
		if err != nil {
			continue
		}

		// Set headers to mimic browser
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		req.Header.Set("Accept", "application/json, text/plain, */*")
		req.Header.Set("Accept-Language", "en-US,en;q=0.9")
		req.Header.Set("Origin", "https://kick.com")
		req.Header.Set("Referer", "https://kick.com/search?query="+url.QueryEscape(query))

		resp, err := s.Client.Do(req)
		if err != nil {
			log.Printf("[Kick] HTTP error for %s: %v", searchURL, err)
			continue
		}

		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		log.Printf("[Kick] Response from %s: status=%d, body=%s", searchURL, resp.StatusCode, truncateString(string(body), 300))

		if resp.StatusCode == http.StatusOK && len(body) > 10 {
			// Try to parse as channel array directly
			var channels []KickSearchChannel
			if err := json.Unmarshal(body, &channels); err == nil && len(channels) > 0 {
				return s.convertChannels(channels, maxResults), nil
			}

			// Try to parse as search response with channels field
			var searchResp KickSearchResponse
			if err := json.Unmarshal(body, &searchResp); err == nil && len(searchResp.Channels) > 0 {
				return s.convertChannels(searchResp.Channels, maxResults), nil
			}
		}
	}

	// Fallback: try direct channel lookup
	log.Printf("[Kick] All search endpoints failed, trying direct channel lookup")
	return s.fallbackDirectLookup(query)
}

func (s *KickService) convertChannels(channels []KickSearchChannel, maxResults int) []models.Streamer {
	streamers := make([]models.Streamer, 0, len(channels))
	for i, ch := range channels {
		if i >= maxResults {
			break
		}

		title := ch.Username
		if len(ch.RecentCategories) > 0 {
			title = ch.RecentCategories[0].Name
		}

		slug := ch.Slug
		if slug == "" {
			slug = strings.ToLower(ch.Username)
		}

		streamers = append(streamers, models.Streamer{
			ID:          fmt.Sprintf("%d", ch.ID),
			Platform:    "kick",
			Username:    slug,
			DisplayName: ch.Username,
			Title:       title,
			Thumbnail:   ch.ProfilePic,
			ViewerCount: ch.ViewerCount,
			IsLive:      ch.IsLive,
			EmbedURL:    fmt.Sprintf("https://player.kick.com/%s", slug),
			ChatURL:     fmt.Sprintf("https://kick.com/%s/chatroom", slug),
		})
	}
	return streamers
}

// fallbackDirectLookup tries to find a channel by direct slug lookup
func (s *KickService) fallbackDirectLookup(query string) ([]models.Streamer, error) {
	log.Printf("[Kick] Trying fallback: direct channel lookup for '%s'", query)

	cleanQuery := strings.ToLower(strings.TrimSpace(query))
	cleanQuery = strings.ReplaceAll(cleanQuery, " ", "")

	channel, err := s.GetChannelInfo(cleanQuery)
	if err != nil {
		log.Printf("[Kick] Fallback failed: %v", err)
		return []models.Streamer{}, nil
	}

	return []models.Streamer{*channel}, nil
}

// SearchLiveStreams searches for live streams on Kick
func (s *KickService) SearchLiveStreams(query string, maxResults int) ([]models.Streamer, error) {
	return s.SearchChannels(query, maxResults)
}

// GetChannelInfo gets detailed info for a specific channel by slug
func (s *KickService) GetChannelInfo(channelSlug string) (*models.Streamer, error) {
	cleanSlug := strings.ToLower(strings.TrimSpace(channelSlug))
	cleanSlug = strings.ReplaceAll(cleanSlug, " ", "")

	// Try v2 channels endpoint
	channelURL := fmt.Sprintf("https://kick.com/api/v2/channels/%s", url.PathEscape(cleanSlug))
	log.Printf("[Kick] Fetching channel: %s", channelURL)

	req, err := http.NewRequest("GET", channelURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

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
	log.Printf("[Kick] Channel response (status %d): %s", resp.StatusCode, truncateString(string(body), 300))

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("channel not found: %s (status %d)", cleanSlug, resp.StatusCode)
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

// truncateString helper
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
