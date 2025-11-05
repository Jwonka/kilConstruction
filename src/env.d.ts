// noinspection JSUnusedGlobalSymbols

declare module '*.svg' {
    const src: string;
    export default src;
}

interface ImportMetaEnv {
    readonly PUBLIC_GALLERY_API: string;
}
