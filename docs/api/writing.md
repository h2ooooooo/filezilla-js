# Preview and apply profile changes

Use the FileZilla writer to preview a supported Site Manager change, review the result, then apply it separately. Start with the read-only synthetic preview below.

## Preview a synthetic change

Install `@jalsoedesign/filezilla-core` and save the [quick-start XML fixture](/api/quick-start#save-sitemanager-xml). This program plans a new metadata-only `Demo copy` entry. It never calls `apply`, saves a preview file or changes the XML.

Save `preview-profile.ts` by default, or the filename in the selected language tab. Download: <a href="/examples/preview-profile.ts" download="preview-profile.ts">TypeScript</a> · <a href="/examples/preview-profile.js" download="preview-profile.js">JavaScript</a> · <a href="/examples/preview-profile.mjs" download="preview-profile.mjs">MJS</a> · <a href="/examples/preview-profile.cjs" download="preview-profile.cjs">CommonJS</a>

::: code-group

```ts [TypeScript]
// preview-profile.ts
import {FileZillaProfileSource, createFileZillaWriter} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const profile = source.get('Demo');

if (!profile) {
    throw new Error('Use the synthetic Demo fixture for this preview.');
}

const writer = createFileZillaWriter(source.source, {mode: 'create'});
const preview = await writer.plan([{
    ...profile,
    id: profile.id + ':copy',
    path: 'Demo copy',
    name: 'Demo copy',
}]);

console.log('Preview changes:', preview.changes.length);
console.log('Applied: false');
```

```js [JavaScript]
// preview-profile.js
import {FileZillaProfileSource, createFileZillaWriter} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const profile = source.get('Demo');

if (!profile) {
    throw new Error('Use the synthetic Demo fixture for this preview.');
}

const writer = createFileZillaWriter(source.source, {mode: 'create'});
const preview = await writer.plan([{
    ...profile,
    id: profile.id + ':copy',
    path: 'Demo copy',
    name: 'Demo copy',
}]);

console.log('Preview changes:', preview.changes.length);
console.log('Applied: false');
```

```js [MJS]
// preview-profile.mjs
import {FileZillaProfileSource, createFileZillaWriter} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const profile = source.get('Demo');

if (!profile) {
    throw new Error('Use the synthetic Demo fixture for this preview.');
}

const writer = createFileZillaWriter(source.source, {mode: 'create'});
const preview = await writer.plan([{
    ...profile,
    id: profile.id + ':copy',
    path: 'Demo copy',
    name: 'Demo copy',
}]);

console.log('Preview changes:', preview.changes.length);
console.log('Applied: false');
```

```js [CommonJS]
// preview-profile.cjs
const {FileZillaProfileSource, createFileZillaWriter} = require('@jalsoedesign/filezilla-core');

async function main() {
    const [filename = './sitemanager.xml'] = process.argv.slice(2);
    const source = FileZillaProfileSource.fromFile(filename);
    const profile = source.get('Demo');

    if (!profile) {
        throw new Error('Use the synthetic Demo fixture for this preview.');
    }

    const writer = createFileZillaWriter(source.source, {mode: 'create'});
    const preview = await writer.plan([{
        ...profile,
        id: profile.id + ':copy',
        path: 'Demo copy',
        name: 'Demo copy',
    }]);

    console.log('Preview changes:', preview.changes.length);
    console.log('Applied: false');
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
npx tsx preview-profile.ts ./sitemanager.xml
```

```sh [JavaScript]
npm pkg set type=module
node preview-profile.js ./sitemanager.xml
```

```sh [MJS]
node preview-profile.mjs ./sitemanager.xml
```

```sh [CommonJS]
node preview-profile.cjs ./sitemanager.xml
```

:::

### Output

```text
Preview changes: 1
Applied: false
```

The preview targets the selected XML file on the host. The `Demo copy` entry has only been planned; the original XML is unchanged.

## Apply a reviewed preview

Keep FileZilla closed throughout apply. The built-in commit backend requires Windows and refuses busy or unknown availability. Backups can contain original credentials and must remain private.

The following contextual recipe belongs after planning in the same program. Do not add it to the read-only example above unless the preview has been reviewed and changing that destination is intended:

::: code-group

```ts [TypeScript]
// Apply the reviewed preview to its original XML destination on the host.
const result = await writer.apply(preview);

console.log(result);
```

```js [JavaScript]
// Apply the reviewed preview to its original XML destination on the host.
const result = await writer.apply(preview);

console.log(result);
```

```js [MJS]
// Apply the reviewed preview to its original XML destination on the host.
const result = await writer.apply(preview);

console.log(result);
```

```js [CommonJS]
// Apply the reviewed preview to its original XML destination on the host.
const result = await writer.apply(preview);

console.log(result);
```

:::

See [native writing safeguards](/development/profile-writing) for revision, process/lock checks and recovery backups.

See [native writing safeguards](/development/profile-writing), [Portline's writer contract](https://h2ooooooo.github.io/portline/profile-writing), and [TypeScript declarations](/reference/types). Terminal commands are in [CLI writing](/cli/writing).


## Write intent and apply safeguards

The source and destination are the selected XML file on the host; this is a profile preview, not a server transfer. Read [normalized profiles](/api/profiles) to obtain intent from another supported source. Native query/list JSON is not normalized intent. Sync excludes credential values, private-key contents and host trust policy.

Apply rechecks destination identity, revision, native process/lock availability and preview integrity before committing. An imported or stale preview is not permission to overwrite a changed destination. See [Portline writing and recovery](https://h2ooooooo.github.io/portline/profile-writing) for the full contract.

## Execution settings and write intent

Normalized profiles now retain more execution settings than native writers can save. The writer refuses profiles with nonempty `unsupportedOptions`, an explicit boolean `passive` setting, `filenameEncoding`, or saved host fingerprint pins. It does not silently discard those requirements. A default `passive: null` may be omitted. Use an intentionally constructed write profile containing only supported intent; keep the complete original definition for execution.

Password-prompt authentication is represented by `prompt-password`, separately from keyboard-interactive `interactive`. Credential references and values are omitted from preview artifacts; saved host trust is never copied as an approval. See [Portline writing limits](https://h2ooooooo.github.io/portline/profile-writing).
