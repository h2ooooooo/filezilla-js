import type {DefaultTheme} from 'vitepress';

export const nav: DefaultTheme.NavItem[] = [
    {
        'text': 'Overview',
        'link': '/',
    },
    {
        'text': 'API',
        'link': '/api/',
        'activeMatch': '^(?!/$|(/cli/|/reference/cli|/guide/connection-check)).+',
    },
    {
        'text': 'CLI',
        'link': '/cli/',
        'activeMatch': '^(/cli/|/reference/cli|/guide/connection-check)',
    },
    {
        'text': 'Ecosystem',
        'link': 'https://h2ooooooo.github.io/portline/ecosystem',
    },
];

const apiSidebar: DefaultTheme.SidebarItem[] = [
    {
        'text': 'Getting started',
        'collapsed': false,
        'items': [
            {
                'text': 'API overview',
                'link': '/api/',
            },
            {
                'text': 'Installation',
                'link': '/guide/installation',
            },
            {
                'text': 'First saved site',
                'link': '/api/quick-start',
            },
            {
                'text': 'How it works',
                'link': '/guide/how-it-works',
            },
            {
                'text': 'Example languages and modules',
                'link': '/guide/code-examples',
            },
        ],
    },
    {
        'text': 'Read and select sites',
        'collapsed': false,
        'items': [
            {
                'text': 'Site Manager files',
                'link': '/guide/site-manager',
            },
            {
                'text': 'Search and canonical paths',
                'link': '/guide/querying',
            },
            {
                'text': 'Diagnostics and stable identities',
                'link': '/guide/import-workflows',
            },
            {
                'text': 'Normalized profiles',
                'link': '/api/profiles',
            },
        ],
    },
    {
        'text': 'Connect saved sites',
        'collapsed': false,
        'items': [
            {
                'text': 'Connect a saved site',
                'link': '/guide/quick-start',
            },
            {
                'text': 'FileZilla mapping and Dockline',
                'link': '/api/integration',
            },
            {
                'text': 'FTP and FTPS mapping',
                'link': '/guide/ftp',
            },
            {
                'text': 'SFTP credentials and host trust',
                'link': '/guide/sftp',
            },
            {
                'text': 'Run the local transfer examples',
                'link': '/guide/local-demo',
            },
        ],
    },
    {
        'text': 'Write and sync',
        'collapsed': false,
        'items': [
            {
                'text': 'API preview/apply workflow',
                'link': '/api/writing',
            },
            {
                'text': 'Native safeguards and recovery',
                'link': '/development/profile-writing',
            },
        ],
    },
    {
        'text': 'Advanced usage',
        'collapsed': true,
        'items': [
            {
                'text': 'FTP options and encodings',
                'link': '/guide/ftp-options',
            },
            {
                'text': 'SSH options and trust import',
                'link': '/guide/ssh-options',
            },
            {
                'text': 'Read-only connection checks',
                'link': '/guide/connection-check',
            },
            {
                'text': 'Paths and metadata',
                'link': '/guide/paths',
            },
            {
                'text': 'Errors and security',
                'link': '/guide/security',
            },
            {
                'text': 'Troubleshooting',
                'link': '/guide/troubleshooting',
            },
        ],
    },
    {
        'text': 'API reference',
        'collapsed': true,
        'items': [
            {
                'text': 'Packages',
                'link': '/reference/packages',
            },
            {
                'text': 'Public exports',
                'link': '/reference/public-api',
            },
            {
                'text': 'SiteManager',
                'link': '/reference/site-manager',
            },
            {
                'text': 'Server',
                'link': '/reference/server',
            },
            {
                'text': 'Enums and XML',
                'link': '/reference/enums',
            },
            {
                'text': 'Factories',
                'link': '/reference/factories',
            },
            {
                'text': 'Configuration',
                'link': '/reference/configuration',
            },
            {
                'text': 'Typed errors',
                'link': '/reference/errors',
            },
            {
                'text': 'TypeScript signatures',
                'link': '/reference/types',
            },
            {
                'text': 'Behavior specification',
                'link': '/reference/specification',
            },
        ],
    },
    {
        'text': 'Contributing',
        'collapsed': true,
        'items': [
            {
                'text': 'Architecture',
                'link': '/development/architecture',
            },
            {
                'text': 'Compiler',
                'link': '/development/compiler',
            },
            {
                'text': 'Dependencies',
                'link': '/development/dependencies',
            },
            {
                'text': 'Testing',
                'link': '/development/testing',
            },
            {
                'text': 'Documentation',
                'link': '/development/documentation',
            },
            {
                'text': 'Contributing',
                'link': '/development/contributing',
            },
        ],
    },
];

const cliSidebar: DefaultTheme.SidebarItem[] = [
    {
        'text': 'Getting started',
        'collapsed': false,
        'items': [
            {
                'text': 'CLI overview',
                'link': '/cli/',
            },
            {
                'text': 'Quick start with output',
                'link': '/cli/quick-start',
            },
            {
                'text': 'How it works',
                'link': '/guide/how-it-works',
            },
        ],
    },
    {
        'text': 'Commands',
        'collapsed': false,
        'items': [
            {
                'text': 'List, search and get',
                'link': '/cli/queries',
            },
            {
                'text': 'Connection checks',
                'link': '/guide/connection-check',
            },
            {
                'text': 'Write, sync, apply and status',
                'link': '/cli/writing',
            },
        ],
    },
    {
        'text': 'Output and automation',
        'collapsed': false,
        'items': [
            {
                'text': 'Output contracts and source options',
                'link': '/reference/cli',
            },
            {
                'text': 'Captured colours and JSON',
                'link': '/reference/cli-output',
            },
            {
                'text': 'Automation and troubleshooting',
                'link': '/cli/automation',
            },
        ],
    },
    {
        'text': 'CLI reference',
        'collapsed': true,
        'items': [
            {
                'text': 'Every command and option',
                'link': '/reference/cli-help',
            },
            {
                'text': 'Native safeguards',
                'link': '/development/profile-writing',
            },
        ],
    },
];

export const sidebar: DefaultTheme.Sidebar = {
    '/cli/': cliSidebar,
    '/reference/cli': cliSidebar,
    '/guide/connection-check': cliSidebar,
    '/': apiSidebar,
};
