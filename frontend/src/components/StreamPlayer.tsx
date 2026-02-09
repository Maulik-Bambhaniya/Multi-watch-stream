"use client";

import { Streamer } from "@/lib/api";

interface StreamPlayerProps {
    streamer: Streamer;
    autoplay: boolean;
    muted: boolean;
    showChat: boolean;
}

export function StreamPlayer({
    streamer,
    autoplay,
    muted,
    showChat,
}: StreamPlayerProps) {
    const getEmbedUrl = () => {
        const muteParam = muted ? 1 : 0;
        const autoplayParam = autoplay ? 1 : 0;

        switch (streamer.platform) {
            case "youtube":
                // Add controls=1 to ensure controls are visible
                return `https://www.youtube.com/embed/${streamer.id}?autoplay=${autoplayParam}&mute=${muteParam}&rel=0&modestbranding=1&controls=1`;
            case "kick":
                return `https://player.kick.com/${streamer.username}?autoplay=${autoplay}&muted=${muted}`;
            default:
                return streamer.embedUrl || "";
        }
    };

    const getChatUrl = () => {
        switch (streamer.platform) {
            case "youtube":
                return `https://www.youtube.com/live_chat?v=${streamer.id}&embed_domain=${window.location.hostname}`;
            case "kick":
                return `https://kick.com/${streamer.username}/chatroom`;
            default:
                return streamer.chatUrl || "";
        }
    };

    return (
        <div className="relative w-full h-full flex bg-black rounded-lg overflow-hidden">
            {/* Video player - no overlay to block controls */}
            <div className={`relative ${showChat ? "w-3/4" : "w-full"} h-full`}>
                <iframe
                    src={getEmbedUrl()}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>

            {/* Chat panel */}
            {showChat && (
                <div className="w-1/4 h-full border-l border-white/10 bg-gray-900">
                    <iframe
                        src={getChatUrl()}
                        className="w-full h-full"
                        title={`${streamer.displayName} chat`}
                    />
                </div>
            )}
        </div>
    );
}
