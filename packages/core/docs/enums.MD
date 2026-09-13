# Core Enums Reference

This document provides a detailed reference for all enums used in `@jalsoedesign/filezilla-core`.

## LogonType

Specifies how the server handles the login process.

| Value | Name          | Description |
|:------|:--------------|:------------|
| `0`   | `anonymous`   |             |
| `1`   | `normal`      |             |
| `2`   | `ask`         | Requires explicit application credentials/provider or supported SFTP authentication options. |
| `3`   | `interactive` |             |
| `4`   | `account`     |             |
| `5`   | `key`         |             |
| `6`   | `profile`     | S3 profile  |
| `7`   | `adc`         | Google Cloud Application Default Credentials |

## ServerProtocol

The numeric values used by FileZilla for different protocols.

| Value | Name                   | Description                  |
|:------|:-----------------------|:-----------------------------|
| `-1`  | `UNKNOWN`              |                              |
| `0`   | `FTP`                  | Explicit TLS required by the connector       |
| `1`   | `SFTP`                 | SSH File Transfer Protocol   |
| `2`   | `HTTP`                 |                              |
| `3`   | `FTPS`                 | Implicit SSL                 |
| `4`   | `FTPES`                | Explicit SSL                 |
| `5`   | `HTTPS`                |                              |
| `6`   | `INSECURE_FTP`         | Insecure, as the name suggests |
| `7`   | `S3`                   | Amazon S3 or compatible      |
| `8`   | `STORJ`                |                              |
| `9`   | `WEBDAV`               |                              |
| `10`  | `AZURE_FILE`           |                              |
| `11`  | `AZURE_BLOB`           |                              |
| `12`  | `SWIFT`                | OpenStack Swift              |
| `13`  | `GOOGLE_CLOUD`         |                              |
| `14`  | `GOOGLE_DRIVE`         |                              |
| `15`  | `DROPBOX`              |                              |
| `16`  | `ONEDRIVE`             |                              |
| `17`  | `B2`                   | Backblaze B2                 |
| `18`  | `BOX`                  |                              |
| `19`  | `INSECURE_WEBDAV`      |                              |
| `20`  | `RACKSPACE`            |                              |
| `21`  | `STORJ_GRANT`          |                              |
| `22`  | `S3_SSO`               |                              |
| `23`  | `GOOGLE_CLOUD_SVC_ACC` |                              |
| `24`  | `CLOUDFLARE_R2`        |                              |

## ServerType

Specifies the operating system or server type of the remote host.

| Value | Name              | Description |
|:------|:------------------|:------------|
| `0`   | `DEFAULT`         |             |
| `1`   | `UNIX`            |             |
| `2`   | `VMS`             |             |
| `3`   | `DOS`             | Backslashes as preferred separator |
| `4`   | `MVS`             |             |
| `5`   | `VXWORKS`         |             |
| `6`   | `ZVM`             |             |
| `7`   | `HPNONSTOP`       |             |
| `8`   | `DOS_VIRTUAL`     |             |
| `9`   | `CYGWIN`          |             |
| `10`  | `DOS_FWD_SLASHES` | Forward slashes as preferred separator |

## PasvMode

Specifies the passive mode setting (FTP only).

| Value | Name           |
|:------|:---------------|
| `0`   | `MODE_DEFAULT` |
| `1`   | `MODE_ACTIVE`  |
| `2`   | `MODE_PASSIVE` |

## CharsetEncoding

Specifies the character encoding used by the server.

| Value | Name              |
|:------|:------------------|
| `0`   | `ENCODING_UTF8`   |
| `1`   | `ENCODING_CUSTOM` |
| `2`   | `ENCODING_AUTO`   |

These are saved metadata values, not proof of connector support. See the [factory logon matrix](../../../docs/reference/factories.md) and [current enum reference](../../../docs/reference/enums.md).

## ServerFormat

Specifies how the server address is formatted.

| Value | Name                          |
|:------|:------------------------------|
| `0`   | `HOST_ONLY`                   |
| `1`   | `WITH_OPTIONAL_PORT`          |
| `2`   | `WITH_USER_AND_OPTIONAL_PORT` |
| `3`   | `URL`                         |
| `4`   | `URL_WITH_PASSWORD`           |

---

## License

MIT © [JalsoeDesign](https://www.jalsoedesign.net)
