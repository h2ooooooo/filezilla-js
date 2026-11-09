# API documentation

Read FileZilla Site Manager data, select saved sites, map them into Dockline connections and preview supported native changes. Importing or mapping a site does not open a connection.

## Get a first result

| Step | Guide |
| --- | --- |
| Install only the packages needed | [Installation](/guide/installation) |
| Read, select and search a synthetic site | [API quick start](/api/quick-start) |
| Choose TypeScript, JavaScript, MJS or CommonJS | [Language and module setup](/guide/code-examples) |
| Test real transfers without a server account | [Disposable local servers](/guide/local-demo) |

## Common tasks

| Task | Guide |
| --- | --- |
| Read an explicit file and control credential loading | [Site Manager](/guide/site-manager) |
| Search, select and build a folder tree | [Queries and canonical paths](/guide/querying) |
| Inspect malformed records and keep stable selections | [Import workflows](/guide/import-workflows) |
| Read normalized Portline metadata | [Normalized profiles](/api/profiles) |
| Connect and transfer through a saved FTP/SFTP site | [Saved-site walkthrough](/guide/quick-start) |
| Run SSH commands through a saved SFTP endpoint | [SSH walkthrough](/guide/ssh) |
| Import FileZilla's explicit trusted host records | [SFTP and host trust](/guide/sftp) |
| Preview a native profile change | [Writing API](/api/writing) |

## Advanced usage

Read [FileZilla-to-Dockline mapping](/api/integration) before opening a shared connection. Then explore [FTP/TLS mapping](/guide/ftp), [SSH credentials and trust](/guide/ssh-options), [path semantics](/guide/paths), [connection pools](/guide/connection-pools), and [typed errors](/guide/errors).

Generic transfer methods, SSH execution and key conversion are documented by [Dockline](https://h2ooooooo.github.io/dockline/api/) and [Dockline Keys](https://h2ooooooo.github.io/dockline/keys/).

## Reference

Look up [public exports](/reference/public-api), [`SiteManager`](/reference/site-manager), [Server](/reference/server), [shared connections](/reference/factories), or [exact TypeScript declarations](/reference/types). [CLI documentation](/cli/) is a separate journey.
