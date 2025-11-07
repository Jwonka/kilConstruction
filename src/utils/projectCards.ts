import type { Project, PreviewItem } from "./projects.ts";

export type Card = {
    p: Pick<Project, "slug" | "name" | "summary" | "location" | "year">;
    first?: { name?: string };
    src: string;
    rotList: string[];
};

const pickCover = (p: Project, samples: string[]): string =>
    p.coverThumb || p.coverFull || samples[0] || "/img/placeholder-project.jpg";

export function toCards(projects: Project[]): Card[] {
    return (projects ?? []).map((p) => {
        const sampleUrls: string[] = (p.items ?? p.samples ?? [])
            .map((i: PreviewItem) => i?.thumb || i?.full || "")
            .filter(Boolean);

        const cover = pickCover(p, sampleUrls);
        const rotList = sampleUrls.slice(0, 8);

        return { p, first: { name: p.name }, src: cover, rotList };
    });
}