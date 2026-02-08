"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Sparkles } from "lucide-react";

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading?: boolean;
}

const searchSuggestions = [
    "Gaming",
    "Music",
    "Just Chatting",
    "Valorant",
    "GTA",
    "Minecraft",
    "Fortnite",
    "IRL",
];

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (query.trim()) {
                onSearch(query.trim());
            }
        },
        [query, onSearch]
    );

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        onSearch(suggestion);
    };

    return (
        <div className="space-y-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
                    <Input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        placeholder="Search for streams... (e.g., Gaming, Music, Valorant)"
                        className="pl-12 pr-4 py-6 text-lg bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all"
                        disabled={isLoading}
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            <Search className="h-5 w-5 mr-2" />
                            Search
                        </>
                    )}
                </Button>
            </form>

            {/* Quick search suggestions */}
            <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Try:
                </span>
                {searchSuggestions.map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1 text-sm bg-white/5 hover:bg-purple-600/30 text-gray-300 hover:text-white rounded-full border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}
