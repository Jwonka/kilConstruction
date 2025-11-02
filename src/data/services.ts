export type Service = {
    slug: string;
    name: string;
    blurb?: string;
    // Either local images OR an external album embed (Google Photos share link) later
    images?: string[];           // paths under /public/images/...
    albumUrl: "https://photos.google.com/share/…"
};

export const services: Service[] = [
    {
        slug: "kitchens-baths",
        name: "Kitchens & Baths",
        blurb: "Remodels, tiling, fixtures, cabinetry.",
        images: [
            "/images/kitchens/kit-1.jpg",
            "/images/kitchens/kit-2.jpg",
            "/images/kitchens/kit-3.jpg",
        ],
    },
    {
        slug: "framing-drywall",
        name: "Framing & Drywall",
        blurb: "Walls, ceilings, finishing.",
        images: [
            "/images/drywall/dw-1.jpg",
            "/images/drywall/dw-2.jpg",
        ],
    },
    {
        slug: "decks-exterior",
        name: "Decks & Exterior",
        blurb: "Deck builds, repairs, siding.",
        images: [
            "/images/decks/deck-1.jpg",
            "/images/decks/deck-2.jpg",
        ],
    },
    {
        slug: "concrete",
        name: "Concrete",
        blurb: "Pads, walkways, steps.",
        images: [
            "/images/concrete/con-1.jpg",
            "/images/concrete/con-2.jpg",
        ],
    },
];
