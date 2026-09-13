# Core type reference

The current package exports typed settings, import reports, identity mappings, metadata snapshots and XML/tree input shapes. Import types from `@jalsoedesign/filezilla-core`; use packaged declarations for exact signatures.

| Types | Current contract |
| --- | --- |
| `ServerProperties`, `ServerPropertiesExtended` | [Server reference](../../../docs/reference/server.md). Raw settings are normalized, not original XML. Password, password-encoding and key-file fields are optional; the declared username type is string. Extended properties add canonical path and explicitly decoded remote-directory access. |
| `SiteManagerReadOptions`, `SiteImportDiagnostic`, `SiteManagerImportReport` | [SiteManager reference](../../../docs/reference/site-manager.md). Reader/report credential defaults differ; diagnostic completeness is explicit. |
| `SiteIdentityEndpoint`, `SiteIdentityRecord`, `SiteIdentityData`, `SiteIdentityConflict`, `SiteIdentityReconcileOptions`, `SiteIdentityReconcileResult` | [Import workflows](../../../docs/guide/import-workflows.md). Application-owned source IDs, conservative matching and all-or-nothing reconciliation. |
| `MetadataProfile`, `MetadataSite`, `MetadataSnapshot`, `MetadataSnapshotOptions`, `MetadataFieldChange`, `MetadataDiff` | [Snapshot/diff contract](../../../docs/guide/import-workflows.md#create-immutable-metadata-snapshots). Versioned immutable allowlisted metadata with opt-in sensitive categories and explicit uncertainty. |
| `ServerFolderNode`, `ServerTree` | [Tree interface](../../../docs/reference/site-manager.md#tree-types-and-boundaries). Root name is Root; folders/servers are arrays. |
| `XmlConfig`, `XmlRootFolderConfig`, `XmlFolderConfig`, `XmlServerConfig` | [Enums and XML](../../../docs/reference/enums.md). Typed input shapes for parsing; no XML builder or settings write-back API is supplied. |

The TypeScript shapes do not validate arbitrary objects. Read XML through the reader to apply field and document validation. `SiteManager.getServers()` and raw properties retain their existing mutable in-memory API; snapshot/identity/report values intentionally use readonly frozen data.
