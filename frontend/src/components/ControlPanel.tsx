"use client";

import { Button } from "@/components/ui/button";
import { Play, Volume2, VolumeX, MessageSquare, MessageSquareOff, Rocket } from "lucide-react";

interface ControlPanelProps {
    autoplay: boolean;
    muted: boolean;
    showChat: boolean;
    streamCount: number;
    onAutoplayToggle: () => void;
    onMuteToggle: () => void;
    onChatToggle: () => void;
    onStart: () => void;
}

export function ControlPanel({
    autoplay,
    muted,
    showChat,
    streamCount,
    onAutoplayToggle,
    onMuteToggle,
    onChatToggle,
    onStart,
}: ControlPanelProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Toggle buttons */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAutoplayToggle}
                    className={`rounded-full px-4 transition-all ${autoplay
                            ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700 hover:border-purple-700"
                            : "bg-transparent border-white/20 text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                >
                    <Play className={`h-4 w-4 mr-1.5 ${autoplay ? "fill-current" : ""}`} />
                    Autoplay
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onMuteToggle}
                    className={`rounded-full px-4 transition-all ${muted
                            ? "bg-orange-600 border-orange-600 text-white hover:bg-orange-700 hover:border-orange-700"
                            : "bg-transparent border-white/20 text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                >
                    {muted ? (
                        <VolumeX className="h-4 w-4 mr-1.5" />
                    ) : (
                        <Volume2 className="h-4 w-4 mr-1.5" />
                    )}
                    {muted ? "Muted" : "Sound On"}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onChatToggle}
                    className={`rounded-full px-4 transition-all ${showChat
                            ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                            : "bg-transparent border-white/20 text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                >
                    {showChat ? (
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                    ) : (
                        <MessageSquareOff className="h-4 w-4 mr-1.5" />
                    )}
                    Chat
                </Button>
            </div>

            {/* Start button */}
            <Button
                size="lg"
                onClick={onStart}
                disabled={streamCount === 0}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none animate-gradient bg-[length:200%_100%]"
            >
                <Rocket className="h-5 w-5 mr-2" />
                {streamCount === 0 ? (
                    "Select Streams"
                ) : (
                    <>
                        Launch MultiStream
                        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                            {streamCount}
                        </span>
                    </>
                )}
            </Button>
        </div>
    );
}
