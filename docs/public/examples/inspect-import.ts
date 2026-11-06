import {readSiteManagerReport} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const report = readSiteManagerReport(filename, {mode: 'tolerant'});

for (const diagnostic of report.diagnostics) {
    console.log(diagnostic.code, diagnostic.sourcePath, diagnostic.field);
}

console.log('Complete:', report.complete);
console.log('Accepted:', report.acceptedCount);
console.log('Rejected:', report.rejectedCount);
