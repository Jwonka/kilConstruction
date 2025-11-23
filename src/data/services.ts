export type Service = {
    slug: string;
    name: string;
    blurb?: string;
    prefix?: string;
};

export const services: Service[] = [
    {
        slug: "new-construction",
        name: "New Construction",
        blurb: "Ground-up homes, garages, and outbuildings.",
        prefix: "New Construction/",
    },
    {
        slug: "remodels",
        name: "Remodels",
        blurb: "Kitchens, baths, basements, and whole-home updates.",
        prefix: "Remodels/",
    },
    {
        slug: "furniture",
        name: "Furniture & Built-ins",
        blurb: "Custom cabinetry, built-ins, and standalone furniture pieces.",
        prefix: "Furniture/",
    },
];

