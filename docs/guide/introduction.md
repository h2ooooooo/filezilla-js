# Introduction

FileZilla TS reads saved FileZilla Site Manager configuration, preserves folder structure, and lets applications select sites by canonical path. Credentials can be excluded or loaded for one selected site. Import diagnostics, stable identities and metadata snapshots support applications that track configuration changes.

The FTP and SFTP bridge packages convert saved settings to [Dockline](https://h2ooooooo.github.io/dockline/) configuration. Dockline owns connections, authentication, streams and file transfers. FileZilla core remains independent of transport libraries.

The library does not launch FileZilla, automate its UI, write Site Manager XML or own deployment plans. Applications decide when to load credentials, approve host keys and perform remote operations.

Start with [installation](/guide/installation), the [quick start](/guide/quick-start), [FTP](/guide/ftp), [SFTP](/guide/sftp) or the [CLI](/reference/cli). The [specification](/reference/specification) describes behavior and limitations.

FileZilla TS is an independent project and is not affiliated with or endorsed by FileZilla.
