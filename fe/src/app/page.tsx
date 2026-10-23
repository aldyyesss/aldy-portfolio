import Link from "next/link";
import { ArrowUpRight, ArrowDown, Waves, Users, Compass } from "lucide-react";
export default function Home() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <p className="intro">
            <span className="dot" />
            Hi, I’m Aldy.
          </p>
          <h1>
            Learning through
            <br />
            experience.
            <br />
            <span>Moving together.</span>
          </h1>
          <p className="hero-description">
            An undergraduate in Fisheries and Marine Technology and Business at
            Diponegoro University. Finding opportunities to learn, lead, and
            contribute to the people around me.
          </p>
          <div className="actions">
            <Link className="button" href="/experiences">
              Explore my experience <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" href="/about">
              Get to know me
            </Link>
          </div>
          <div className="hero-note">
            <span>Diponegoro University</span>
            <span>2024 — present</span>
          </div>
        </div>
        <div
          className="ocean-art"
          role="img"
          aria-label="Blue ocean waves representing a journey of growth"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-sun" />
          <span className="art-word">
            Keep
            <br />
            growing.
          </span>
          <svg
            className="waves"
            viewBox="0 0 500 500"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 200 Q120 110 250 220 T500 185 V500 H0Z"
              fill="#83c5d9"
            />
            <path
              d="M0 260 Q140 170 280 280 T500 240 V500 H0Z"
              fill="#318cae"
            />
            <path
              d="M0 335 Q120 230 270 340 T500 300 V500 H0Z"
              fill="#07658a"
            />
            <path
              d="M0 395 Q150 305 290 400 T500 370 V500 H0Z"
              fill="#123e58"
            />
          </svg>
          <div className="art-caption">
            <span>Learn. Collaborate. Contribute.</span>
            <Waves size={28} />
          </div>
        </div>
      </section>
      <section className="blue-band">
        <div className="shell band-inner">
          <p>
            Starting with curiosity.
            <br />
            <strong>Growing through involvement.</strong>
          </p>
          <span>
            Student organizations, personal development,
            <br />
            and community service.
          </span>
          <ArrowDown size={28} />
        </div>
      </section>
      <section className="shell section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Where I contribute</p>
            <h2>
              People, purpose,
              <br />
              and experience.
            </h2>
          </div>
          <p>
            Every role is an opportunity to understand others, take
            responsibility, and learn something new.
          </p>
        </div>
        <div className="focus-grid">
          {[
            {
              Icon: Users,
              title: "Leadership & organizations",
              text: "Growing with HIMATEKBIS through student development and external affairs.",
            },
            {
              Icon: Compass,
              title: "Student development",
              text: "Contributing to new student programs, management training, and department orientation.",
            },
            {
              Icon: Waves,
              title: "Community service",
              text: "Taking part in Lintas Kasih, Lele Preneur, Marine Protection, and Serasi.",
            },
          ].map(({ Icon, title, text }) => (
            <article className="focus-item" key={title}>
              <Icon size={30} strokeWidth={1.4} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <Link className="text-link" href="/experiences">
          Explore the full journey <ArrowUpRight size={17} />
        </Link>
      </section>
      <section className="shell closing">
        <p>There’s always something good we can start together.</p>
        <Link href="/contact">
          Let’s start a conversation <ArrowUpRight />
        </Link>
      </section>
    </>
  );
}
