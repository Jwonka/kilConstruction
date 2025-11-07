export type Project = {
    slug: string;
    name: string;
    location?: string;
    year?: string;
    cover?: string;
    coverThumb?: string;
    coverFull?: string;
    images?: string[];
    albumUrl?: string;
    summary?: string;
    samples?: PreviewItem[];
    items?: PreviewItem[];
};

export type PreviewItem = {
    name?: string;
    thumb?: string;
    full?: string;
    createdTime?: string;
};

export const projects: Project[] = [
    {
        slug: "smith-kitchen-remodel",
        name: "Smith Kitchen Remodel",
        location: "Wausau, WI",
        year: "2024",
        cover: "/images/projects/smith/cover.jpg",
        images: [
            "/images/projects/smith/1.jpg",
            "/images/projects/smith/2.jpg",
            "/images/projects/smith/3.jpg",
        ],
    },
    {
        slug: "miller-composite-deck",
        name: "Miller Composite Deck",
        year: "2025",
        cover: "/images/projects/miller/cover.jpg",
        images: [
            "/images/projects/miller/1.jpg",
            "/images/projects/miller/2.jpg",
        ],
    },
];
