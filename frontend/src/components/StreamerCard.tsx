"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Streamer } from "@/lib/api";
import { Plus, Check, Users, Eye } from "lucide-react";

interface StreamerCardProps {
    streamer: Streamer;
    isSelected: boolean;
    onSelect: (streamer: Streamer) => void;
    onDeselect: (streamer: Streamer) => void;
}

export function StreamerCard({
    streamer,
    isSelected,
    onSelect,
    onDeselect,
}: StreamerCardProps) {
    const platformStyles = {
        youtube: {
            bg: "bg-red-600",
            border: "border-red-500",
            glow: "shadow-red-500/20",
        },
        kick: {
            bg: "bg-green-600",
            border: "border-green-500",
            glow: "shadow-green-500/20",
        },
    };

    const style = platformStyles[streamer.platform];

    const formatViewers = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    return (
        <Card
            className={`group relative overflow-hidden bg-[#12121a] border-white/5 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 ${isSelected ? `ring-2 ring-purple-500 ${style.border}` : ""
                }`}
            onClick={() => (isSelected ? onDeselect(streamer) : onSelect(streamer))}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
                {streamer.thumbnail ? (
                    <img
                        src={streamer.thumbnail}
                        alt={streamer.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-slate-900 flex items-center justify-center">
                        <span className="text-5xl opacity-50">🎬</span>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Live badge */}
                {streamer.isLive && (
                    <Badge className="absolute top-2 left-2 bg-red-600/90 text-white text-xs font-medium px-2 py-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                    </Badge>
                )}

                {/* Platform badge */}
                <Badge
                    className={`absolute top-2 right-2 ${style.bg} text-white text-xs font-bold`}
                >
                    {streamer.platform === "youtube" ? "YT" : "KICK"}
                </Badge>

                {/* Viewer count */}
                {streamer.viewerCount > 0 && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-white">
                        <Eye className="h-3 w-3 text-red-400" />
                        <span className="font-medium">{formatViewers(streamer.viewerCount)}</span>
                    </div>
                )}

                {/* Selection indicator */}
                <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isSelected
                            ? "bg-purple-600 scale-100 opacity-100"
                            : "bg-black/50 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                        }`}
                >
                    {isSelected ? (
                        <Check className="h-6 w-6 text-white" />
                    ) : (
                        <Plus className="h-6 w-6 text-white" />
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-1">
                <h3 className="font-semibold text-white truncate text-sm group-hover:text-purple-300 transition-colors">
                    {streamer.displayName}
                </h3>
                <p className="text-xs text-gray-500 truncate">{streamer.title || "Live Stream"}</p>
            </div>
        </Card>
    );
}
