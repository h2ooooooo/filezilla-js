import {defineConfig} from 'vitepress';
import {nav, sidebar} from './navigation.mjs';

const githubPages = process.env.FILEZILLA_GITHUB_PAGES === 'true';

export default defineConfig({
    title: 'FileZilla JS',
    description: 'Read FileZilla sites and connect them through Dockline. A guide to filezilla-js.',
    lang: 'en-US',
    appearance: false,
    cleanUrls: !githubPages,
    base: process.env.DOCS_BASE || '/',
    markdown: {theme: 'github-dark-high-contrast'},
    head: [['meta', {name: 'theme-color', content: '#171a1d'}]],
    vite: {
        css: {preprocessorOptions: {scss: {api: 'modern'}}},
    },
    themeConfig: {
        siteTitle: 'FileZilla JS',
        nav: nav,
        sidebar: sidebar,
        search: {provider: 'local'},
        outline: {level: [2, 3], label: 'On this page'},
        editLink: {
            pattern: 'https://github.com/h2ooooooo/filezilla-js/blob/main/docs/:path',
            text: 'View this page on GitHub',
        },
        socialLinks: [{icon: 'github', link: 'https://github.com/h2ooooooo/filezilla-js'}],
        docFooter: {prev: 'Previous page', next: 'Next page'},
    },
});
