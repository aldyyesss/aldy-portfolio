import type { Metadata } from "next";
import Link from "next/link";
import { skills } from "@/lib/aldy";
export const metadata: Metadata = { title: "About" };
export default function About() {
  return (
    <div className="shell page-content">
      <div className="page-heading">
        <p className="eyebrow">About me</p>
        <h1>
          Learning to understand.
          <br />
          Growing together.
        </h1>
        <p>The person behind the roles and experiences.</p>
      </div>
      <section className="split-section">
        <h2>
          Hi, I’m Aldy
          <br />
          Radya Herlambang.
        </h2>
        <div className="prose">
          <p>
            I’m an undergraduate student in Fisheries and Marine Technology and
            Business at Diponegoro University. I take part in student
            organizations, student development activities, and community
            service.
          </p>
          <p>
            These experiences have helped me develop leadership, communication,
            collaboration, and event management skills. They have also taught me
            to understand the different perspectives, circumstances, and needs
            of individuals and communities.
          </p>
          <p>
            I want to keep learning while sharing experiences and perspectives
            that can support other students as they grow.
          </p>
        </div>
      </section>
      <section className="split-section">
        <h2>Education</h2>
        <div>
          <article className="timeline-item">
            <span className="period">2024 — present</span>
            <h3>Diponegoro University</h3>
            <p>
              Bachelor’s program in Fisheries and Marine Technology and Business
            </p>
          </article>
          <article className="timeline-item">
            <span className="period">2021 — 2024</span>
            <h3>SMA Negeri 3 Yogyakarta</h3>
            <p>Natural Sciences</p>
          </article>
        </div>
      </section>
      <section className="split-section">
        <h2>
          What I bring
          <br />
          to every role.
        </h2>
        <ul className="skill-list">
          {skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <Link className="button" href="/experiences">
        Explore my experience
      </Link>
    </div>
  );
}
