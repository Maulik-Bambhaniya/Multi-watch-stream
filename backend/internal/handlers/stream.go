package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"multistream/backend/internal/models"
	"multistream/backend/internal/services"
)

// StreamHandler handles stream info requests
type StreamHandler struct {
	YouTube *services.YouTubeService
	Kick    *services.KickService
}

// NewStreamHandler creates a new stream handler
func NewStreamHandler(youtube *services.YouTubeService, kick *services.KickService) *StreamHandler {
	return &StreamHandler{
		YouTube: youtube,
		Kick:    kick,
	}
}

// GetStream handles GET /api/v1/stream/{platform}/{id}
func (h *StreamHandler) GetStream(w http.ResponseWriter, r *http.Request) {
	platform := chi.URLParam(r, "platform")
	streamID := chi.URLParam(r, "id")

	if streamID == "" {
		h.sendError(w, http.StatusBadRequest, "stream ID is required")
		return
	}

	var streamer *models.Streamer
	var err error

	switch platform {
	case "youtube":
		streamer, err = h.YouTube.GetStreamInfo(streamID)
	case "kick":
		streamer, err = h.Kick.GetChannelInfo(streamID)
	default:
		h.sendError(w, http.StatusBadRequest, "invalid platform: must be youtube or kick")
		return
	}

	if err != nil {
		h.sendError(w, http.StatusNotFound, err.Error())
		return
	}

	response := models.StreamResponse{
		Streamer: *streamer,
		EmbedURL: streamer.EmbedURL,
		ChatURL:  streamer.ChatURL,
	}

	h.sendJSON(w, http.StatusOK, response)
}

func (h *StreamHandler) sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *StreamHandler) sendError(w http.ResponseWriter, status int, message string) {
	h.sendJSON(w, status, models.ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
		Code:    status,
	})
}
