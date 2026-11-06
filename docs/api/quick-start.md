# Read your first saved site

Install one package, save a small XML fixture, then list, select and search its metadata. This example needs no FileZilla installation or server account, loads no passwords and opens no connection.

## Install

```sh
npm init -y
npm install @jalsoedesign/filezilla-core
```

Use a [supported Node.js runtime](/guide/installation). TypeScript is the default; [language setup](/guide/code-examples) explains JavaScript, MJS and CommonJS.

## Save sitemanager.xml

Save this file in the host working directory, or <a href="/examples/sitemanager.xml" download="sitemanager.xml">download the fixture</a>. It contains one synthetic site named `Demo`. The loopback address is metadata only; this program never connects to it.

```xml
<FileZilla3>
    <Servers>
        <Server>
            <Host>127.0.0.1</Host>
            <Port>22</Port>
            <Protocol>1</Protocol>
            <Type>0</Type>
            <User>deploy</User>
            <Logontype>2</Logontype>
            <Name>Demo</Name>
        </Server>
    </Servers>
</FileZilla3>
```

## Save and run the reader

Save `read-sites.ts` by default, or the filename in the selected language tab. Download: <a href="/examples/read-sites.ts" download="read-sites.ts">TypeScript</a> · <a href="/examples/read-sites.js" download="read-sites.js">JavaScript</a> · <a href="/examples/read-sites.mjs" download="read-sites.mjs">MJS</a> · <a href="/examples/read-sites.cjs" download="read-sites.cjs">CommonJS</a>

::: code-group

```ts [TypeScript]
// read-sites.ts
import {getSiteManager} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const manager = getSiteManager(filename, {includePasswords: false});

for (const site of manager.getServers()) {
    console.log(JSON.stringify({
        path: site.path,
        host: site.properties.host,
        protocol: site.siteProtocolName,
    }));
}

const selected = manager.getServerByPath('Demo');

if (!selected) {
    throw new Error('The Demo site is unavailable.');
}

console.log('Exact selection:', selected.path);
console.log('Host matches:', manager.searchServers('127.0.0.1', {fields: 'all'}).length);
console.log('Metadata only; no remote connection.');
```

```js [JavaScript]
// read-sites.js
import {getSiteManager} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const manager = getSiteManager(filename, {includePasswords: false});

for (const site of manager.getServers()) {
    console.log(JSON.stringify({
        path: site.path,
        host: site.properties.host,
        protocol: site.siteProtocolName,
    }));
}

const selected = manager.getServerByPath('Demo');

if (!selected) {
    throw new Error('The Demo site is unavailable.');
}

console.log('Exact selection:', selected.path);
console.log('Host matches:', manager.searchServers('127.0.0.1', {fields: 'all'}).length);
console.log('Metadata only; no remote connection.');
```

```js [MJS]
// read-sites.mjs
import {getSiteManager} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const manager = getSiteManager(filename, {includePasswords: false});

for (const site of manager.getServers()) {
    console.log(JSON.stringify({
        path: site.path,
        host: site.properties.host,
        protocol: site.siteProtocolName,
    }));
}

const selected = manager.getServerByPath('Demo');

if (!selected) {
    throw new Error('The Demo site is unavailable.');
}

console.log('Exact selection:', selected.path);
console.log('Host matches:', manager.searchServers('127.0.0.1', {fields: 'all'}).length);
console.log('Metadata only; no remote connection.');
```

```js [CommonJS]
// read-sites.cjs
const {getSiteManager} = require('@jalsoedesign/filezilla-core');

async function main() {
    const [filename = './sitemanager.xml'] = process.argv.slice(2);
    const manager = getSiteManager(filename, {includePasswords: false});

    for (const site of manager.getServers()) {
        console.log(JSON.stringify({
            path: site.path,
            host: site.properties.host,
            protocol: site.siteProtocolName,
        }));
    }

    const selected = manager.getServerByPath('Demo');

    if (!selected) {
        throw new Error('The Demo site is unavailable.');
    }

    console.log('Exact selection:', selected.path);
    console.log('Host matches:', manager.searchServers('127.0.0.1', {fields: 'all'}).length);
    console.log('Metadata only; no remote connection.');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
```

:::

### Run

::: code-group

```sh [TypeScript]
npm install --save-dev typescript tsx @types/node
npm pkg set type=module
npx tsx read-sites.ts ./sitemanager.xml
```

```sh [JavaScript]
npm pkg set type=module
node read-sites.js ./sitemanager.xml
```

```sh [MJS]
node read-sites.mjs ./sitemanager.xml
```

```sh [CommonJS]
node read-sites.cjs ./sitemanager.xml
```

:::

### Output

```text
{"path":"Demo","host":"127.0.0.1","protocol":"SFTP"}
Exact selection: Demo
Host matches: 1
Metadata only; no remote connection.
```

The methods return objects and arrays; the example explicitly prints this metadata. No filesystem setup code is needed in the program because the input file was saved above.

## Use an existing Site Manager file

Pass the selected XML filename in place of `./sitemanager.xml`, then choose a path returned by `manager.getServers()` instead of `Demo`. Exact selection is case-sensitive; search can return multiple sites. Read [credential loading](/guide/site-manager#credentials-and-serialization) before opting into saved passwords.

## If it fails

| Symptom | Next step |
| --- | --- |
| File not found | Run from the directory containing the fixture or pass its explicit path. |
| Demo unavailable | Use the fixture above or select a canonical path actually returned by the file. |
| Invalid XML or field | Follow [validation and import diagnostics](/guide/import-workflows). |

Next: [query recipes](/guide/querying), [import diagnostics](/guide/import-workflows), [normalized profiles](/api/profiles), or [connect a saved site](/guide/quick-start).
