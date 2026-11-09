# Read normalized profiles

Use `FileZillaProfileSource` to list saved sites as normalized profiles for shared queries and sync. Start by reading metadata from the same XML fixture as the reader quick start.

## Read metadata

Install `@jalsoedesign/filezilla-core` and save the [quick-start XML fixture](/api/quick-start#save-sitemanager-xml). This complete program opens no connection and does not resolve credentials.

Save `profile-metadata.ts` by default, or the filename in the selected language tab. Download: <a href="/examples/profile-metadata.ts" download="profile-metadata.ts">TypeScript</a> · <a href="/examples/profile-metadata.js" download="profile-metadata.js">JavaScript</a> · <a href="/examples/profile-metadata.mjs" download="profile-metadata.mjs">MJS</a> · <a href="/examples/profile-metadata.cjs" download="profile-metadata.cjs">CommonJS</a>

::: code-group

```ts [TypeScript]
// profile-metadata.ts
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);

for (const profile of source.list()) {
    console.log('Profile:', profile.path);
    console.log('Connections:', profile.connections.length);
}

console.log('Metadata only; credentials unresolved.');
```

```js [JavaScript]
// profile-metadata.js
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);

for (const profile of source.list()) {
    console.log('Profile:', profile.path);
    console.log('Connections:', profile.connections.length);
}

console.log('Metadata only; credentials unresolved.');
```

```js [MJS]
// profile-metadata.mjs
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);

for (const profile of source.list()) {
    console.log('Profile:', profile.path);
    console.log('Connections:', profile.connections.length);
}

console.log('Metadata only; credentials unresolved.');
```

```js [CommonJS]
// profile-metadata.cjs
const {FileZillaProfileSource} = require('@jalsoedesign/filezilla-core');

async function main() {
    const [filename = './sitemanager.xml'] = process.argv.slice(2);
    const source = FileZillaProfileSource.fromFile(filename);

    for (const profile of source.list()) {
        console.log('Profile:', profile.path);
        console.log('Connections:', profile.connections.length);
    }

    console.log('Metadata only; credentials unresolved.');
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
npx tsx profile-metadata.ts ./sitemanager.xml
```

```sh [JavaScript]
npm pkg set type=module
node profile-metadata.js ./sitemanager.xml
```

```sh [MJS]
node profile-metadata.mjs ./sitemanager.xml
```

```sh [CommonJS]
node profile-metadata.cjs ./sitemanager.xml
```

:::

### Output

```text
Profile: Demo
Connections: 1
Metadata only; credentials unresolved.
```

## Select, search and sync

`source.get(path)` selects an exact canonical profile; `source.search(term, options)` returns matching metadata. `source.list()` supplies complete supported connection definitions for shared execution and supported writing workflows. Execution settings may exceed the native writer's supported intent: explicit passive mode, filename encoding, trust pins and unsupported native requirements cause write planning to refuse the profile. See [execution settings and write intent](/api/writing#execution-settings-and-write-intent). Native CLI query JSON and compact list output are different representations and cannot be used as normalized write intent.

For shared contracts use [Portline](https://h2ooooooo.github.io/portline/connection-profiles). FileZilla keeps its own reader, native credential/trust providers, writer factory and CLI. The shared Portline–Dockline bridge handles execution mapping. See [preview/apply](/api/writing) before changing native settings.


## Profile model and credential references

`FileZillaProfileSource` projects native saved sites into Portline's shared profile model. A profile keeps its source identity and connections; credentials remain references until explicitly resolved. Native FileZilla fields remain accessible through the source's `manager`.

See [Portline contracts](https://h2ooooooo.github.io/portline/connection-profiles) for the full model. Reading or searching normalized profiles does not resolve their credential references.
