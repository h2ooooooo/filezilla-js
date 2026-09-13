import {defineConfig} from 'vitepress';

const githubPages = process.env.FILEZILLA_GITHUB_PAGES === 'true';

const groups = [
    {
        text: 'Start here',
        items: [
            {text: 'Introduction', link: '/guide/introduction'},
            {text: 'Installation', link: '/guide/installation'},
            {text: 'Quick start', link: '/guide/quick-start'},
            {text: 'Dockline integration', link: '/guide/dockline'},
            {text: 'Read Site Manager', link: '/guide/site-manager'},
            {text: 'Import diagnostics and identities', link: '/guide/import-workflows'},
            {text: 'Query and select sites', link: '/guide/querying'},
        ],
    },
    {
        text: 'Connect and transfer',
        collapsed: false,
        items: [
            {text: 'FTP and FTPS', link: '/guide/ftp'},
            {text: 'SFTP and host trust', link: '/guide/sftp'},
            {text: 'Streams and transfers', link: '/guide/transfers'},
            {text: 'Transfer tools and guarantees', link: '/guide/advanced-transfers'},
            {text: 'Pools and registered providers', link: '/guide/connection-pools'},
            {text: 'FTP options and encoding', link: '/guide/ftp-options'},
            {text: 'SSH options and managed trust', link: '/guide/ssh-options'},
            {text: 'Read-only connection check', link: '/guide/connection-check'},
            {text: 'Typed transfer recipes', link: '/guide/transfer-recipes'},
            {text: 'Paths and metadata', link: '/guide/paths'},
            {text: 'Errors and reconnecting', link: '/guide/errors'},
            {text: 'Security', link: '/guide/security'},
            {text: 'Troubleshooting', link: '/guide/troubleshooting'},
        ],
    },
    {
        text: 'Reference',
        collapsed: true,
        items: [
            {text: 'Packages and components', link: '/reference/packages'},
            {text: 'Public API index', link: '/reference/public-api'},
            {text: 'Typed error reference', link: '/reference/errors'},
            {text: 'SiteManager API', link: '/reference/site-manager'},
            {text: 'Server API', link: '/reference/server'},
            {text: 'Enums and XML types', link: '/reference/enums'},
            {text: 'Connector configuration', link: '/reference/configuration'},
            {text: 'Storage adapter API', link: '/reference/storage-adapter'},
            {text: 'Factories and errors', link: '/reference/factories'},
            {text: 'CLI', link: '/reference/cli'},
            {text: 'Behavior specification', link: '/reference/specification'},
        ],
    },
    {
        text: 'Development',
        collapsed: true,
        items: [
            {text: 'Architecture', link: '/development/architecture'},
            {text: 'Compiler and packaging', link: '/development/compiler'},
            {text: 'Dependencies', link: '/development/dependencies'},
            {text: 'Testing', link: '/development/testing'},
            {text: 'Contributing', link: '/development/contributing'},
            {text: 'Documentation', link: '/development/documentation'},
            {text: 'Release setup', link: '/development/releasing'},
        ],
    },
];

export default defineConfig({
    title: 'FileZilla TS',
    description: 'Read FileZilla sites and connect them through Dockline. A guide to filezilla-js.',
    lang: 'en-US',
    appearance: false,
    cleanUrls: !githubPages,
    base: process.env.DOCS_BASE || '/',
    head: [['meta', {name: 'theme-color', content: '#171a1d'}]],
    vite: {
        css: {preprocessorOptions: {scss: {api: 'modern'}}},
    },
    themeConfig: {
        siteTitle: 'FileZilla TS',
        nav: [
            {text: 'Guide', link: '/guide/introduction'},
            {text: 'API', link: '/reference/packages'},
            {text: 'CLI', link: '/reference/cli'},
        ],
        sidebar: groups,
        search: {provider: 'local'},
        outline: {level: [2, 3], label: 'On this page'},
        socialLinks: [{icon: 'github', link: 'https://github.com/h2ooooooo/filezilla-js'}],
        footer: {
            message: 'Documentation for the filezilla-js library. An independent project.',
            copyright: 'FileZilla TS contributors',
        },
        docFooter: {prev: 'Previous page', next: 'Next page'},
    },
});
