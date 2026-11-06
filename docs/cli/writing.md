# Write and sync profiles

Inspect availability, save a preview, review it, then apply it as a separate step. Planning changes no native settings.

## Inspect the destination

Select the Site Manager XML file on the host:

```sh
filezilla-js write-status --file sitemanager.xml --json
```

The result describes whether the destination can be written. [Captured status output](/reference/cli-output#write-status) shows the JSON shape; inspecting availability does not apply changes.

## Save a preview

Prepare supported normalized intent in `profiles.json`, using [a normalized profile source](/api/profiles). Native query JSON and compact list results are different representations and are not write intent.

```sh
filezilla-js write --file sitemanager.xml --input profiles.json --preview plan.json --json
```

This reads the selected XML destination and saves the proposed changes to `plan.json` on the host. It leaves native settings unchanged and refuses to replace an existing preview. Compare the changes and diagnostics before proceeding; see [captured preview output](/reference/cli-output#write-preview).

## Sync from another source

Install the selected allowlisted source adapter and use `sync --from <application>` with an explicit source selector and exact profile/connection. Sync produces a preview; stored secrets, key contents and host trust policies are excluded. [Complete inputs](/reference/cli-help#sync) lists the supported selectors and flags.

## Apply the reviewed preview

This step changes the selected XML file. Keep FileZilla closed throughout apply. Built-in commits require Windows and refuse busy or unknown availability.

```sh
filezilla-js apply --file sitemanager.xml --plan plan.json --json
```

## Safeguards and recovery

Apply rechecks source identity/revision, native process/lock availability and preview integrity, and retains protected backups. Backups can contain original credentials. An inspection or earlier preview does not bypass these checks. See [native safeguards](/development/profile-writing), [captured refusals](/reference/cli-output#invalid-apply), and [Portline recovery details](https://h2ooooooo.github.io/portline/profile-writing).
