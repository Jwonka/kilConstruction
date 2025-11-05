export type Preview = { thumb?: string; full?: string; name?: string };
export type Project = {
    slug: string;
    name: string;
    summary?: string;
    year?: string;
    location?: string;
    previews?: Preview[];
    images?: Preview | null;
};

export function toCards(projects: Project[]) {
    return projects.map((p) => {
        const imgs = p.previews?.length ? p.previews : (p.images ? [p.images] : []);
        const first = imgs[0];
        const src = first?.thumb || first?.full || '/placeholder-600x400.png';
        const rotList = imgs.map((i) => i.thumb || i.full || '/placeholder-600x400.png');
        return { p, first, src, rotList };
    });
}
