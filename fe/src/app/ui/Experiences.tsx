"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Entry, getEntries } from "@/lib/aldy";
export default function Experiences({ slug }: { slug?: string }) {
  const [entries, setEntries] = useState<Entry[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [category, setCategory] = useState("All");
  async function load() {
    setLoading(true);
    setError("");
    try {
      setEntries((await getEntries()).entries);
    } catch {
      setError("Experience could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (loading)
    return (
      <div className="state" role="status">
        Loading experience…
      </div>
    );
  if (error)
    return (
      <div className="state" role="alert">
        <p>{error}</p>
        <button className="button" onClick={load}>
          Try again
        </button>
      </div>
    );
  if (slug) {
    const item = entries.find((e) => e.slug === slug);
    return (
      <>
        <Link className="text-link" href="/experiences">
          <ArrowLeft size={17} /> All experiences
        </Link>
        {item ? (
          <article className="detail">
            <p className="eyebrow">{item.category}</p>
            <h1>{item.title}</h1>
            <p className="detail-organization">{item.organization}</p>
            <p className="period">{item.period}</p>
            {item.imageUrl && (
              <img
                className="detail-image"
                src={item.imageUrl}
                alt={item.title}
              />
            )}
            <div className="prose">
              <h2>About this role</h2>
              <p>{item.description}</p>
            </div>
            <Link className="button" href="/contact">
              Get in touch
            </Link>
          </article>
        ) : (
          <div className="state">
            <h1>Experience not found.</h1>
            <p>Choose another role from the experience list.</p>
          </div>
        )}
      </>
    );
  }
  const filtered = entries.filter(
    (e) => category === "All" || e.category === category,
  );
  return (
    <>
      <div className="filters" aria-label="Experience categories">
        {["All", ...Array.from(new Set(entries.map((e) => e.category)))].map(
          (c) => (
            <button
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              key={c}
            >
              {c}
            </button>
          ),
        )}
      </div>
      <div className="experience-list">
        {filtered.length ? (
          filtered.map((e) => (
            <Link
              className="experience-row"
              key={e.slug}
              href={`/experiences/${e.slug}`}
            >
              <div className="experience-meta">
                <span className="period">{e.period}</span>
                <span className="tag">{e.category}</span>
              </div>
              <div>
                <h2>{e.title}</h2>
                <p>{e.organization}</p>
                <p className="experience-description">{e.description}</p>
              </div>
              <ArrowUpRight className="row-arrow" size={23} />
            </Link>
          ))
        ) : (
          <div className="state">
            There are no experiences in this category yet.
          </div>
        )}
      </div>
    </>
  );
}
