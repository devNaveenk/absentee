export default function TeamTab({ users, loadingUsers, newUser, setNewUser, creatingUser, createUser, toggleUserStatus }) {
  return (
    <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-base font-semibold mb-4">Team</h2>
      {loadingUsers ? (
        <div className="h-20 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
      ) : (
        <div className="space-y-2 mb-5">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <span className="font-medium">{u.email}</span>{" "}
                <span
                  className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
                >
                  {u.role.replaceAll("_", " ")}
                </span>
                {!u.is_active && (
                  <span className="ml-1 text-xs" style={{ color: "var(--color-destructive)" }}>inactive</span>
                )}
              </div>
              <button
                onClick={() => toggleUserStatus(u)}
                className="cursor-pointer text-xs font-medium underline"
                style={{ color: u.is_active ? "var(--color-destructive)" : "var(--color-accent)" }}
              >
                {u.is_active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="email"
          required
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--color-border)" }}
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={newUser.password}
          onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--color-border)" }}
        />
        <div className="flex gap-2">
          <select
            value={newUser.role}
            onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer flex-1"
            style={{ borderColor: "var(--color-border)" }}
          >
            <option value="tenant_user">Tenant User</option>
            <option value="tenant_admin">Tenant Admin</option>
          </select>
          <button
            type="submit"
            disabled={creatingUser}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            {creatingUser ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </section>
  )
}
