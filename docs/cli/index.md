# CLI documentation

`@jalsoedesign/filezilla-cli` installs `filezilla-js`: list, search and inspect saved sites, explicitly check a connection, and preview supported writes or cross-application sync.

## Get a first result

Follow the [CLI quick start](/cli/quick-start) to install, save synthetic XML and run a query with exact output. No FileZilla installation or server is required. To exercise an actual FTP/SFTP server, use the [local fixtures](/guide/local-demo).

## Choose a task

| Task | Guide |
| --- | --- |
| List, search or get an exact saved site | [Queries with coloured output](/cli/queries) |
| Verify one saved connection deliberately | [Connection check](/guide/connection-check) |
| Inspect write availability, preview, sync or apply | [Writing workflow](/cli/writing) |
| Work with JSON, exit status and scripts | [Automation](/cli/automation) |

Terminal commands do not depend on a programming language. Shell-specific syntax uses PowerShell and macOS/Linux tabs; Node.js API examples use matching language and run-command tabs.

## Reference and boundaries

[Every command and flag](/reference/cli-help) documents inputs. [Captured output](/reference/cli-output) documents coloured tables, redaction, JSON shapes, success and failure. [Query behavior](/reference/cli) explains selection and credential visibility.

The CLI does not provide upload/download subcommands. Use [Dockline CLI](https://h2ooooooo.github.io/dockline/cli/) for generic terminal transfers or [FileZilla factories](/api/integration) to connect saved sites from code. Applying profile changes remains a separate reviewed operation with process/lock checks and backups.
