# Introduction

FileZilla JS reads saved Site Manager entries from Node.js or the terminal. Select and search sites, read connection metadata, map saved settings into Dockline, or preview supported profile changes.

## Start with the API

[Install `filezilla-core`](/guide/installation), then [read a synthetic saved site](/api/quick-start). The first example opens no connection and needs no FileZilla installation. Once that works, [select/search sites](/guide/querying) or [connect a saved site](/guide/quick-start).

## Start with the CLI

Follow [the CLI quick start](/cli/quick-start) to install `filezilla-js`, save a fixture and run a query. [Query transcripts](/cli/queries) show real coloured output and JSON; passwords remain hidden by default.

## Choose a source

Use an explicit XML filename for predictable selection. Automatic discovery checks [standard locations](/guide/site-manager#automatic-location); it does not identify every launcher override or the active FileZilla version.

## Explore further

[API documentation](/api/) and [CLI documentation](/cli/) organize common tasks. [Writing and sync](/api/writing) explains the separate preview/apply workflow. [Architecture](/guide/dockline) explains the FileZilla, Portline and Dockline responsibilities; [reference](/reference/public-api) lists public APIs.

FileZilla JS is an independent project and is not affiliated with or endorsed by FileZilla.
