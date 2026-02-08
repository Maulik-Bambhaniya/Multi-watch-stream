package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"multistream/backend/internal/models"
)

// YouTubeService handles YouTube Data API interactions
type YouTubeService struct {
	APIKey  string
	BaseURL string
}

// NewYouTubeService creates a new YouTube service
func NewYouTubeService(apiKey string) *YouTubeService {
	return &YouTubeService{
		APIKey:  apiKey,
		BaseURL: "https://www.googleapis.com/youtube/v3",
	}
}

// YouTubeSearchResponse represents the API response
type YouTubeSearchResponse struct {
	Items []struct {
		ID struct {
			VideoID   string `json:"videoId"`
			ChannelID string `json:"channelId"`
		} `json:"id"`
		Snippet struct {
			ChannelID            string `json:"channelId"`
			ChannelTitle         string `json:"channelTitle"`
			Title                string `json:"title"`
			Description          string `json:"description"`
			LiveBroadcastContent string `json:"liveBroadcastContent"`
			Thumbnails           struct {
				Default struct {
					URL string `json:"url"`
				} `json:"default"`
				Medium struct {
					URL string `json:"url"`
				} `json:"medium"`
				High struct {
					URL string `json:"url"`
				} `json:"high"`
			} `json:"thumbnails"`
		} `json:"snippet"`
	} `json:"items"`
}

// YouTubeVideoResponse for video details
type YouTubeVideoResponse struct {
	Items []struct {
		ID                   string `json:"id"`
		LiveStreamingDetails struct {
			ConcurrentViewers string `json:"concurrentViewers"`
		} `json:"liveStreamingDetails"`
	} `json:"items"`
}

// SearchLiveStreams searches for live streams on YouTube
func (s *YouTubeService) SearchLiveStreams(query string, maxResults int) ([]models.Streamer, error) {
	if s.APIKey == "" {
		return nil, fmt.Errorf("YouTube API key not configured")
	}

	// Build search URL
	searchURL := fmt.Sprintf(
		"%s/search?part=snippet&type=video&eventType=live&q=%s&maxResults=%d&key=%s",
		s.BaseURL,
		url.QueryEscape(query),
		maxResults,
		s.APIKey,
	)

	resp, err := http.Get(searchURL)
	if err != nil {
		return nil, fmt.Errorf("failed to search YouTube: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("YouTube API error: status %d", resp.StatusCode)
	}

	var searchResp YouTubeSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Convert to our Streamer model
	streamers := make([]models.Streamer, 0, len(searchResp.Items))
	for _, item := range searchResp.Items {
		thumbnail := item.Snippet.Thumbnails.High.URL
		if thumbnail == "" {
			thumbnail = item.Snippet.Thumbnails.Medium.URL
		}

		streamers = append(streamers, models.Streamer{
			ID:          item.ID.VideoID,
			Platform:    "youtube",
			Username:    item.Snippet.ChannelID,
			DisplayName: item.Snippet.ChannelTitle,
			Title:       item.Snippet.Title,
			Thumbnail:   thumbnail,
			IsLive:      item.Snippet.LiveBroadcastContent == "live",
			EmbedURL:    fmt.Sprintf("https://www.youtube.com/embed/%s?autoplay=1", item.ID.VideoID),
			ChatURL:     fmt.Sprintf("https://www.youtube.com/live_chat?v=%s&embed_domain=localhost", item.ID.VideoID),
		})
	}

	return streamers, nil
}

// GetStreamInfo gets detailed info for a specific stream
func (s *YouTubeService) GetStreamInfo(videoID string) (*models.Streamer, error) {
	if s.APIKey == "" {
		return nil, fmt.Errorf("YouTube API key not configured")
	}

	// Get video details
	videoURL := fmt.Sprintf(
		"%s/videos?part=snippet,liveStreamingDetails&id=%s&key=%s",
		s.BaseURL,
		videoID,
		s.APIKey,
	)

	resp, err := http.Get(videoURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get video info: %w", err)
	}
	defer resp.Body.Close()

	var videoResp struct {
		Items []struct {
			ID      string `json:"id"`
			Snippet struct {
				ChannelID    string `json:"channelId"`
				ChannelTitle string `json:"channelTitle"`
				Title        string `json:"title"`
				Thumbnails   struct {
					High struct {
						URL string `json:"url"`
					} `json:"high"`
				} `json:"thumbnails"`
			} `json:"snippet"`
			LiveStreamingDetails struct {
				ConcurrentViewers string `json:"concurrentViewers"`
			} `json:"liveStreamingDetails"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&videoResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(videoResp.Items) == 0 {
		return nil, fmt.Errorf("video not found")
	}

	item := videoResp.Items[0]
	viewerCount := 0
	if item.LiveStreamingDetails.ConcurrentViewers != "" {
		fmt.Sscanf(item.LiveStreamingDetails.ConcurrentViewers, "%d", &viewerCount)
	}

	return &models.Streamer{
		ID:          item.ID,
		Platform:    "youtube",
		Username:    item.Snippet.ChannelID,
		DisplayName: item.Snippet.ChannelTitle,
		Title:       item.Snippet.Title,
		Thumbnail:   item.Snippet.Thumbnails.High.URL,
		ViewerCount: viewerCount,
		IsLive:      true,
		EmbedURL:    fmt.Sprintf("https://www.youtube.com/embed/%s?autoplay=1", item.ID),
		ChatURL:     fmt.Sprintf("https://www.youtube.com/live_chat?v=%s&embed_domain=localhost", item.ID),
	}, nil
}
