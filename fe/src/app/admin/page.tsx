"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Images,
  LogOut,
  Plus,
  RefreshCw,
  ArrowUpRight,
  Upload,
  Pencil,
  Trash2,
} from "lucide-react";
import { categories, type Entry, type Media } from "@/lib/aldy";
const blank: Entry = {
  slug: "",
  title: "",
  category: categories[0],
  period: "",
  startDate: "",
  organization: "",
  description: "",
  imageUrl: "",
};
type Tab = "overview" | "experiences" | "media";
interface Dashboard {
  entries: Entry[];
  media: Media[];
  admin: { email: string };
  database: string;
  storage: string;
}
export default function Admin() {
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [draft, setDraft] = useState<Entry>({ ...blank });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [deleteEntry, setDeleteEntry] = useState("");
  const [deleteImage, setDeleteImage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  function clearSession() {
    sessionStorage.removeItem("aldy-admin-token");
    setToken("");
    setDashboard(null);
    setDraft({ ...blank });
    setEditing(false);
  }
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    session = token,
  ) {
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session}`;
    if (body && !(body instanceof FormData))
      headers["Content-Type"] = "application/json";
    const response = await fetch(`/api/aldy/${path}`, {
      method,
      headers,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) clearSession();
      throw new Error(data.message || "The request could not be completed.");
    }
    return data;
  }
  async function refresh(session = token) {
    setLoading(true);
    try {
      setDashboard(await request("admin/dashboard", "GET", undefined, session));
    } catch (e) {
      setError((e as Error).message || "The dashboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const saved = sessionStorage.getItem("aldy-admin-token");
    if (!saved) {
      setChecking(false);
      return;
    }
    let active = true;
    fetch("/api/aldy/admin/check", {
      headers: { Authorization: `Bearer ${saved}` },
      signal: AbortSignal.timeout(20000),
    })
      .then(async (r) => {
        if (!active) return;
        if (r.ok) {
          setToken(saved);
          await refresh(saved);
        } else {
          sessionStorage.removeItem("aldy-admin-token");
          setError("Your session has expired. Please sign in again.");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "The server could not be reached. Please try signing in again.",
          );
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await request(
        "admin/login",
        "POST",
        { email, password },
        "",
      );
      sessionStorage.setItem("aldy-admin-token", data.token);
      setToken(data.token);
      setPassword("");
      await refresh(data.token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await request("admin/logout", "POST");
      clearSession();
      setMessage("You have signed out.");
    } catch (e) {
      setError(`${(e as Error).message} The local session has been cleared.`);
      clearSession();
    } finally {
      setBusy(false);
    }
  }
  function edit(entry?: Entry) {
    setDraft(entry ? { ...entry } : { ...blank });
    setEditing(!!entry);
    setTab("experiences");
    setError("");
    setMessage("");
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        }),
      50,
    );
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request(
        `admin/experiences/${encodeURIComponent(draft.slug)}`,
        editing ? "PUT" : "POST",
        draft,
      );
      setDraft({ ...blank });
      setEditing(false);
      setMessage("Experience saved.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function removeEntry(slug: string) {
    setBusy(true);
    setError("");
    try {
      await request(`admin/experiences/${encodeURIComponent(slug)}`, "DELETE");
      setDeleteEntry("");
      if (draft.slug === slug) {
        setDraft({ ...blank });
        setEditing(false);
      }
      setMessage("Experience deleted.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File, attach = false) {
    if (!file) return;
    setMessage("");
    setError("");
    if (file.size > 4 * 1024 * 1024) {
      setError("Choose an image no larger than 4 MB.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const data = await request("admin/images", "POST", form);
      if (attach) setDraft((d) => ({ ...d, imageUrl: data.url }));
      setMessage(
        attach
          ? "Image uploaded. Save the experience to apply it."
          : "Image uploaded to Supabase Storage.",
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function removeImage(name: string) {
    setBusy(true);
    setError("");
    try {
      await request(`admin/images/${encodeURIComponent(name)}`, "DELETE");
      setDeleteImage("");
      setMessage("Image deleted.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const entries = dashboard?.entries || [];
  const media = dashboard?.media || [];
  const filtered = entries.filter((e) =>
    `${e.title} ${e.organization} ${e.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  if (checking)
    return (
      <div className="shell page-content state" role="status">
        Checking your session…
      </div>
    );
  if (!token)
    return (
      <div className="shell page-content admin-login">
        <div>
          <p className="eyebrow">Portfolio management</p>
          <h1>
            A space for
            <br />
            your next chapter.
          </h1>
          <p>Sign in to manage your experiences and images.</p>
          <Link className="text-link" href="/">
            Back to the portfolio <ArrowUpRight size={16} />
          </Link>
        </div>
        <form className="admin-form login-form" onSubmit={login}>
          <h2>Admin sign in</h2>
          {error && (
            <p className="notice error-notice" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="form-hint">
            Use the Supabase Auth account authorized for this portfolio.
          </p>
        </form>
      </div>
    );
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <p className="dashboard-title">Aldy’s workspace</p>
        <span className="workspace-caption">Portfolio dashboard</span>
        <nav aria-label="Dashboard navigation">
          {(
            [
              { id: "overview", label: "Overview", Icon: LayoutDashboard },
              {
                id: "experiences",
                label: "Experiences",
                Icon: BriefcaseBusiness,
              },
              { id: "media", label: "Image library", Icon: Images },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank" rel="noopener noreferrer">
            View portfolio <ArrowUpRight size={16} />
          </Link>
          <button onClick={logout} disabled={busy}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="dashboard-content">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">
              {tab === "overview"
                ? "Your portfolio at a glance"
                : tab === "experiences"
                  ? "Your journey"
                  : "Supabase Storage"}
            </p>
            <h1>
              {tab === "overview"
                ? "Welcome back, Aldy."
                : tab === "experiences"
                  ? "Manage experiences"
                  : "Image library"}
            </h1>
            <p>
              {tab === "overview"
                ? "Keep your story current, one experience at a time."
                : tab === "experiences"
                  ? "Add, edit, and organize the roles you share."
                  : "Upload images and reuse them across your experiences."}
            </p>
          </div>
          <button
            className="button secondary"
            disabled={busy || loading}
            onClick={() => {
              setError("");
              void refresh();
            }}
          >
            <RefreshCw size={16} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {error && (
          <p className="notice error-notice" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {loading && !dashboard && <p role="status">Loading dashboard…</p>}
        {!loading && !dashboard && (
          <div className="state">
            <p>
              The dashboard is unavailable. Check the Supabase setup and try
              again.
            </p>
            <button
              className="button"
              onClick={() => {
                setError("");
                void refresh();
              }}
            >
              Try again
            </button>
          </div>
        )}
        {dashboard && (
          <>
            {tab === "overview" && (
              <>
                <div className="dashboard-stats">
                  {[
                    {
                      label: "Experiences",
                      value: entries.length,
                      Icon: BriefcaseBusiness,
                    },
                    {
                      label: "Categories",
                      value: new Set(entries.map((e) => e.category)).size,
                      Icon: LayoutDashboard,
                    },
                    { label: "Images", value: media.length, Icon: Images },
                  ].map(({ label, value, Icon }) => (
                    <article key={label}>
                      <Icon size={23} />
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </article>
                  ))}
                </div>
                <div className="overview-grid">
                  <section className="dashboard-panel">
                    <div className="panel-heading">
                      <h2>Recently updated</h2>
                      <button
                        className="text-link"
                        onClick={() => edit()}
                        disabled={busy}
                      >
                        <Plus size={16} />
                        Add experience
                      </button>
                    </div>
                    {[...entries]
                      .sort((a, b) =>
                        (b.updatedAt || b.startDate).localeCompare(
                          a.updatedAt || a.startDate,
                        ),
                      )
                      .slice(0, 4)
                      .map((e) => (
                        <button
                          className="recent-entry"
                          key={e.slug}
                          onClick={() => edit(e)}
                        >
                          <div>
                            <strong>{e.title}</strong>
                            <span>{e.organization}</span>
                          </div>
                          <Pencil size={16} />
                        </button>
                      ))}
                    {!entries.length && (
                      <p>No experiences yet. Add your first role.</p>
                    )}
                  </section>
                  <section className="dashboard-panel">
                    <h2>Portfolio services</h2>
                    <dl className="service-list">
                      <div>
                        <dt>Database</dt>
                        <dd>{dashboard.database}</dd>
                      </div>
                      <div>
                        <dt>Image storage</dt>
                        <dd>{dashboard.storage}</dd>
                      </div>
                      <div>
                        <dt>Admin account</dt>
                        <dd>{dashboard.admin.email}</dd>
                      </div>
                    </dl>
                    <p className="form-hint">
                      All content changes are published to the portfolio as soon
                      as you save.
                    </p>
                    <Link
                      className="text-link"
                      href="/experiences"
                      target="_blank"
                    >
                      View experiences <ArrowUpRight size={16} />
                    </Link>
                  </section>
                </div>
              </>
            )}
            {tab === "experiences" && (
              <>
                <div className="content-toolbar">
                  <label className="search-field">
                    Search experiences
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search titles, organizations, or categories"
                    />
                  </label>
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() => edit()}
                  >
                    <Plus size={17} />
                    Add experience
                  </button>
                </div>
                <div className="admin-grid">
                  <section aria-label="Experience list">
                    {filtered.map((item) => (
                      <article className="admin-entry" key={item.slug}>
                        <span className="tag">{item.category}</span>
                        <h3>{item.title}</h3>
                        <p>{item.organization}</p>
                        <p className="period">{item.period}</p>
                        <div className="actions">
                          <button
                            className="text-link"
                            disabled={busy}
                            onClick={() => edit(item)}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <Link
                            className="text-link"
                            target="_blank"
                            href={`/experiences/${item.slug}`}
                          >
                            View <ArrowUpRight size={14} />
                          </Link>
                          <button
                            className="text-link danger-link"
                            disabled={busy}
                            onClick={() => setDeleteEntry(item.slug)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                        {deleteEntry === item.slug && (
                          <div className="notice">
                            <p>Permanently delete this experience?</p>
                            <div className="actions">
                              <button
                                className="button danger-button"
                                disabled={busy}
                                onClick={() => removeEntry(item.slug)}
                              >
                                Delete experience
                              </button>
                              <button
                                className="text-link"
                                disabled={busy}
                                onClick={() => setDeleteEntry("")}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                    {!filtered.length && (
                      <div className="state">
                        {query
                          ? "No experiences match your search."
                          : "No experiences yet. Add your first role."}
                      </div>
                    )}
                  </section>
                  <form
                    ref={formRef}
                    className="admin-form dashboard-panel"
                    onSubmit={save}
                  >
                    <h2>{editing ? "Edit experience" : "New experience"}</h2>
                    <fieldset disabled={busy}>
                      <label>
                        URL slug
                        <input
                          value={draft.slug}
                          onChange={(e) =>
                            setDraft({ ...draft, slug: e.target.value })
                          }
                          required
                          pattern="[a-z0-9]+(-[a-z0-9]+)*"
                          maxLength={160}
                          readOnly={editing}
                        />
                        <span className="form-hint">
                          {editing
                            ? "The URL stays fixed when editing."
                            : "Use lowercase letters, numbers, and hyphens."}
                        </span>
                      </label>
                      {(
                        [
                          ["title", "Role title"],
                          ["organization", "Organization or event"],
                          ["period", "Display period"],
                        ] as [keyof Entry, string][]
                      ).map(([key, label]) => (
                        <label key={key}>
                          {label}
                          <input
                            value={draft[key] || ""}
                            onChange={(e) =>
                              setDraft({ ...draft, [key]: e.target.value })
                            }
                            required
                            maxLength={300}
                          />
                        </label>
                      ))}
                      <label>
                        Start month
                        <input
                          type="month"
                          value={draft.startDate}
                          onChange={(e) =>
                            setDraft({ ...draft, startDate: e.target.value })
                          }
                          required
                        />
                      </label>
                      <label>
                        Category
                        <select
                          value={draft.category}
                          onChange={(e) =>
                            setDraft({ ...draft, category: e.target.value })
                          }
                        >
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Description
                        <textarea
                          rows={6}
                          value={draft.description}
                          onChange={(e) =>
                            setDraft({ ...draft, description: e.target.value })
                          }
                          required
                          maxLength={10000}
                        />
                      </label>
                      <label>
                        Image URL
                        <input
                          type="url"
                          placeholder="https://…"
                          value={draft.imageUrl || ""}
                          onChange={(e) =>
                            setDraft({ ...draft, imageUrl: e.target.value })
                          }
                        />
                      </label>
                      {draft.imageUrl && (
                        <img
                          className="admin-preview"
                          src={draft.imageUrl}
                          alt="Experience image preview"
                        />
                      )}
                      <label>
                        Upload an image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            void upload(e.target.files?.[0], true);
                            e.target.value = "";
                          }}
                        />
                        <span className="form-hint">
                          JPG, PNG, or WebP, up to 4 MB.
                        </span>
                      </label>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setTab("media")}
                      >
                        Choose from the image library
                      </button>
                      <div className="actions">
                        <button className="button" disabled={busy}>
                          {busy ? "Saving…" : "Save experience"}
                        </button>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => {
                            setDraft({ ...blank });
                            setEditing(false);
                          }}
                        >
                          Clear form
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </div>
              </>
            )}
            {tab === "media" && (
              <>
                <div className="upload-panel">
                  <Upload size={28} />
                  <div>
                    <h2>Add an image</h2>
                    <p>
                      JPG, PNG, or WebP, up to 4 MB. Images are optimized before
                      upload.
                    </p>
                  </div>
                  <label
                    className={`button upload-button${busy ? " is-disabled" : ""}`}
                  >
                    {busy ? "Uploading…" : "Choose image"}
                    <input
                      className="file-overlay"
                      aria-label="Upload an image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy}
                      onChange={(e) => {
                        void upload(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="media-grid">
                  {media.map((image) => (
                    <article className="media-card" key={image.path}>
                      <img
                        src={image.url}
                        alt="Portfolio image"
                        loading="lazy"
                      />
                      <div>
                        <p title={image.name}>{image.name}</p>
                        <span>{Math.ceil(image.size / 1024)} KB</span>
                        <div className="actions">
                          <button
                            className="text-link"
                            disabled={busy}
                            onClick={() => {
                              setDraft((d) => ({ ...d, imageUrl: image.url }));
                              setTab("experiences");
                              setMessage(
                                "Image selected. Save the experience to apply it.",
                              );
                            }}
                          >
                            Use image
                          </button>
                          <a
                            className="text-link"
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open
                          </a>
                          <button
                            className="text-link danger-link"
                            disabled={busy}
                            onClick={() => setDeleteImage(image.name)}
                          >
                            Delete
                          </button>
                        </div>
                        {deleteImage === image.name && (
                          <div className="notice">
                            <p>Permanently delete this image?</p>
                            <button
                              className="button danger-button"
                              disabled={busy}
                              onClick={() => removeImage(image.name)}
                            >
                              Delete image
                            </button>
                            <button
                              className="text-link"
                              onClick={() => setDeleteImage("")}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {!media.length && (
                  <div className="state">
                    Your image library is empty. Upload your first image above.
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
