import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../services/http";

export default function StaticPage({ title, slug }) {
  const [adminEmail, setAdminEmail] = useState("support@knotofflove.in");

  // Fetch admin contact email only for the contact page
  useEffect(() => {
    if (slug !== "contact") return;
    fetch(`${API_BASE_URL}/api/admin/contact-email`)
      .then(r => r.json())
      .then(d => { if (d?.email) setAdminEmail(d.email); })
      .catch(() => {}); // silent — fallback email stays
  }, [slug]);

  const content = {
    privacy: {
      heading: "Privacy Policy",
      effective: "Effective: 1 January 2026",
      body: [
        {
          title: "Information We Collect",
          text: "We collect information you provide during registration (name, email, phone, date of birth) and through profile completion (location, religion, profession etc.). We also collect usage data to improve the platform."
        },
        {
          title: "How We Use Your Information",
          text: "Your information is used to match you with compatible profiles, personalise your experience, send transactional emails (OTP, account updates), and ensure platform safety. We never sell your personal data to third parties."
        },
        {
          title: "Data Security",
          text: "All passwords are hashed with bcrypt. JWTs are short-lived and signed with HS256. Sensitive documents are stored server-side and accessible only through authenticated, authorised requests."
        },
        {
          title: "Your Rights",
          text: "You can request a copy of your data, correct inaccurate information, or permanently delete your account at any time from your dashboard settings."
        },
        {
          title: "Contact",
          text: `For privacy concerns, email us at privacy@knotofflove.in`
        }
      ]
    },
    terms: {
      heading: "Terms of Use",
      effective: "Effective: 1 January 2026",
      body: [
        {
          title: "Eligibility",
          text: "You must be at least 18 years of age and legally eligible to marry under applicable law to use this platform. By registering, you confirm these facts are true."
        },
        {
          title: "Acceptable Use",
          text: "You agree to provide accurate information, treat other members with respect, and not use the platform for fraudulent, abusive, or commercial solicitation purposes."
        },
        {
          title: "Account Responsibility",
          text: "You are responsible for maintaining the confidentiality of your login credentials. Notify us immediately if you suspect unauthorised access to your account."
        },
        {
          title: "Termination",
          text: "We reserve the right to suspend or permanently terminate accounts that violate these terms, engage in fraudulent activity, or harm other users."
        },
        {
          title: "Limitation of Liability",
          text: "Knot of Love facilitates introductions but is not responsible for the outcomes of meetings or relationships arising from the platform. Use your own judgement and prioritise personal safety."
        }
      ]
    },
    contact: {
      heading: "Contact Us",
      effective: null,
      body: [
        {
          title: "General Support",
          text: `For account questions, technical issues, or general feedback, email us at ${adminEmail}. We typically respond within 24 hours on business days.`
        },
        {
          title: "KYC & Verification",
          text: "For questions about your KYC status or document verification, email verify@knotofflove.in with your registered email and member ID."
        },
        {
          title: "Report Abuse",
          text: "If you encounter suspicious behaviour or an abusive profile, email abuse@knotofflove.in. All reports are treated confidentially."
        },
        {
          title: "Business Enquiries",
          text: "For partnerships or press, contact hello@knotofflove.in"
        }
      ]
    }
  };

  const page = content[slug];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm font-bold text-muted hover:text-brand-700">
        ← Back to home
      </Link>

      <section className="surface-card mt-6 p-8">
        <p className="hero-badge">Knot of Love</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-ink">{page?.heading || title}</h1>
        {page?.effective && (
          <p className="mt-3 text-sm text-muted">{page.effective}</p>
        )}

        <div className="mt-8 space-y-8 border-t border-ink/10 pt-8">
          {page?.body.map((section, i) => (
            <div key={i}>
              <h2 className="font-serif text-2xl text-ink">{section.title}</h2>
              <p className="mt-3 text-base leading-8 text-muted">{section.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-ink/10 pt-6">
          <Link to="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
