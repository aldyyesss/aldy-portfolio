import Link from "next/link";
export default function NotFound() {
  return (
    <div className="shell page-content">
      <h1>Page not found.</h1>
      <p>Let’s continue from the home page.</p>
      <Link className="button" href="/">
        Back to home
      </Link>
    </div>
  );
}
