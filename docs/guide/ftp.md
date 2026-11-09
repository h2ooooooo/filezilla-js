# Saved FTP and FTPS connections

FileZilla core interprets saved FTP protocols, authentication, passive mode, filename encoding and the initial directory into a Portline definition. The shared integration converts that definition for Dockline.

Saved FTP and FTPES require explicit TLS without plaintext fallback; FTPS uses implicit TLS, and INSECURE_FTP permits plaintext. Active FTP and unsupported logon modes are refused by the shared execution layer. Saved ask-for-password modes accept `password`, `promptPassword` or a credential provider; interactive and account-based FTP modes are refused. See the [authentication matrix](/reference/enums#normalized-authentication-and-execution).

Install `@jalsoedesign/dockline-ftp-client` with the shared bridge. Follow the [saved FTP walkthrough](/guide/quick-start#connect-through-a-saved-ftp-or-ftps-configuration) and [Dockline FTP guide](https://h2ooooooo.github.io/dockline/guide/ftp) for transfer semantics.
