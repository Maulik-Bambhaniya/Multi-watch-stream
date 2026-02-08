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
                return `https://www.youtube.com/embed/${streamer.id}?autoplay=${autoplayParam}&mute=${muteParam}&rel=0`;
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
            {/* Video player */}
            <div className={`relative ${showChat ? "w-3/4" : "w-full"} h-full`}>
                <iframe
                    src={getEmbedUrl()}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />

                {/* Stream info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${streamer.platform === "youtube" ? "bg-red-600" : "bg-green-600"
                                }`}
                        >
                            {streamer.platform.toUpperCase()}
                        </span>
                        <span className="text-white text-sm font-medium truncate">
                            {streamer.displayName}
                        </span>
                    </div>
                    <p className="text-gray-300 text-xs truncate mt-1">{streamer.title}</p>
                </div>
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
