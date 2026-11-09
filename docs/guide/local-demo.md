# Run a local demo

These repository fixture commands run assertions against disposable servers. Their existing `.mjs` filenames belong to development tools, rather than copy-and-save API programs; use [the API quick start](/api/quick-start) for all four language variants. Run the commands from this repository’s root after installing its dependencies. Build the packages once:

```sh
npm run build
```

FTP/SFTP examples start actual protocol servers bound to 127.0.0.1 on automatically selected temporary ports. They use public test credentials, generated SSH host keys and temporary storage. The SFTP fixture is reused from the integration tests. No Docker, system service, application installation or real account is needed. Each example stops its server and removes its temporary files on success or failure. No existing application settings are read or changed.

## FTP

Run:

```sh
node examples/test-ftp.mjs
```

Equivalent npm command: `npm run demo:ftp`.

The example invokes the real `filezilla-js check` command, checks its JSON status and connection cleanup, then uploads and downloads a file through the shared Portline–Dockline bridge. The CLI check itself performs no transfer.

Expected output, captured from a successful run:

```text
FTP server started on 127.0.0.1 (temporary port).
$ filezilla-js check Demo --file <temporary-site-manager> --json
{"schemaVersion":1,"ok":true,"status":"ok","exitCode":0,"message":"Connection check completed.","stage":"ready","connected":true,"directoryChecked":false,"cleanup":"closed"}
SDK upload: hello.txt (21 bytes).
SDK download: exact bytes verified.
PASS: FileZilla configuration -> local FTP connection and transfers.
Local server stopped.
Temporary files removed.
```

## SFTP

Run:

```sh
node examples/test-sftp.mjs
```

Equivalent npm command: `npm run demo:sftp`.

The example invokes the real `filezilla-js check` command, checks its JSON status and connection cleanup, then uploads and downloads a file through the shared Portline–Dockline bridge. The generated server key is pinned explicitly. A second CLI invocation deliberately supplies a wrong pin and must fail with exit 3. The CLI check itself performs no transfer.

Expected output, captured from a successful run:

```text
SFTP server started on 127.0.0.1 (temporary port).
$ filezilla-js check Demo --file <temporary-site-manager> --host-key-sha256 <generated-pin> --json
{"schemaVersion":1,"ok":true,"status":"ok","exitCode":0,"message":"Connection check completed.","stage":"ready","connected":true,"directoryChecked":false,"cleanup":"closed"}
Wrong host-key pin rejected (exit 3).
SDK upload: hello.txt (21 bytes).
SDK download: exact bytes verified.
PASS: FileZilla configuration -> local SFTP connection and transfers.
Local server stopped.
Temporary files removed.
```

## SSH commands and downloadable programs

Run every complete documentation program, including the [saved-site SSH example](/guide/ssh), against disposable fixtures:

```sh
npm run docs:examples:check
```

This checks strict TypeScript types, synchronized downloadable files and all TypeScript, JavaScript, MJS and CommonJS variants. FTP/SFTP programs transfer synthetic files. The SSH server accepts the example's quoted `uname -s` request and returns synthetic `Linux` output; it never runs a command on the host. Verified pins come from each generated fixture key, and no real settings or account is read.

Successful completion ends with `32 language variants passed using synthetic XML and local fixtures only.` The SSH program uses `withSsh`; it is not a FileZilla CLI command.

## Interpreting the result

Each command exits 0 only after its assertions pass. A CLI failure, incorrect response, changed bytes or unexpected trust behavior produces a nonzero exit and an assertion error. Server ports, temporary paths, platform metadata and any file timestamps can vary. The wrapper displays temporary paths as `<temporary-directory>`; the child CLI receives actual paths. Run a single example at a time when comparing its transcript.

These examples require the development dependencies in this checkout, including the local protocol fixtures where applicable. They are not additional published CLI commands. For complete CLI inputs, output contracts and colored terminal examples, use the CLI reference.
