import type { Metadata } from "next";
import { ArrowUpRight, Mail, MessageCircle, MapPin } from "lucide-react";
import { profile } from "@/lib/aldy";
export const metadata: Metadata = { title: "Contact" };
export default function Page() {
  return (
    <div className="shell page-content contact-page">
      <div className="page-heading">
        <p className="eyebrow">Get in touch</p>
        <h1>
          A good conversation
          <br />
          starts with hello.
        </h1>
        <p>
          Let’s exchange stories, discuss student activities, or explore an
          opportunity to collaborate.
        </p>
      </div>
      <div className="contact-list">
        <a href={`mailto:${profile.email}`}>
          <Mail />
          <div>
            <span>Email</span>
            <strong>{profile.email}</strong>
          </div>
          <ArrowUpRight />
        </a>
        <a href={profile.whatsapp} target="_blank" rel="noopener noreferrer">
          <MessageCircle />
          <div>
            <span>WhatsApp</span>
            <strong>{profile.phone}</strong>
          </div>
          <ArrowUpRight />
        </a>
        <div className="contact-location">
          <MapPin />
          <div>
            <span>Based in</span>
            <strong>{profile.location}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
