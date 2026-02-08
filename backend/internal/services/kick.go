package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"multistream/backend/internal/models"
)

// KickService handles Kick API interactions (unofficial)
type KickService struct {
	BaseURL string
}

// NewKickService creates a new Kick service
func NewKickService() *KickService {
	return &KickService{
		BaseURL: "https://kick.com/api/v2",
	}
}

// KickChannelResponse represents the channel API response
type KickChannelResponse struct {
	ID   int    `json:"id"`
	Slug string `json:"slug"`
	User struct {
		Username string `json:"username"`
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
}

// KickSearchResponse for search results
type KickSearchResponse struct {
	Channels []struct {
		ID   int    `json:"id"`
		Slug string `json:"slug"`
		User struct {
			Username   string `json:"username"`
			ProfilePic string `json:"profile_pic"`
		} `json:"user"`
		Livestream *struct {
			SessionTitle string `json:"session_title"`
			IsLive       bool   `json:"is_live"`
			ViewerCount  int    `json:"viewer_count"`
		} `json:"livestream"`
	} `json:"channels"`
}

// SearchLiveStreams searches for live streams on Kick
func (s *KickService) SearchLiveStreams(query string, maxResults int) ([]models.Streamer, error) {
	// Kick's unofficial search endpoint
	searchURL := fmt.Sprintf(
		"%s/search?query=%s",
		s.BaseURL,
		url.QueryEscape(query),
	)

	client := &http.Client{}
	req, err := http.NewRequest("GET", searchURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers to look like a browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to search Kick: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// If search fails, return empty results (Kick API can be unreliable)
		return []models.Streamer{}, nil
	}

	var searchResp KickSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Convert to our Streamer model - only include live streams
	streamers := make([]models.Streamer, 0)
	for _, channel := range searchResp.Channels {
		if channel.Livestream != nil && channel.Livestream.IsLive {
			streamers = append(streamers, models.Streamer{
				ID:          fmt.Sprintf("%d", channel.ID),
				Platform:    "kick",
				Username:    channel.Slug,
				DisplayName: channel.User.Username,
				Title:       channel.Livestream.SessionTitle,
				Thumbnail:   channel.User.ProfilePic,
				ViewerCount: channel.Livestream.ViewerCount,
				IsLive:      true,
				EmbedURL:    fmt.Sprintf("https://player.kick.com/%s", channel.Slug),
				ChatURL:     fmt.Sprintf("https://kick.com/%s/chatroom", channel.Slug),
			})
		}

		if len(streamers) >= maxResults {
			break
		}
	}

	return streamers, nil
}

// GetChannelInfo gets detailed info for a specific channel
func (s *KickService) GetChannelInfo(channelSlug string) (*models.Streamer, error) {
	channelURL := fmt.Sprintf("%s/channels/%s", s.BaseURL, channelSlug)

	client := &http.Client{}
	req, err := http.NewRequest("GET", channelURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get channel info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("channel not found")
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

	return streamer, nil
}
