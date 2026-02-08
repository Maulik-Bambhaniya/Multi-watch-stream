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
        <Tabs value={selected} onValueChange={(v) => onSelect(v as Platform)}>
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-xl h-auto">
                <TabsTrigger
                    value="all"
                    className="py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                    <Globe className="h-4 w-4 mr-2" />
                    All Platforms
                </TabsTrigger>
                <TabsTrigger
                    value="youtube"
                    className="py-3 rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                </TabsTrigger>
                <TabsTrigger
                    value="kick"
                    className="py-3 rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                    <span className="mr-2">🟢</span>
                    Kick
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
