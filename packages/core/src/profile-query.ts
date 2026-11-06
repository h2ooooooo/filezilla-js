import type {ProfileQueryAdapter} from '@jalsoedesign/portline-core';
import type {Server} from './Server';

export const fileZillaProfileQuery: ProfileQueryAdapter<Server> = {
    path: server => server.path,
    name: server => server.propertiesRaw.name,
    searchValues: server => {
        const values: unknown[] = [server.siteProtocolName, ...Object.values(server.propertiesRaw)];

        try {
            values.push(server.getRemoteDirectory());
        } catch {
            // Native encoded paths remain searchable when decoding is unsupported.
        }

        return values;
    },
    folderNames: server => server.path.split('/').slice(0, -1).map(part =>
        part.replace(/%(?:25|2f)/gi, value => value.toLowerCase() === '%2f' ? '/' : '%'),
    ),
};
