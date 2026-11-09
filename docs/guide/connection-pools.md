# Connection pools

Map the selected Portline profile through the shared integration, then use Dockline's pool API when several independent sessions are needed. Each lease owns its connection resources; consume streams and iterators before releasing it.

Saved connection limits are hints for an explicit shared pool, not permission to open unbounded sessions. Every new connection uses the same explicit credential and trust policy. A pool does not count sessions opened outside it.

See [Dockline pools](https://h2ooooooo.github.io/dockline/guide/pools) for acquisition, cancellation, connection budgets and shutdown. FileZilla no longer supplies a protocol registry or separate pool implementation.
