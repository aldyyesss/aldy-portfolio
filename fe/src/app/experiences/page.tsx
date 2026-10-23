import type { Metadata } from "next";
import Experiences from "../ui/Experiences";
export const metadata: Metadata = { title: "Experience" };
export default function Page() {
  return (
    <div className="shell page-content">
      <div className="page-heading">
        <p className="eyebrow">My journey & involvement</p>
        <h1>
          Learning through roles.
          <br />
          Growing through action.
        </h1>
        <p>
          Student organizations, event committees, and community service that
          have shaped my journey.
        </p>
      </div>
      <Experiences />
    </div>
  );
}
