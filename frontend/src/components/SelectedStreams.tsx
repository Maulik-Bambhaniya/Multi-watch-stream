"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Streamer } from "@/lib/api";
import { X, Trash2 } from "lucide-react";

interface SelectedStreamsProps {
    streams: Streamer[];
    onRemove: (streamer: Streamer) => void;
    onClear: () => void;
}

export function SelectedStreams({
    streams,
    onRemove,
    onClear,
}: SelectedStreamsProps) {
    if (streams.length === 0) {
        return null;
    }

    const platformStyles = {
        youtube: "bg-red-600/90 hover:bg-red-600 border-red-500/50",
        kick: "bg-green-600/90 hover:bg-green-600 border-green-500/50",
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                        Selected Streams
                    </span>
                    <Badge variant="secondary" className="bg-purple-600/30 text-purple-300 border-none">
                        {streams.length}
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-xs h-8 gap-1"
                >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                </Button>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                    {streams.map((streamer) => (
                        <Badge
                            key={`${streamer.platform}-${streamer.id}`}
                            className={`${platformStyles[streamer.platform]} text-white border flex items-center gap-2 pl-3 pr-1.5 py-1.5 text-sm font-medium transition-all hover:scale-105`}
                        >
                            {streamer.platform === "youtube" ? "▶️" : "🟢"}
                            <span className="max-w-32 truncate">{streamer.displayName}</span>
                            <button
                                className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(streamer);
                                }}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
