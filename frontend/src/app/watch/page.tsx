"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StreamPlayer } from "@/components/StreamPlayer";
import { Button } from "@/components/ui/button";
import { Streamer } from "@/lib/api";
import {
    Maximize,
    Minimize,
    ArrowLeft,
    Volume2,
    VolumeX,
    MessageSquare,
    MessageSquareOff,
    LayoutGrid,
} from "lucide-react";

interface WatchData {
    streams: Streamer[];
    settings: {
        autoplay: boolean;
        muted: boolean;
        showChat: boolean;
    };
}

function WatchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [watchData, setWatchData] = useState<WatchData | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [muted, setMuted] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [layout, setLayout] = useState<"grid" | "focus">("grid");
    const [focusIndex, setFocusIndex] = useState(0);

    // Parse URL data
    useEffect(() => {
        const dataParam = searchParams.get("data");
        if (dataParam) {
            try {
                const decoded = JSON.parse(decodeURIComponent(dataParam));
                setWatchData(decoded);
                setMuted(decoded.settings.muted);
                setShowChat(decoded.settings.showChat);
            } catch {
                router.push("/");
            }
        } else {
            router.push("/");
        }
    }, [searchParams, router]);

    // Auto fullscreen on load
    useEffect(() => {
        if (watchData && !isFullscreen) {
            enterFullscreen();
        }
    }, [watchData]);

    // Fullscreen handlers
    const enterFullscreen = useCallback(() => {
        document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
    }, []);

    const exitFullscreen = useCallback(() => {
        document.exitFullscreen?.();
        setIsFullscreen(false);
    }, []);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () =>
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // ESC key to exit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !document.fullscreenElement) {
                router.push("/");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router]);

    if (!watchData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const { streams, settings } = watchData;
    const streamCount = streams.length;

    // Calculate grid layout
    const getGridClass = () => {
        if (layout === "focus") {
            return "grid-cols-1";
        }

        switch (streamCount) {
            case 1:
                return "grid-cols-1";
            case 2:
                return "grid-cols-2";
            case 3:
                return "grid-cols-2 lg:grid-cols-3";
            case 4:
                return "grid-cols-2";
            case 5:
            case 6:
                return "grid-cols-2 lg:grid-cols-3";
            default:
                return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
        }
    };

    const getRowClass = () => {
        if (layout === "focus") return "";

        switch (streamCount) {
            case 1:
                return "grid-rows-1";
            case 2:
                return "grid-rows-1";
            case 3:
                return "grid-rows-2 lg:grid-rows-1";
            case 4:
                return "grid-rows-2";
            default:
                return "";
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Control bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/")}
                        className="text-gray-300 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <span className="text-white font-medium">
                        Watching {streamCount} stream{streamCount > 1 ? "s" : ""}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLayout(layout === "grid" ? "focus" : "grid")}
                        className="text-gray-300 hover:text-white"
                    >
                        <LayoutGrid className="h-4 w-4 mr-1" />
                        {layout === "grid" ? "Focus" : "Grid"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMuted(!muted)}
                        className="text-gray-300 hover:text-white"
                    >
                        {muted ? (
                            <VolumeX className="h-4 w-4" />
                        ) : (
                            <Volume2 className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowChat(!showChat)}
                        className="text-gray-300 hover:text-white"
                    >
                        {showChat ? (
                            <MessageSquare className="h-4 w-4" />
                        ) : (
                            <MessageSquareOff className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                        className="text-gray-300 hover:text-white"
                    >
                        {isFullscreen ? (
                            <Minimize className="h-4 w-4" />
                        ) : (
                            <Maximize className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Stream grid */}
            <div
                className={`flex-1 grid ${getGridClass()} ${getRowClass()} gap-1 p-1`}
            >
                {layout === "focus" ? (
                    <>
                        {/* Main focused stream */}
                        <div className="aspect-video">
                            <StreamPlayer
                                streamer={streams[focusIndex]}
                                autoplay={settings.autoplay}
                                muted={muted}
                                showChat={showChat}
                            />
                        </div>

                        {/* Thumbnail strip */}
                        {streamCount > 1 && (
                            <div className="flex gap-1 overflow-x-auto p-2 bg-gray-900">
                                {streams.map((stream, index) => (
                                    <button
                                        key={`${stream.platform}-${stream.id}`}
                                        onClick={() => setFocusIndex(index)}
                                        className={`flex-shrink-0 w-32 aspect-video rounded overflow-hidden border-2 transition-all ${index === focusIndex
                                                ? "border-purple-500"
                                                : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        {stream.thumbnail ? (
                                            <img
                                                src={stream.thumbnail}
                                                alt={stream.displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xl">
                                                🎬
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    // Grid layout
                    streams.map((stream) => (
                        <div
                            key={`${stream.platform}-${stream.id}`}
                            className="aspect-video"
                        >
                            <StreamPlayer
                                streamer={stream}
                                autoplay={settings.autoplay}
                                muted={muted}
                                showChat={showChat && streamCount === 1}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                </div>
            }
        >
            <WatchPageContent />
        </Suspense>
    );
}
