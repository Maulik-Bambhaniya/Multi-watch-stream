// API types matching backend models

export interface Streamer {
    id: string;
    platform: "youtube" | "kick";
    username: string;
    displayName: string;
    thumbnail: string;
    title: string;
    viewerCount: number;
    isLive: boolean;
    embedUrl?: string;
    chatUrl?: string;
}

export interface SearchResponse {
    streamers: Streamer[];
    platform: string;
    query: string;
}

export interface StreamResponse {
    streamer: Streamer;
    embedUrl: string;
    chatUrl: string;
}

export type Platform = "youtube" | "kick" | "all";

// API client
const API_BASE = "/api/v1";

export async function searchStreamers(
    query: string,
    platform: Platform = "all",
    limit: number = 20
): Promise<Streamer[]> {
    const params = new URLSearchParams({
        query,
        platform,
        limit: limit.toString(),
    });

    const response = await fetch(`${API_BASE}/search?${params}`);

    if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
    }

    const data: SearchResponse = await response.json();
    return data.streamers || [];
}

export async function getStreamInfo(
    platform: Platform,
    streamId: string
): Promise<StreamResponse> {
    const response = await fetch(`${API_BASE}/stream/${platform}/${streamId}`);

    if (!response.ok) {
        throw new Error(`Failed to get stream info: ${response.statusText}`);
    }

    return response.json();
}
