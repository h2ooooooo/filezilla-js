---
outline: 2
---

# List, search and get

Start with the [CLI quick start](/cli/quick-start) for installation. To reproduce these captures, create a new directory and <a href="/examples/query-sitemanager.xml" download="sitemanager.xml">save this synthetic fixture as `sitemanager.xml`</a> there. It contains a deliberately invalid external hostname, a dummy key path and a demonstration password. These query commands only read XML; they never connect or load the referenced key file.

The transcripts preserve the actual CLI colours. Local absolute paths in JSON are abbreviated as `<fixture-directory>`; use the filename saved above. [Query behavior](/reference/cli) explains canonical paths and redaction. [All output shapes](/reference/cli-output) includes full records, previews and refusals.

## list (terminal)
```sh
filezilla-js list --file ./sitemanager.xml --color
```

Exit code: 0.

### stdout

<pre class="cli-output" v-pre><code><span style="color:#72f088;">• </span>Demo (Private key: C:/keys/example.ppk; Remote: /srv/example)</code></pre>

## list (JSON)
```sh
filezilla-js list --file ./sitemanager.xml --json
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
filezilla-js list --file ./sitemanager.xml --table --color
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
filezilla-js search example --file ./sitemanager.xml --color
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
filezilla-js get Demo --file ./sitemanager.xml --json
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
filezilla-js get Demo host --file ./sitemanager.xml --json
```

Exit code: 0.

### stdout

```json
"files.example.invalid"
```

## source
```sh
filezilla-js source --file ./sitemanager.xml --json
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
