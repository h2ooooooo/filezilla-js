# FTP execution options

Saved FTP TLS policy, passive mode, filename encoding and initial directory are normalized by FileZilla core. The shared Portline–Dockline bridge validates them and produces Dockline configuration.

Runtime connection options control deadlines, cancellation, retry policy, progress and connection events. They are supplied to the shared bridge instead of application-specific factories. Saved authentication requirements remain explicit; unsupported active FTP or encoding settings are refused.

See [saved FTP mapping](/guide/ftp), the [complete program](/guide/quick-start) and [Dockline FTP options](https://h2ooooooo.github.io/dockline/guide/ftp). Transfer content bytes are not transcoded by filename encoding settings.
