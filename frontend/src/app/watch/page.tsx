"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
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
    Focus,
    RotateCcw,
    Move,
} from "lucide-react";

interface WatchData {
    streams: Streamer[];
    settings: {
        autoplay: boolean;
        muted: boolean;
        showChat: boolean;
    };
}

// Each stream has a scale factor (1 = normal, 2 = double size, 0.5 = half)
interface StreamLayout {
    scale: number;
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
    const [showHeader, setShowHeader] = useState(false);

    // Scale factors for each stream
    const [scales, setScales] = useState<number[]>([]);
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startScale, setStartScale] = useState(1);

    const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Parse URL data
    useEffect(() => {
        const dataParam = searchParams.get("data");
        if (dataParam) {
            try {
                const decoded = JSON.parse(decodeURIComponent(dataParam));
                setWatchData(decoded);
                setMuted(decoded.settings.muted);
                setShowChat(decoded.settings.showChat);
                // Initialize all streams with scale 1
                setScales(decoded.streams.map(() => 1));
            } catch {
                router.push("/");
            }
        } else {
            router.push("/");
        }
    }, [searchParams, router]);

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

    // Header auto-hide
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (e.clientY < 50) {
                setShowHeader(true);
                if (headerTimeoutRef.current) {
                    clearTimeout(headerTimeoutRef.current);
                    headerTimeoutRef.current = null;
                }
            } else if (!headerTimeoutRef.current && showHeader) {
                headerTimeoutRef.current = setTimeout(() => {
                    setShowHeader(false);
                    headerTimeoutRef.current = null;
                }, 1500);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (headerTimeoutRef.current) {
                clearTimeout(headerTimeoutRef.current);
            }
        };
    }, [showHeader]);

    // Handle resize dragging
    const handleResizeStart = useCallback(
        (index: number, e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setResizingIndex(index);
            setStartPos({ x: e.clientX, y: e.clientY });
            setStartScale(scales[index] || 1);
        },
        [scales]
    );

    useEffect(() => {
        if (resizingIndex === null) return;

        // Prevent iframes from stealing events during resize
        document.body.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (e: MouseEvent) => {
            if (resizingIndex === null) return;

            // Use diagonal distance: dragging bottom-right = bigger, top-left = smaller
            const deltaX = e.clientX - startPos.x;
            const deltaY = e.clientY - startPos.y;
            // Combine X and Y movement (diagonal)
            const diagonalDelta = (deltaX + deltaY) / 2;
            // Every 150px of diagonal drag = 0.5 scale change
            const scaleDelta = diagonalDelta / 150;
            const newScale = Math.max(0.5, Math.min(2.5, startScale + scaleDelta));

            setScales((prev) => {
                const next = [...prev];
                next[resizingIndex] = newScale;
                return next;
            });
        };

        const stopResizing = () => {
            setResizingIndex(null);
            document.body.style.pointerEvents = '';
            document.body.style.userSelect = '';
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", stopResizing);
        window.addEventListener("mouseleave", stopResizing);
        window.addEventListener("blur", stopResizing);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", stopResizing);
            window.removeEventListener("mouseleave", stopResizing);
            window.removeEventListener("blur", stopResizing);
            document.body.style.pointerEvents = '';
            document.body.style.userSelect = '';
        };
    }, [resizingIndex, startPos, startScale]);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen?.();
        } else {
            document.documentElement.requestFullscreen?.().catch(() => { });
        }
    };

    const resetLayout = () => {
        if (watchData) {
            setScales(watchData.streams.map(() => 1));
        }
    };

    if (!watchData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const { streams, settings } = watchData;
    const streamCount = streams.length;

    // Calculate base size based on stream count (for 16:9 aspect ratio)
    const getBaseSize = () => {
        if (streamCount === 1) return { width: 100, height: 100 };
        if (streamCount === 2) return { width: 48, height: 90 };
        if (streamCount <= 4) return { width: 48, height: 48 };
        if (streamCount <= 6) return { width: 32, height: 48 };
        return { width: 24, height: 32 };
    };

    const baseSize = getBaseSize();

    const renderGridLayout = () => (
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 w-full h-full overflow-auto">
            {streams.map((stream, index) => {
                const scale = scales[index] || 1;
                const width = baseSize.width * scale;
                const height = baseSize.height * scale;

                return (
                    <div
                        key={`${stream.platform}-${stream.id}`}
                        className="relative group transition-all duration-200 ease-out"
                        style={{
                            width: `${Math.min(width, 95)}%`,
                            // Maintain 16:9 aspect ratio
                            aspectRatio: "16/9",
                            maxWidth: "95vw",
                            maxHeight: "90vh",
                            flexShrink: 0,
                        }}
                    >
                        <StreamPlayer
                            streamer={stream}
                            autoplay={settings.autoplay}
                            muted={muted}
                            showChat={false}
                        />

                        {/* Resize handle - bottom right corner */}
                        <div
                            className="absolute bottom-0 right-0 w-10 h-10 cursor-nwse-resize bg-gradient-to-tl from-purple-600/80 to-transparent rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1"
                            onMouseDown={(e) => handleResizeStart(index, e)}
                        >
                            <Move className="h-5 w-5 text-white rotate-45" />
                        </div>

                        {/* Scale indicator */}
                        {resizingIndex === index && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 rounded text-white text-sm font-mono">
                                {(scale * 100).toFixed(0)}%
                            </div>
                        )}

                        {/* Stream name badge */}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {stream.displayName}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderFocusLayout = () => (
        <div className="flex flex-col w-full h-full">
            <div className="flex-1 min-h-0">
                <StreamPlayer
                    streamer={streams[focusIndex]}
                    autoplay={settings.autoplay}
                    muted={muted}
                    showChat={showChat}
                />
            </div>

            {streamCount > 1 && (
                <div className="flex gap-1 p-2 bg-gray-900 overflow-x-auto">
                    {streams.map((stream, index) => (
                        <button
                            key={`${stream.platform}-${stream.id}`}
                            onClick={() => setFocusIndex(index)}
                            className={`flex-shrink-0 w-24 h-14 rounded overflow-hidden border-2 transition-all ${index === focusIndex
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
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-sm">
                                    🎬
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="h-screen bg-black flex flex-col overflow-hidden">
            {/* Auto-hide Control bar */}
            <div
                className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 transition-transform duration-300 ease-in-out ${showHeader ? "translate-y-0" : "-translate-y-full"
                    }`}
                onMouseEnter={() => setShowHeader(true)}
            >
                <div className="flex items-center gap-3">
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
                        {streamCount} stream{streamCount > 1 ? "s" : ""}
                    </span>
                    <span className="text-gray-500 text-xs hidden sm:inline">
                        Drag corners to resize
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLayout(layout === "grid" ? "focus" : "grid")}
                        className="text-gray-300 hover:text-white"
                        title={layout === "grid" ? "Focus mode" : "Grid mode"}
                    >
                        {layout === "grid" ? (
                            <Focus className="h-4 w-4" />
                        ) : (
                            <LayoutGrid className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetLayout}
                        className="text-gray-300 hover:text-white"
                        title="Reset all sizes"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMuted(!muted)}
                        className="text-gray-300 hover:text-white"
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowChat(!showChat)}
                        className="text-gray-300 hover:text-white"
                        title={showChat ? "Hide chat" : "Show chat"}
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
                        onClick={toggleFullscreen}
                        className="text-gray-300 hover:text-white"
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Hover trigger zone */}
            <div
                className="fixed top-0 left-0 right-0 h-2 z-40"
                onMouseEnter={() => setShowHeader(true)}
            />

            {/* Stream content */}
            <div className="flex-1 min-h-0 overflow-auto">
                {layout === "focus" ? renderFocusLayout() : renderGridLayout()}
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
