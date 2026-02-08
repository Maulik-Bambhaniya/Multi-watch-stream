package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"multistream/backend/internal/models"
	"multistream/backend/internal/services"
)

// SearchHandler handles stream search requests
type SearchHandler struct {
	YouTube *services.YouTubeService
	Kick    *services.KickService
}

// NewSearchHandler creates a new search handler
func NewSearchHandler(youtube *services.YouTubeService, kick *services.KickService) *SearchHandler {
	return &SearchHandler{
		YouTube: youtube,
		Kick:    kick,
	}
}

// Search handles GET /api/v1/search
func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	platform := r.URL.Query().Get("platform")
	query := r.URL.Query().Get("query")
	limitStr := r.URL.Query().Get("limit")

	if query == "" {
		h.sendError(w, http.StatusBadRequest, "query parameter is required")
		return
	}

	limit := 20
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	var streamers []models.Streamer
	var err error

	switch platform {
	case "youtube":
		streamers, err = h.YouTube.SearchLiveStreams(query, limit)
	case "kick":
		streamers, err = h.Kick.SearchLiveStreams(query, limit)
	case "", "all":
		// Search all platforms
		streamers = make([]models.Streamer, 0)

		ytStreamers, ytErr := h.YouTube.SearchLiveStreams(query, limit/2)
		if ytErr == nil {
			streamers = append(streamers, ytStreamers...)
		}

		kickStreamers, kickErr := h.Kick.SearchLiveStreams(query, limit/2)
		if kickErr == nil {
			streamers = append(streamers, kickStreamers...)
		}

		// If both failed, return error
		if ytErr != nil && kickErr != nil {
			err = ytErr
		}
	default:
		h.sendError(w, http.StatusBadRequest, "invalid platform: must be youtube, kick, or all")
		return
	}

	if err != nil {
		h.sendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := models.SearchResponse{
		Streamers: streamers,
		Platform:  platform,
		Query:     query,
	}

	h.sendJSON(w, http.StatusOK, response)
}

func (h *SearchHandler) sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *SearchHandler) sendError(w http.ResponseWriter, status int, message string) {
	h.sendJSON(w, status, models.ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
		Code:    status,
	})
}
