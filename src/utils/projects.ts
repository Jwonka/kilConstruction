export type PreviewItem = {
    id?: string;
    name?: string;
    thumb?: string;
    full?: string;
    createdTime?: string;
    description?: string;
};

export type Project = {
    slug: string;
    name: string;
    summary?: string;
    year?: string;
    location?: string;
    coverThumb?: string;
    coverFull?: string;
    samples?: PreviewItem[];
    items?: PreviewItem[];
};

