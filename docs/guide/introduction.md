# Introduction

FileZilla TS lets you use your saved FileZilla connections from JavaScript, TypeScript or the terminal. Search profiles by name, host or username, look up connection details, and read local and remote directory settings.

To find a saved profile from the terminal:

```sh
filezilla-js --search example.com --show-password
```

The CLI finds your FileZilla configuration automatically and displays a table for each match. See [installation](/guide/installation) to install the CLI or library.

The core library reads Site Manager XML and preserves its folder structure. For uploads and downloads, the FTP and SFTP packages connect saved sites through [Dockline](https://h2ooooooo.github.io/dockline/).

Start with [installation](/guide/installation), the [quick start](/guide/quick-start), [FTP](/guide/ftp), [SFTP](/guide/sftp) or the [CLI](/reference/cli). The [specification](/reference/specification) describes behavior and limitations.

FileZilla TS is an independent project and is not affiliated with or endorsed by FileZilla.
