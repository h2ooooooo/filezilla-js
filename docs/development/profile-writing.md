# Profile writing

FileZilla provides `createFileZillaWriter` through `@jalsoedesign/filezilla-core`. The `filezilla-js` executable supplies `write`, `sync`, `apply` and read-only `write-status` commands. Start with the [API preview example](/api/writing) or [CLI workflow](/cli/writing).

## Preview a native change

```sh
filezilla-js write --file sitemanager.xml --input profiles.json --preview plan.json --json
```

Saving a preview does not change settings. `profiles.json` must contain supported normalized intent, rather than native query JSON or compact list output.

## Sync from FileZilla

Use `FileZillaProfileSource` from `@jalsoedesign/filezilla-core` to read normalized connections in code. For a CLI sync preview, select the source file, exact profile and destination explicitly:

```sh
filezilla-js sync --from filezilla --from-file source.xml --profile Demo --target-path "Demo copy" --file destination.xml --preview sync-plan.json --json
```

This reads the selected `Demo` profile from `source.xml` and saves a preview to create `Demo copy` in `destination.xml`; all three files are on the host. It does not apply the preview. See [sync inputs](/reference/cli-help#sync) for source selectors and connection selection. Sync never copies stored credential values, private-key contents or host trust policies.

## Apply after review

Keep FileZilla closed throughout apply. Built-in commits require Windows; apply rechecks the destination revision, application processes, known lock markers and preview integrity, and retains protected recovery backups.

```sh
filezilla-js apply --file sitemanager.xml --plan plan.json --json
```

Recovery backups can contain original stored credentials and must remain private. See [Portline's writing guide](https://h2ooooooo.github.io/portline/profile-writing) for format boundaries, recovery and platform limitations.

## Execution settings and write intent

Normalized profiles now retain more execution settings than native writers can save. The writer refuses profiles with nonempty `unsupportedOptions`, an explicit boolean `passive` setting, `filenameEncoding`, or saved host fingerprint pins. It does not silently discard those requirements. A default `passive: null` may be omitted. Use an intentionally constructed write profile containing only supported intent; keep the complete original definition for execution.

Password-prompt authentication is represented by `prompt-password`, separately from keyboard-interactive `interactive`. Credential references and values are omitted from preview artifacts; saved host trust is never copied as an approval. See [Portline writing limits](https://h2ooooooo.github.io/portline/profile-writing).
