import type { Project, PreviewItem } from "./projects.ts";

export type Card = {
    p: Pick<Project, "slug" | "name" | "summary" | "location" | "year">;
    first?: { name?: string };
    src: string;
    rotList: string[];
};

const pickCover = (p: Project, samples: string[]): string =>
    p.coverThumb || p.coverFull || samples[0] || "";

function toUrl(i: PreviewItem | string): string {
    if (typeof i === "string") return i;
    return i?.thumb || i?.full || "";
}

export function toCards(projects: Project[]): Card[] {
    return (projects ?? []).map((p) => {
        const sampleUrls: string[] = (p.items ?? p.samples ?? [])
            .map(toUrl)
            .filter(Boolean);

        const cover = pickCover(p, sampleUrls);
        const rotList = sampleUrls.slice(0, 8);

        return { p, first: { name: p.name }, src: cover, rotList };
    });
}