---
layout: home
hero:
  name: FileZilla JS
  text: Use the sites you have already saved.
  tagline: Reuse FileZilla Site Manager settings from code or the terminal.
  actions:
    - theme: brand
      text: API documentation
      link: /api/
    - theme: alt
      text: CLI documentation
      link: /cli/
---

Source code: [GitHub repository](https://github.com/h2ooooooo/filezilla-js).

Site Manager already holds the hostname, username, port and starting directory for a connection. FileZilla JS makes those saved profiles available to scripts and terminal commands. Find a site by name, inspect its settings, or map supported connection and authentication settings into Dockline without maintaining another copy of the server details.

[How it works](/guide/how-it-works) explains where settings are read, how the native format is interpreted and what happens on the host.

## API documentation

Read FileZilla XML from Node.js, select sites by canonical path, inspect metadata and map saved settings into Dockline connections. Start with a small program that reads a synthetic file without connecting.

[Explore the API](/api/) · [Install](/guide/installation) · [First saved site](/api/quick-start) · [Connect a saved site](/guide/quick-start)

## CLI documentation

Use `filezilla-js` to list, search and inspect saved sites, explicitly check a connection, or preview and apply supported profile changes. Command guides show input, actual coloured output, JSON and exit codes.

[Explore the CLI](/cli/) · [First query](/cli/quick-start) · [Queries and output](/cli/queries) · [Write and sync](/cli/writing)

## Where FileZilla ends and Dockline begins

FileZilla factories map native protocol, authentication, key path, starting directory, charset and supported TLS/SSH settings. [Dockline](https://h2ooooooo.github.io/dockline/api/) performs transfers, manages sessions and runs SSH commands. [Dockline Keys](https://h2ooooooo.github.io/dockline/keys/) independently inspects and converts keys, including PPK v2/v3. [Portline](https://h2ooooooo.github.io/portline/) supplies shared profile contracts and writing safeguards.

No FileZilla connector class is needed for a generic connection: import Dockline directly. Use a FileZilla factory when starting from a saved `Server`.

Throughout these docs, **the host** is the machine running Node.js or the CLI; **the server** is the FTP/SSH endpoint. A FileZilla selection path, an XML `source path` and a remote file path are different concepts.
