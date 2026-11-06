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
