export type Service = {
    slug: string;
    name: string;
    blurb?: string;
    description?: string;
    seoDescription?: string;
    prefix?: string;
};

export const services: Service[] = [
    {
        slug: "new-construction",
        name: "New Construction",
        blurb: "Ground-up homes, garages, and outbuildings.",
        description:
            "KIL Construction handles new construction projects from planning to final walkthrough.</br>Every project is built to last and tailored to your space.",
        seoDescription:
            "KIL Construction handles new construction projects from planning to final walkthrough. Every project is built to last and tailored to your space.",
        prefix: "New Construction/",
    },
    {
        slug: "remodels",
        name: "Remodels",
        blurb: "Kitchens, baths, basements, and whole-home updates.",
        description: "KIL Construction handles kitchens, baths, decks, and more.</br>From planning to final walkthrough every project is built to last and tailored to your space.",
        seoDescription:
            "KIL Construction handles kitchens, baths, decks, and more. From planning to final walkthrough, every project is built to last and tailored to your space.",
        prefix: "Remodels/",
    },
    {
        slug: "furniture",
        name: "Custom Furniture",
        blurb: "Custom cabinetry and standalone furniture.",
        description: "KIL Construction handles cabinets, cutting boards, epoxy work, and more.</br>From planning to final walkthrough every project is built to last and tailored to your space.",
        seoDescription:
            "KIL Construction builds custom cabinets, cutting boards, epoxy work, and more. From planning to final walkthrough, every project is built to last and tailored to your space.",
        prefix: "Furniture/",
    },
];

