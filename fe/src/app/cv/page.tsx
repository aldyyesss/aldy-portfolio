import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { profile, skills } from "@/lib/aldy";
export const metadata: Metadata = { title: "CV" };
export default function Page() {
  return (
    <div className="shell page-content">
      <div className="page-heading">
        <p className="eyebrow">Curriculum vitae</p>
        <h1>
          My journey,
          <br />
          in one document.
        </h1>
        <p>
          A summary of my background, education, and involvement, based on my
          September 2026 CV.
        </p>
        <a className="button" href="/api/aldy/cv">
          Download original CV <Download size={18} />
        </a>
        <p className="download-note">
          The original PDF is in Indonesian.{" "}
          <a href="/cv-aldy.pdf" download>
            Download the local copy
          </a>{" "}
          if the main download is unavailable.
        </p>
      </div>
      <article className="cv-sheet">
        <div className="cv-header">
          <h2>{profile.name}</h2>
          <p>Undergraduate in {profile.program}</p>
          <p>{profile.university}</p>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </div>
        <div className="split-section">
          <h3>Profile</h3>
          <p>
            An undergraduate involved in student organizations, student
            development, and community service. Continuing to develop
            communication, leadership, collaboration, and event management
            skills.
          </p>
        </div>
        <div className="split-section">
          <h3>Education</h3>
          <div>
            <p>
              <strong>Diponegoro University</strong>
              <br />
              Fisheries and Marine Technology and Business
              <br />
              2024 – present
            </p>
            <p>
              <strong>SMA Negeri 3 Yogyakarta</strong>
              <br />
              Natural Sciences
              <br />
              2021 – 2024
            </p>
          </div>
        </div>
        <div className="split-section">
          <h3>Organizations</h3>
          <div>
            <p>
              <strong>External Affairs Coordinator</strong>
              <br />
              HIMATEKBIS UNDIP · HUMAS & SOSMAS
              <br />
              2025 – present
            </p>
            <p>
              <strong>Head of Development Department</strong>
              <br />
              HIMATEKBIS UNDIP · KPSDM & RISKEL
              <br />
              2024 – 2025
            </p>
          </div>
        </div>
        <div className="split-section">
          <h3>Skills</h3>
          <ul className="skill-list">
            {skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <p>
          Explore event committees and other roles on the{" "}
          <Link href="/experiences">experience page</Link> or in the original
          PDF.
        </p>
      </article>
    </div>
  );
}
