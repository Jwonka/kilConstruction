export type Service = {
    slug: string;
    name: string;
    blurb?: string;
    images?: string[];
    albumUrl?: string;
};

export const services: Service[] = [
    {
        slug: "new-construction",
        name: "New Construction",
        blurb: "Ground-up builds: framing, drywall, decks, siding, exteriors.",
        images: ["/images/new-construction/1.jpg"]
    },
    {
        slug: "remodels",
        name: "Remodels",
        blurb: "Kitchens, baths, basements, trim, doors/windows.",
        images: ["/images/remodels/1.jpg"]
    },
    {
        slug: "furniture",
        name: "Furniture",
        blurb: "Custom cabinetry, built-ins, tables, and fine carpentry.",
        images: ["/images/furniture/1.jpg"]
    },
];
