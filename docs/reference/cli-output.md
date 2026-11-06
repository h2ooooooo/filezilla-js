---
outline: 2
---

# CLI output reference

These examples were captured from the actual built CLI using synthetic native settings. No remote connection was made. Paths are normalized for portability. Terminal examples preserve the executable's ANSI color choices; JSON examples are color-free. The [complete input reference](/reference/cli-help) lists command help.

## list (terminal)

```sh
filezilla-js list --file <fixture-directory>\sitemanager.xml --color
```

Exit code: 0.

### stdout

<pre class="cli-output" v-pre><code><span style="color:#72f088;">• </span>Demo (Private key: C:/keys/example.ppk; Remote: /srv/example)</code></pre>

## list (JSON)

```sh
filezilla-js list --file <fixture-directory>\sitemanager.xml --json
```

Exit code: 0.

### stdout

```json
[
  {
    "path": "Demo",
    "host": "files.example.invalid",
    "protocol": "SFTP",
    "keyFile": "C:/keys/example.ppk",
    "remoteDirectory": "/srv/example"
  }
]
```

## list (table)

```sh
filezilla-js list --file <fixture-directory>\sitemanager.xml --table --color
```

Exit code: 0.

### stdout

<pre class="cli-output" v-pre><code><span style="color:#76e3ea;">┌</span><span style="color:#76e3ea;">──────</span><span style="color:#76e3ea;">┬</span><span style="color:#76e3ea;">───────────────────────</span><span style="color:#76e3ea;">┬</span><span style="color:#76e3ea;">──────────</span><span style="color:#76e3ea;">┬</span><span style="color:#76e3ea;">─────────────────────</span><span style="color:#76e3ea;">┬</span><span style="color:#76e3ea;">──────────────</span><span style="color:#76e3ea;">┐</span>
<span style="color:#76e3ea;">│</span> <span style="font-weight:700;"></span><span style="color:#f0f3f6;font-weight:700;">Path</span><span style="font-weight:700;"></span> <span style="color:#76e3ea;">│</span> <span style="font-weight:700;"></span><span style="color:#f0f3f6;font-weight:700;">Host                 </span><span style="font-weight:700;"></span> <span style="color:#76e3ea;">│</span> <span style="font-weight:700;"></span><span style="color:#f0f3f6;font-weight:700;">Protocol</span><span style="font-weight:700;"></span> <span style="color:#76e3ea;">│</span> <span style="font-weight:700;"></span><span style="color:#f0f3f6;font-weight:700;">Private key        </span><span style="font-weight:700;"></span> <span style="color:#76e3ea;">│</span> <span style="font-weight:700;"></span><span style="color:#f0f3f6;font-weight:700;">Remote      </span><span style="font-weight:700;"></span> <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">├</span><span style="color:#76e3ea;">──────</span><span style="color:#76e3ea;">┼</span><span style="color:#76e3ea;">───────────────────────</span><span style="color:#76e3ea;">┼</span><span style="color:#76e3ea;">──────────</span><span style="color:#76e3ea;">┼</span><span style="color:#76e3ea;">─────────────────────</span><span style="color:#76e3ea;">┼</span><span style="color:#76e3ea;">──────────────</span><span style="color:#76e3ea;">┤</span>
<span style="color:#76e3ea;">│</span> Demo <span style="color:#76e3ea;">│</span> files.example.invalid <span style="color:#76e3ea;">│</span> SFTP     <span style="color:#76e3ea;">│</span> C:/keys/example.ppk <span style="color:#76e3ea;">│</span> /srv/example <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">└</span><span style="color:#76e3ea;">──────</span><span style="color:#76e3ea;">┴</span><span style="color:#76e3ea;">───────────────────────</span><span style="color:#76e3ea;">┴</span><span style="color:#76e3ea;">──────────</span><span style="color:#76e3ea;">┴</span><span style="color:#76e3ea;">─────────────────────</span><span style="color:#76e3ea;">┴</span><span style="color:#76e3ea;">──────────────</span><span style="color:#76e3ea;">┘</span></code></pre>

## search

```sh
filezilla-js search example --file <fixture-directory>\sitemanager.xml --color
```

Exit code: 0.

### stdout

<pre class="cli-output" v-pre><code>Found 1 server

<span style="color:#76e3ea;">┌</span><span style="color:#76e3ea;">─────────────</span><span style="color:#76e3ea;">┬</span><span style="color:#76e3ea;">───────────────────────</span><span style="color:#76e3ea;">┐</span>
<span style="color:#76e3ea;">│</span> <span style="font-weight:700;"></span><span style="color:#f0f3f6;font-weight:700;">Label      </span><span style="font-weight:700;"></span> <span style="color:#76e3ea;">│</span> <span style="font-weight:700;"></span><span style="color:#f0f3f6;font-weight:700;">Value                </span><span style="font-weight:700;"></span> <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">├</span><span style="color:#76e3ea;">─────────────</span><span style="color:#76e3ea;">┼</span><span style="color:#76e3ea;">───────────────────────</span><span style="color:#76e3ea;">┤</span>
<span style="color:#76e3ea;">│</span> Name        <span style="color:#76e3ea;">│</span> Demo                  <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">│</span> Path        <span style="color:#76e3ea;">│</span> Demo                  <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">│</span> Protocol    <span style="color:#76e3ea;">│</span> SFTP                  <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">│</span> Host        <span style="color:#76e3ea;">│</span> files.example.invalid <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">│</span> Port        <span style="color:#76e3ea;">│</span> 22                    <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">│</span> Username    <span style="color:#76e3ea;">│</span> deploy                <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">│</span> Password    <span style="color:#76e3ea;">│</span> (hidden*)             <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">│</span> Private key <span style="color:#76e3ea;">│</span> C:/keys/example.ppk   <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">│</span> Remote      <span style="color:#76e3ea;">│</span> /srv/example          <span style="color:#76e3ea;">│</span>
<span style="color:#76e3ea;">└</span><span style="color:#76e3ea;">─────────────</span><span style="color:#76e3ea;">┴</span><span style="color:#76e3ea;">───────────────────────</span><span style="color:#76e3ea;">┘</span>

*Enable passwords with <span style="color:#72f088;">--show-password</span></code></pre>

## get (JSON)

```sh
filezilla-js get Demo --file <fixture-directory>\sitemanager.xml --json
```

Exit code: 0.

### stdout

```json
{
  "path": "Demo",
  "host": "files.example.invalid",
  "port": 22,
  "protocol": 1,
  "type": 0,
  "user": "deploy",
  "password": "(hidden)",
  "passwordEncoding": "base64",
  "keyFile": "C:/keys/example.ppk",
  "logonType": 1,
  "timezoneOffset": 0,
  "passiveMode": 0,
  "maximumMultipleConnections": 0,
  "encodingType": 2,
  "bypassProxy": false,
  "name": "Demo",
  "remoteDirectory": "/srv/example",
  "synchronizedBrowsing": false,
  "directoryComparison": false,
  "protocolName": "SFTP"
}
```

## get a property

```sh
filezilla-js get Demo host --file <fixture-directory>\sitemanager.xml --json
```

Exit code: 0.

### stdout

```json
"files.example.invalid"
```

## source

```sh
filezilla-js source --file <fixture-directory>\sitemanager.xml --json
```

Exit code: 0.

### stdout

```json
{
  "id": "filezilla:<fixture-directory>\\sitemanager.xml",
  "application": "FileZilla",
  "location": "<fixture-directory>\\sitemanager.xml",
  "storage": [
    {
      "kind": "file",
      "path": "<fixture-directory>\\sitemanager.xml",
      "format": "xml"
    }
  ]
}
```

## full record

```sh
filezilla-js get Demo --file <fixture-directory>\sitemanager.xml --full --json
```

Exit code: 0.

### stdout

```json
{
  "path": "Demo",
  "host": "files.example.invalid",
  "port": 22,
  "protocol": 1,
  "type": 0,
  "user": "deploy",
  "password": "(hidden)",
  "passwordEncoding": "base64",
  "keyFile": "C:/keys/example.ppk",
  "logonType": 1,
  "timezoneOffset": 0,
  "passiveMode": 0,
  "maximumMultipleConnections": 0,
  "encodingType": 2,
  "bypassProxy": false,
  "name": "Demo",
  "remoteDirectory": "/srv/example",
  "synchronizedBrowsing": false,
  "directoryComparison": false,
  "protocolName": "SFTP"
}
```

## recursive list

```sh
filezilla-js list --file <fixture-directory>\sitemanager.xml --recurse --json
```

Exit code: 0.

### stdout

```json
{
  "name": "Root",
  "folders": [],
  "servers": [
    {
      "path": "Demo",
      "host": "files.example.invalid",
      "port": 22,
      "protocol": 1,
      "type": 0,
      "user": "deploy",
      "password": "(hidden)",
      "passwordEncoding": "base64",
      "keyFile": "C:/keys/example.ppk",
      "logonType": 1,
      "timezoneOffset": 0,
      "passiveMode": 0,
      "maximumMultipleConnections": 0,
      "encodingType": 2,
      "bypassProxy": false,
      "name": "Demo",
      "remoteDirectory": "/srv/example",
      "synchronizedBrowsing": false,
      "directoryComparison": false,
      "protocolName": "SFTP"
    }
  ]
}
```

## missing profile

```sh
filezilla-js get does-not-exist --file <fixture-directory>\sitemanager.xml --json
```

Exit code: 1.

### stderr

```json
{"error":"Could not find server by path \"does-not-exist\""}
```

## write status

```sh
filezilla-js write-status --file <fixture-directory>\sitemanager.xml --json
```

Exit code: 0.

### stdout

```json
{
  "source": {
    "id": "filezilla:<fixture-directory>\\sitemanager.xml",
    "application": "FileZilla",
    "location": "<fixture-directory>\\sitemanager.xml",
    "storage": [
      {
        "kind": "file",
        "path": "<fixture-directory>\\sitemanager.xml",
        "format": "xml"
      }
    ]
  },
  "revision": "4ed3825d0564bc40a7bb874ca9c39d1de2b2951f2a4293c07e4b279870c8fc75",
  "diagnostics": [],
  "lock": "unlocked",
  "application": "closed"
}
```

## write preview

```sh
filezilla-js write --file <fixture-directory>\sitemanager.xml --input <fixture-directory>\filezilla-js-profiles.json --json
```

Exit code: 0.

### stdout

```json
{
  "schemaVersion": 1,
  "sourceId": "filezilla:<fixture-directory>\\sitemanager.xml",
  "application": "filezilla",
  "mode": "create",
  "allowLossy": false,
  "registryMode": "transactional",
  "expectedRevision": "4ed3825d0564bc40a7bb874ca9c39d1de2b2951f2a4293c07e4b279870c8fc75",
  "inspection": {
    "source": {
      "id": "filezilla:<fixture-directory>\\sitemanager.xml",
      "application": "FileZilla",
      "location": "<fixture-directory>\\sitemanager.xml",
      "storage": [
        {
          "kind": "file",
          "path": "<fixture-directory>\\sitemanager.xml",
          "format": "xml"
        }
      ]
    },
    "revision": "4ed3825d0564bc40a7bb874ca9c39d1de2b2951f2a4293c07e4b279870c8fc75",
    "diagnostics": [],
    "lock": "unlocked",
    "application": "closed"
  },
  "changes": [
    {
      "profileId": "Imported",
      "operation": "create",
      "fields": [
        "Name",
        "Host",
        "Port",
        "Protocol",
        "User",
        "Logontype",
        "Keyfile",
        "LocalDir",
        "RemoteDir",
        "Pass (cleared)"
      ]
    }
  ],
  "diagnostics": [
    {
      "code": "metadata-only-sync",
      "severity": "warning",
      "message": "Stored secrets, private key contents, trust policies and application-specific settings are not copied"
    }
  ],
  "mutations": [
    {
      "operation": "create",
      "path": "Imported",
      "profile": {
        "id": "Demo",
        "path": "Imported",
        "name": "Imported",
        "source": {
          "id": "filezilla:<fixture-directory>\\sitemanager.xml",
          "application": "FileZilla"
        },
        "connections": [
          {
            "id": "primary",
            "endpoint": {
              "host": "files.example.invalid",
              "port": 22,
              "username": "deploy"
            },
            "authentication": [
              {
                "type": "password",
                "credential": {
                  "sourceId": "omitted",
                  "id": "omitted",
                  "kind": "password",
                  "state": "not-stored"
                }
              }
            ],
            "kind": "ssh",
            "protocol": "sftp",
            "remoteDirectory": "/srv/example"
          }
        ],
        "diagnostics": []
      }
    }
  ],
  "digest": "b0923b12e6f081b6e8c0418bf881ef9022c722b71f08fba1f2ab7f51ee8b1bda"
}
```

## invalid apply

```sh
filezilla-js apply --file <fixture-directory>\sitemanager.xml --plan <fixture-directory>\missing-plan.json --json
```

Exit code: 1.

### stderr

```json
{"error":"ENOENT: no such file or directory, stat '<fixture-directory>\\missing-plan.json'"}
```

## invalid connection-check input

```sh
filezilla-js check Demo --file <fixture-directory>\sitemanager.xml --not-a-check-option --json
```

Exit code: 2.

### stdout

```json
{"schemaVersion":1,"ok":false,"status":"invalid-options","exitCode":2,"message":"Invalid check options. Run filezilla-js check --help.","stage":"input","connected":false,"directoryChecked":false,"cleanup":"not-required"}
```

## Write and sync result contracts

`write` and `sync` both emit `NativeWritePreview`: `schemaVersion`, `application`, `sourceId`, `expectedRevision`, `mode`, `allowLossy`, optional `registryMode`/`scope`, `inspection`, `diagnostics`, `changes`, sanitized `mutations` and a `digest`. They never apply settings. A digest detects an edited plan; it is not a signature. Sync requires an installed source adapter and explicit connection selection for multi-connection profiles.

Successful `apply` emits `{applied: true, sourceId, changes, backups}`. It performs guard checks and commits separately; this documentation does not execute apply against a real application store. `write-status` emits `source`, `revision`, `application`, `lock` and `diagnostics`. These write commands emit JSON even without `--json`; `--json` also requests JSON errors.

Read/query success uses stdout; shared query/write failures use stderr and exit 1. Help and successful/empty reads exit 0. With `--json`, ordinary errors have an error string. Registry refusals can additionally include `code`, `nativeCode`, `operation`, `recoveryRequired` and `backups`. Do not treat a failed lookup as an empty successful list.

Stored credentials remain hidden by default. `--show-password` explicitly changes credential visibility and may report unavailable/locked/unsupported states. Keys and remote directories appear only when present. Captured examples contain no real credential values.

FileZilla check has its own versioned outcome schema and status-specific exit codes. See [connection checks](/guide/connection-check#json-and-exit-codes). Legacy query parsing remains permissive; check and writing validate their declared flags.
