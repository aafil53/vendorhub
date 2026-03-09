import { useState } from 'react';
import { Boxes, Users, Send, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const CATEGORY_ICONS: Record<string, string> = {
    'Lifting Equipment': '🏗️',
    'Earthmoving Equipment': '🚜',
    'Transport Equipment': '🚚',
    'Power Equipment': '⚡',
    'Cranes': '🏗️',
    'Excavators': '🚛',
    'Generators': '⚡',
    'Trucks': '🚚',
    'Forklifts': '🔧',
    'Compressors': '🔩',
    'Scaffolding': '🏗️',
    'Pumps': '💧',
};

const getIcon = (name: string) => {
    // Try direct match first
    if (CATEGORY_ICONS[name]) return CATEGORY_ICONS[name];
    // Try keyword match
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
        if (lower.includes(key.toLowerCase().split(' ')[0])) return icon;
    }
    return '🔧';
};

interface EquipmentCatalogProps {
    onSelectCategory: (category: string) => void;
}

export function EquipmentCatalog({ onSelectCategory }: EquipmentCatalogProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['equipment-categories'],
        queryFn: async () => {
            const { data } = await api.get('/equipment/categories');
            return data;
        },
        staleTime: 30_000
    });

    const categories: { name: string; vendorCount: number }[] = data?.categories || [];

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 opacity-30" />
                <div>
                    <p className="text-lg font-semibold">No Equipment Categories Yet</p>
                    <p className="text-sm mt-1">Equipment categories will appear here once vendors register and select their equipment types.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold tracking-tight">Equipment Catalog</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Browse <strong>{categories.length}</strong> equipment categories offered by our vendor network
                </p>
            </div>

            {/* Category Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories.map((cat) => (
                    <Card
                        key={cat.name}
                        className="group cursor-pointer overflow-hidden border transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                        onClick={() => onSelectCategory(cat.name)}
                    >
                        <CardContent className="p-0">
                            {/* Coloured top strip */}
                            <div className="h-1.5 bg-gradient-to-r from-primary/60 to-primary/20" />

                            <div className="p-5 space-y-3">
                                {/* Icon + Name */}
                                <div className="flex items-start justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                                        {getIcon(cat.name)}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
                                </div>

                                <div>
                                    <h3 className="font-bold text-foreground leading-tight">{cat.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            {cat.vendorCount} {cat.vendorCount === 1 ? 'vendor' : 'vendors'} available
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    className="w-full gap-2 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectCategory(cat.name);
                                    }}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    Send RFQ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <p className="text-xs text-muted-foreground text-center pb-2">
                <Boxes className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
                Categories are automatically updated as vendors join the platform
            </p>
        </div>
    );
}
