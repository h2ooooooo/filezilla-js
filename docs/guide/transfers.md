# Streams and transfers

Use [the complete saved-site programs](/guide/quick-start) to select FileZilla settings and connect. For generic operations, follow the Dockline recipes below. FileZilla supplies mapping rather than a second transfer implementation.

## Upload and download

Uploads take a host source and server destination; downloads take a server source and host destination. See [Dockline: upload and download](https://h2ooooooo.github.io/dockline/api/files).

## Timeouts and retries

Set per-operation deadlines and permitted retry behavior after establishing a working connection. See [Dockline: timeouts and retries](https://h2ooooooo.github.io/dockline/guide/configuration).

## Explicitly replayable uploads

For a permitted upload retry, supply a factory that returns a fresh unread source stream for each attempt. See [Dockline: explicitly replayable uploads](https://h2ooooooo.github.io/dockline/guide/ftp#retry-and-keepalive-policy).

## Completion and concurrency

Consume streams and iterators within their owning connection lifetime before disconnecting. See [Dockline: completion and concurrency](https://h2ooooooo.github.io/dockline/guide/usage#streams-and-listing).

## Optional FileStorage wrapper

Use a separate storage wrapper only when its additional API is needed; review its path normalization and lifecycle behavior. See [Dockline: optional filestorage wrapper](https://h2ooooooo.github.io/dockline/guide/usage#advanced-access).

## Metadata and mutations

List, inspect, rename or remove server paths through the connected Dockline API. See [Dockline: metadata and mutations](https://h2ooooooo.github.io/dockline/api/files).
