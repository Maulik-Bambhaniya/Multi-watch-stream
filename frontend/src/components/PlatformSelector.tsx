"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Platform } from "@/lib/api";
import { Globe, Youtube } from "lucide-react";

interface PlatformSelectorProps {
    selected: Platform;
    onSelect: (platform: Platform) => void;
}

export function PlatformSelector({ selected, onSelect }: PlatformSelectorProps) {
    return (
        <Tabs value={selected} onValueChange={(v) => onSelect(v as Platform)} className="w-full">
            <TabsList className="flex w-full bg-white/5 border border-white/10 p-1.5 rounded-xl gap-1">
                <TabsTrigger
                    value="all"
                    className="flex-1 py-3 px-4 rounded-lg text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all hover:text-white hover:bg-white/5"
                >
                    <Globe className="h-4 w-4 mr-2" />
                    All
                </TabsTrigger>
                <TabsTrigger
                    value="youtube"
                    className="flex-1 py-3 px-4 rounded-lg text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all hover:text-white hover:bg-white/5"
                >
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                </TabsTrigger>
                <TabsTrigger
                    value="kick"
                    className="flex-1 py-3 px-4 rounded-lg text-gray-300 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all hover:text-white hover:bg-white/5"
                >
                    <span className="mr-2 text-sm">⚡</span>
                    Kick
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
