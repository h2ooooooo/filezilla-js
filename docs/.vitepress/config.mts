import {defineConfig} from 'vitepress';
import {auditBuiltDocs, installBaseLinks} from '../../scripts/doc-links.mjs';
import {nav, sidebar} from './navigation.mjs';

const githubPages = process.env.FILEZILLA_GITHUB_PAGES === 'true';

const docsBase = process.env.DOCS_BASE || '/';

export default defineConfig({
    title: 'FileZilla JS',
    description: 'Read FileZilla sites and connect them through Dockline. A guide to filezilla-js.',
    lang: 'en-US',
    appearance: false,
    cleanUrls: !githubPages,
    base: docsBase,
    markdown: {
        theme: 'github-dark-high-contrast',
        config(markdown) {
            installBaseLinks(markdown, docsBase);
        },
    },
    async buildEnd(site) {
        const result = await auditBuiltDocs(site.outDir, site.site.base, 'filezilla-js');

        console.log(`Documentation links verified: ${result.pages} pages, ${result.links} links.`);
    },
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
