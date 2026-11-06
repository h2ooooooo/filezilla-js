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
