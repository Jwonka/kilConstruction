export type Service = {
    slug: string;
    name: string;
    blurb?: string;
    images?: string[];
    albumUrl?: string;
};

export const services: Service[] = [
    { slug: 'new-construction', name: 'New Construction', blurb: 'Ground-up builds.' },
    { slug: 'remodeling', name: 'Remodeling', blurb: 'Kitchens, baths, whole-home.' },
    { slug: 'additions', name: 'Additions', blurb: 'Add space that feels seamless.' },
    { slug: 'exteriors', name: 'Exteriors', blurb: 'Siding, roofing, decks.' },
];
