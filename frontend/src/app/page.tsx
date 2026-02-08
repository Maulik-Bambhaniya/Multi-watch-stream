"use client";

import { useState, useCallback } from "react";
import { PlatformSelector } from "@/components/PlatformSelector";
import { SearchBar } from "@/components/SearchBar";
import { StreamerCard } from "@/components/StreamerCard";
import { SelectedStreams } from "@/components/SelectedStreams";
import { ControlPanel } from "@/components/ControlPanel";
import { searchStreamers, Streamer, Platform } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  // State
  const [platform, setPlatform] = useState<Platform>("all");
  const [searchResults, setSearchResults] = useState<Streamer[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<Streamer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Control states
  const [autoplay, setAutoplay] = useState(true);
  const [muted, setMuted] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // Search handler
  const handleSearch = useCallback(
    async (query: string) => {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const results = await searchStreamers(query, platform);
        setSearchResults(results);

        if (results.length === 0) {
          setError("No live streams found. Try a different search term or check if streamers are online.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Search failed. Check your connection."
        );
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [platform]
  );

  // Selection handlers
  const handleSelect = useCallback((streamer: Streamer) => {
    setSelectedStreams((prev) => {
      const exists = prev.some(
        (s) => s.id === streamer.id && s.platform === streamer.platform
      );
      if (exists) return prev;
      return [...prev, streamer];
    });
  }, []);

  const handleDeselect = useCallback((streamer: Streamer) => {
    setSelectedStreams((prev) =>
      prev.filter(
        (s) => !(s.id === streamer.id && s.platform === streamer.platform)
      )
    );
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedStreams([]);
  }, []);

  // Check if a streamer is selected
  const isSelected = (streamer: Streamer) =>
    selectedStreams.some(
      (s) => s.id === streamer.id && s.platform === streamer.platform
    );

  // Start watching
  const handleStart = useCallback(() => {
    if (selectedStreams.length === 0) return;

    const streamData = encodeURIComponent(
      JSON.stringify({
        streams: selectedStreams,
        settings: { autoplay, muted, showChat },
      })
    );

    router.push(`/watch?data=${streamData}`);
  }, [selectedStreams, autoplay, muted, showChat, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🎬</span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MultiStream
              </span>
            </h1>
            <span className="text-sm text-gray-400 hidden sm:block">
              Watch multiple streams together
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Hero section */}
          <section className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Watch Live Streams{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Together
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Search by topic, game, or streamer name. Select multiple streams and watch them all in one view.
            </p>
          </section>

          {/* Platform selector */}
          <section className="max-w-md mx-auto">
            <PlatformSelector selected={platform} onSelect={setPlatform} />
          </section>

          {/* Search bar */}
          <section className="max-w-3xl mx-auto">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </section>

          {/* Selected streams panel */}
          {selectedStreams.length > 0 && (
            <section className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-5 border border-purple-500/20 backdrop-blur-sm">
              <SelectedStreams
                streams={selectedStreams}
                onRemove={handleDeselect}
                onClear={handleClearAll}
              />
            </section>
          )}

          {/* Control panel */}
          <section className="flex justify-center">
            <ControlPanel
              autoplay={autoplay}
              muted={muted}
              showChat={showChat}
              streamCount={selectedStreams.length}
              onAutoplayToggle={() => setAutoplay(!autoplay)}
              onMuteToggle={() => setMuted(!muted)}
              onChatToggle={() => setShowChat(!showChat)}
              onStart={handleStart}
            />
          </section>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
              <p className="text-gray-400">Searching for live streams...</p>
            </div>
          )}

          {/* Error message */}
          {error && !isLoading && (
            <div className="text-center py-8 px-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && !isLoading && (
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Live Streams
                </h2>
                <span className="text-sm text-gray-500">
                  {searchResults.length} found
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((streamer) => (
                  <StreamerCard
                    key={`${streamer.platform}-${streamer.id}`}
                    streamer={streamer}
                    isSelected={isSelected(streamer)}
                    onSelect={handleSelect}
                    onDeselect={handleDeselect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state - before search */}
          {!hasSearched && !isLoading && (
            <div className="text-center py-20">
              <div className="text-7xl mb-6">🔍</div>
              <h3 className="text-2xl font-semibold text-white mb-3">
                Find Live Streams
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Search by game, topic, or streamer. Try &quot;Gaming&quot;, &quot;Music&quot;, or &quot;Just Chatting&quot; to discover live content.
              </p>
            </div>
          )}

          {/* Empty state - after search with no results */}
          {hasSearched && searchResults.length === 0 && !isLoading && !error && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No streams found
              </h3>
              <p className="text-gray-500">
                Try a different search term or check back later
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-6 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          MultiStream • Watch multiple streams together
        </div>
      </footer>
    </div>
  );
}
