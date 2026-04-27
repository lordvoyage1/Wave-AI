import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, Scale, Lock, Eye, FileText, Cookie,
  HeadphonesIcon, AlertTriangle, RefreshCw,
  Mail, MessageCircle, Globe, Youtube, Shield,
  Menu, X, ChevronRight, Zap, Users, Building2,
  Ban, Clock, Database, Wifi, Award, HelpCircle,
  Smartphone, Star, Heart, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Section component ─────────────────────────────────────────────── */
function Section({
  id,
  icon: Icon,
  iconColor,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2.5">
        <span
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}
          style={{ background: "rgba(79,127,255,0.06)" }}
        >
          <Icon size={16} />
        </span>
        {title}
      </h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      <span>{children}</span>
    </li>
  );
}

function Sub({ title }: { title: string }) {
  return <p className="font-medium text-slate-700 mt-4 first:mt-0">{title}</p>;
}

/* ── Navigation sections ───────────────────────────────────────────── */
const NAV_SECTIONS = [
  { id: "tos",          icon: Scale,          label: "Terms of Service",       color: "text-primary" },
  { id: "privacy",      icon: Lock,           label: "Privacy Policy",         color: "text-violet-500" },
  { id: "cookies",      icon: Cookie,         label: "Cookie Policy",          color: "text-amber-500" },
  { id: "use",          icon: FileText,       label: "Acceptable Use",         color: "text-emerald-500" },
  { id: "data",         icon: Database,       label: "Data & Storage",         color: "text-cyan-500" },
  { id: "accounts",     icon: Users,          label: "Accounts & Access",      color: "text-blue-500" },
  { id: "ip",           icon: Award,          label: "Intellectual Property",  color: "text-indigo-500" },
  { id: "availability", icon: Wifi,           label: "Service Availability",   color: "text-teal-500" },
  { id: "payments",     icon: Star,           label: "Payments & Plans",       color: "text-yellow-500" },
  { id: "minors",       icon: Shield,         label: "Children & Minors",      color: "text-rose-400" },
  { id: "thirdparty",   icon: Globe,          label: "Third-Party Links",      color: "text-slate-500" },
  { id: "mobile",       icon: Smartphone,     label: "Mobile & PWA",           color: "text-orange-500" },
  { id: "changes",      icon: Settings,       label: "Policy Changes",         color: "text-slate-400" },
  { id: "disclaimer",   icon: AlertTriangle,  label: "Disclaimer",             color: "text-red-500" },
  { id: "community",    icon: Heart,          label: "Community Guidelines",   color: "text-pink-500" },
  { id: "termination",  icon: Ban,            label: "Termination",            color: "text-red-400" },
  { id: "accessibility",icon: Zap,            label: "Accessibility",          color: "text-amber-400" },
  { id: "contact",      icon: HeadphonesIcon, label: "Contact & Support",      color: "text-blue-400" },
  { id: "faq",          icon: HelpCircle,     label: "FAQ",                    color: "text-emerald-400" },
  { id: "transparency", icon: Eye,            label: "Transparency",           color: "text-cyan-400" },
  { id: "company",      icon: Building2,      label: "About the Company",      color: "text-violet-400" },
  { id: "updates",      icon: RefreshCw,      label: "Version History",        color: "text-slate-400" },
];

/* ── Sidebar ───────────────────────────────────────────────────────── */
function Sidebar({
  activeSection,
  open,
  onClose,
}: {
  activeSection: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 w-[260px] bg-white border-r border-slate-100 shadow-xl flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 lg:sticky lg:top-[60px] lg:h-[calc(100vh-60px)] lg:shadow-none lg:border-0 lg:bg-transparent lg:w-56",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <img src="/orb.png" alt="Wave AI" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Sections</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Contents</p>
          {NAV_SECTIONS.map(({ id, icon: Icon, label, color }) => {
            const active = activeSection === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all mb-0.5 group",
                  active
                    ? "bg-primary/8 text-primary font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
                style={{ touchAction: "manipulation" }}
              >
                <Icon size={13} className={active ? "text-primary" : color} />
                <span className="flex-1 leading-tight">{label}</span>
                {active && <ChevronRight size={10} className="text-primary opacity-60" />}
              </a>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-slate-100">
          <Link
            to="/app"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-white wave-gradient hover:opacity-90 transition-all"
            style={{ touchAction: "manipulation" }}
          >
            Open Wave AI
          </Link>
        </div>
      </aside>
    </>
  );
}

/* ── Main component ────────────────────────────────────────────────── */
export default function Terms() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tos");
  const contentRef = useRef<HTMLDivElement>(null);
  const lastUpdated = "April 27, 2026";

  // Observe which section is in view for sidebar highlight
  useEffect(() => {
    const sectionIds = NAV_SECTIONS.map(s => s.id);
    const observers: IntersectionObserver[] = [];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* ── Sticky top bar ─────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">
          {/* Hamburger — always visible */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
            style={{ touchAction: "manipulation" }}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
            style={{ touchAction: "manipulation" }}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
              <img src="/orb.png" alt="Wave AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800 leading-tight">Legal & Support</h1>
              <p className="text-[11px] text-slate-400 leading-tight">Wave AI · Wave Platforms, Inc.</p>
            </div>
          </div>
          <span className="ml-auto text-[11px] text-slate-400 hidden sm:block">Updated {lastUpdated}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-0 lg:gap-8 px-0 lg:px-4 py-0 lg:py-8 relative">

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <Sidebar
          activeSection={activeSection}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* ── Main content ─────────────────────────────────────── */}
        <main ref={contentRef} className="flex-1 min-w-0 px-4 pb-16 space-y-5 lg:px-0">

          {/* Hero banner */}
          <div
            className="rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden mt-4 lg:mt-0"
            style={{ background: "linear-gradient(135deg, #4f7fff 0%, #9b5cff 55%, #f472b6 100%)" }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)",
              }}
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2 opacity-80">Wave Platforms, Inc.</p>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">Legal, Privacy & Support</h2>
              <p className="text-sm opacity-85 leading-relaxed max-w-lg">
                Complete documentation on how Wave AI works, how your data is handled, your rights, and how to reach us. Use the sidebar to navigate any section.
              </p>
              <p className="text-[11px] opacity-60 mt-4">Effective date: {lastUpdated} · Applies to all Wave AI products and services.</p>
            </div>
          </div>

          {/* ═══ TERMS OF SERVICE ══════════════════════════════════════ */}
          <Section id="tos" icon={Scale} iconColor="text-primary" title="Terms of Service">
            <p>
              These Terms of Service ("Terms") govern your access to and use of Wave AI, operated by Wave Platforms, Inc. ("Company", "we", "us", or "our"). By accessing or using Wave AI, you confirm that you have read, understood, and agree to be bound by these Terms and all applicable laws.
            </p>

            <Sub title="1. Acceptance of Terms" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>By using Wave AI, you represent that you are at least 13 years of age and have the legal capacity to enter into these Terms.</Li>
              <Li>If you use Wave AI on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</Li>
              <Li>Continued use of Wave AI after any updates to these Terms constitutes acceptance of the updated version.</Li>
            </ul>

            <Sub title="2. Description of Service" />
            <p>
              Wave AI is an AI-powered conversational platform providing intelligent text responses, code generation, voice synthesis, image creation, video generation, and visual analysis capabilities. The service is provided as-is via web browsers and as a Progressive Web App (PWA) installable on all major platforms.
            </p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Chat and reasoning — unlimited conversation with full context memory.</Li>
              <Li>Code generation — write, debug, explain, and refactor code in any language.</Li>
              <Li>Image generation — create visual content from text descriptions.</Li>
              <Li>Video generation — generate short video clips from scene prompts.</Li>
              <Li>Voice synthesis — convert text to natural speech in multiple voices.</Li>
              <Li>Vision analysis — analyze and describe image content.</Li>
              <Li>File analysis — examine code, documents, archives, and CSV data.</Li>
              <Li>Voice calls — spoken real-time conversations using your microphone.</Li>
            </ul>

            <Sub title="3. Account Eligibility & Registration" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>You must be at least 13 years old. Users between 13 and 18 require parental or guardian consent.</Li>
              <Li>You agree to provide accurate, complete, and current information during account creation.</Li>
              <Li>You are solely responsible for maintaining the confidentiality of your login credentials.</Li>
              <Li>You must notify us immediately of any unauthorized use of your account.</Li>
              <Li>One person may not maintain more than one active free account.</Li>
            </ul>

            <Sub title="4. Guest Access" />
            <p>
              Wave AI allows limited access without an account ("Guest Mode"). Guests may use chat functionality but cannot access image generation, video creation, or file download features. Guest conversation history is stored only on the local device and is not backed up.
            </p>

            <Sub title="5. User Responsibilities" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>You are responsible for all activity that occurs under your account or device.</Li>
              <Li>You must use Wave AI only for lawful purposes and in compliance with these Terms.</Li>
              <Li>You may not share your account credentials with any other person.</Li>
              <Li>You may not use automated scripts or bots to access Wave AI unless explicitly permitted.</Li>
              <Li>You agree to report any security vulnerabilities responsibly to our team before disclosing them publicly.</Li>
            </ul>

            <Sub title="6. Modifications to the Service" />
            <p>
              Wave Platforms, Inc. reserves the right to modify, suspend, or discontinue any part of Wave AI at any time, with or without notice. We will make reasonable efforts to notify users of material changes through in-app notifications or announcements on our official channels. We are not liable to you or any third party for any modification or discontinuation of the service.
            </p>

            <Sub title="7. Governing Law & Dispute Resolution" />
            <p>
              These Terms are governed by applicable international law. Any disputes arising from these Terms or your use of Wave AI shall be resolved through good-faith negotiation in the first instance. If not resolved, disputes shall be submitted to binding arbitration. Nothing in this clause prevents either party from seeking emergency injunctive relief in a court of competent jurisdiction.
            </p>

            <Sub title="8. Entire Agreement" />
            <p>
              These Terms, together with our Privacy Policy, Cookie Policy, and Acceptable Use Policy, constitute the entire agreement between you and Wave Platforms, Inc. concerning your use of Wave AI and supersede all prior agreements, representations, or understandings.
            </p>
          </Section>

          {/* ═══ PRIVACY POLICY ════════════════════════════════════════ */}
          <Section id="privacy" icon={Lock} iconColor="text-violet-500" title="Privacy Policy">
            <p>
              This Privacy Policy describes how Wave Platforms, Inc. collects, uses, stores, and protects your personal information when you use Wave AI. We are committed to transparency and protecting your privacy. This policy applies to all users of Wave AI, regardless of how you access it.
            </p>

            <Sub title="Information We Collect" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li><strong>Account data:</strong> Your email address, username, and a securely hashed password upon registration.</Li>
              <Li><strong>Usage data:</strong> Features accessed, session duration, tab preferences, device type, browser version, and OS — collected in aggregate, anonymized form.</Li>
              <Li><strong>Conversation data:</strong> Text prompts you submit to generate responses. These are processed to provide the service and are not permanently stored on our servers beyond your active session unless you sync to the cloud.</Li>
              <Li><strong>Uploaded files:</strong> Files you attach are processed in memory during your session and are not retained on our servers after the response is generated.</Li>
              <Li><strong>Device data:</strong> IP address (for rate limiting and security), browser version, and device identifiers used for security and fraud prevention.</Li>
              <Li><strong>Local storage data:</strong> Chat history, preferences, and session tokens stored on your device only — not synced to our servers unless explicitly enabled.</Li>
            </ul>

            <Sub title="How We Use Your Data" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>To authenticate your identity and maintain your session securely.</Li>
              <Li>To deliver AI-powered responses to your prompts.</Li>
              <Li>To improve the quality and reliability of Wave AI through anonymized usage analytics.</Li>
              <Li>To send essential service communications (security alerts, account actions, policy updates).</Li>
              <Li>To detect and prevent fraud, abuse, and unauthorized access.</Li>
              <Li>We do <strong>not</strong> sell, rent, or trade your personal data to any third party.</Li>
              <Li>We do <strong>not</strong> use your conversations to train AI models — ever.</Li>
              <Li>We do <strong>not</strong> send marketing emails without your explicit consent.</Li>
            </ul>

            <Sub title="Legal Basis for Processing (GDPR)" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li><strong>Contract performance:</strong> Processing necessary to provide you the services you signed up for.</Li>
              <Li><strong>Legitimate interests:</strong> Security monitoring, fraud prevention, and service improvement using anonymized data.</Li>
              <Li><strong>Consent:</strong> For any optional processing, such as marketing communications, where you have explicitly opted in.</Li>
              <Li><strong>Legal obligation:</strong> Where we are required to process data to comply with applicable law.</Li>
            </ul>

            <Sub title="Data Retention" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Account data is retained for as long as your account is active, plus up to 30 days after deletion to allow for recovery.</Li>
              <Li>Anonymized usage analytics are retained for up to 24 months for trend analysis.</Li>
              <Li>Local chat history on your device is retained until you clear it manually.</Li>
              <Li>Security logs (IP-based) are retained for up to 90 days.</Li>
            </ul>

            <Sub title="Your Rights" />
            <p>You have the following rights regarding your personal data, which you can exercise by contacting us:</p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li><strong>Right of access:</strong> Request a copy of your personal data that we hold.</Li>
              <Li><strong>Right of rectification:</strong> Request correction of inaccurate personal data.</Li>
              <Li><strong>Right of erasure:</strong> Request deletion of your personal data ("right to be forgotten").</Li>
              <Li><strong>Right to data portability:</strong> Request your data in a structured, machine-readable format.</Li>
              <Li><strong>Right to object:</strong> Object to the processing of your data for direct marketing or based on legitimate interests.</Li>
              <Li><strong>Right to restrict processing:</strong> Request that we limit how we process your data in certain circumstances.</Li>
              <Li><strong>Right to withdraw consent:</strong> Where processing is based on consent, you may withdraw it at any time.</Li>
            </ul>

            <Sub title="International Data Transfers" />
            <p>
              Wave AI is accessible globally. If you access Wave AI from outside the country where our servers are located, your data may be transferred internationally. We ensure appropriate safeguards are in place for all such transfers, consistent with applicable data protection laws.
            </p>
          </Section>

          {/* ═══ COOKIE POLICY ══════════════════════════════════════════ */}
          <Section id="cookies" icon={Cookie} iconColor="text-amber-500" title="Cookie Policy">
            <p>
              Wave AI uses a minimal, privacy-first approach to browser storage. We do not use advertising cookies, tracking pixels, or cross-site tracking of any kind. Below is a transparent breakdown of everything stored on your device.
            </p>

            <Sub title="Authentication Tokens" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>A signed authentication session token is stored in localStorage under the key <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono">alva_session</code> when you sign in.</Li>
              <Li>This token is cryptographically signed by our auth system and verified on the server for each privileged request.</Li>
              <Li>Tokens have a limited expiry and are automatically refreshed during active sessions.</Li>
              <Li>Signing out immediately invalidates and removes the token from both local storage and the server.</Li>
            </ul>

            <Sub title="Chat History" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Your conversation history is stored locally under <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono">wave_chats_v1</code> in your browser's localStorage.</Li>
              <Li>This data never leaves your device unless you explicitly choose cloud sync.</Li>
              <Li>Up to 120 messages per conversation are retained locally for context.</Li>
              <Li>You can clear your chat history at any time in your browser settings or by signing out.</Li>
            </ul>

            <Sub title="User Preferences" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Selected voice, image generation style, and app preferences are stored locally.</Li>
              <Li>Whether you have completed the onboarding tour is stored under <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono">wave_onboarded</code>.</Li>
              <Li>These preferences enhance your experience and are never transmitted to our servers.</Li>
            </ul>

            <Sub title="What We Do Not Use" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>We do not use advertising cookies or retargeting pixels.</Li>
              <Li>We do not use third-party analytics that track you across websites.</Li>
              <Li>We do not use fingerprinting, supercookies, or any other persistent tracking technology.</Li>
              <Li>We do not share your browsing behavior with any advertising networks.</Li>
            </ul>

            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              To clear all Wave AI locally stored data: open your browser's Developer Tools → Application tab → Local Storage → select the Wave AI origin → delete all entries. This will sign you out and clear your local chat history.
            </p>
          </Section>

          {/* ═══ ACCEPTABLE USE ═════════════════════════════════════════ */}
          <Section id="use" icon={FileText} iconColor="text-emerald-500" title="Acceptable Use Policy">
            <p>
              Wave AI is designed to be a helpful, creative, and productive platform available to everyone. To preserve a safe and fair environment, the following activities are strictly prohibited. Violations may result in immediate account suspension or termination, and where applicable, reporting to law enforcement.
            </p>

            <Sub title="Prohibited Content" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Generating, uploading, or distributing content that promotes violence, threats, or harm to any person or group.</Li>
              <Li>Creating content that constitutes hate speech, discrimination, or harassment based on race, ethnicity, religion, gender, sexual orientation, disability, or any other characteristic.</Li>
              <Li>Generating sexual content of any kind involving minors. This is a zero-tolerance policy and will be immediately reported to authorities.</Li>
              <Li>Creating or distributing illegal content of any kind under applicable local, national, or international law.</Li>
              <Li>Generating content that infringes upon the intellectual property rights of any third party.</Li>
              <Li>Producing spam, phishing content, or deceptive material intended to mislead or defraud others.</Li>
            </ul>

            <Sub title="Prohibited Activities" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Attempting to bypass, reverse-engineer, manipulate, or exploit the AI systems or platform infrastructure.</Li>
              <Li>Using Wave AI to conduct cyberattacks, generate malware, or develop tools to exploit vulnerabilities in any system.</Li>
              <Li>Reselling, sublicensing, or commercially redistributing Wave AI's outputs or services without written permission.</Li>
              <Li>Impersonating Wave Platforms, Inc., its employees, or any other person or entity.</Li>
              <Li>Using automated scripts, bots, or crawlers to scrape, extract, or overload the service.</Li>
              <Li>Attempting to access another user's account, data, or private information.</Li>
              <Li>Using Wave AI to spread disinformation or deliberately mislead the public on matters of public health, elections, or safety.</Li>
            </ul>

            <Sub title="Responsible AI Use" />
            <p>
              We encourage responsible, thoughtful use of AI. This means verifying AI-generated information from authoritative sources before acting on it for consequential decisions, attributing AI-generated content appropriately where required, and using AI to augment rather than replace human judgment in critical domains.
            </p>
          </Section>

          {/* ═══ DATA & STORAGE ══════════════════════════════════════════ */}
          <Section id="data" icon={Database} iconColor="text-cyan-500" title="Data & Storage">
            <p>
              Wave AI is designed with a "local-first" data philosophy — your conversations live on your device, not on our servers, unless you choose otherwise.
            </p>

            <Sub title="Local Storage Architecture" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Chat history is stored in your browser's localStorage, meaning it is private to your device and browser profile.</Li>
              <Li>If you clear your browser data, use a different browser, or access Wave AI from another device without cloud sync, your history will not transfer.</Li>
              <Li>Wave AI limits local storage usage to prevent excessive browser data consumption — older messages are pruned beyond 120 per conversation.</Li>
            </ul>

            <Sub title="Cloud Sync (Authenticated Users)" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Signed-in users may sync conversations to our secure cloud database, enabling cross-device access.</Li>
              <Li>Synced data is encrypted at rest and in transit using industry-standard protocols.</Li>
              <Li>Cloud-synced conversations are protected by Row Level Security — only you can access your own data.</Li>
              <Li>You can delete your cloud data at any time from your account settings.</Li>
            </ul>

            <Sub title="File Uploads" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Files you upload (images, documents, code files, archives) are processed in memory during your session.</Li>
              <Li>Files are not permanently stored on our servers after the AI has responded.</Li>
              <Li>Do not upload files containing sensitive personal, financial, or confidential business information that you do not want processed by AI systems.</Li>
              <Li>Maximum file size recommendations: images up to 5MB, text files up to 3MB, ZIP archives up to 10MB.</Li>
            </ul>

            <Sub title="Backups & Recovery" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Local-only history cannot be recovered if lost — we recommend periodically copying important conversations.</Li>
              <Li>Cloud-synced data is backed up regularly as part of our infrastructure maintenance.</Li>
              <Li>We are not responsible for data loss resulting from browser storage being cleared, device failure, or user action.</Li>
            </ul>
          </Section>

          {/* ═══ ACCOUNTS & ACCESS ═══════════════════════════════════════ */}
          <Section id="accounts" icon={Users} iconColor="text-blue-500" title="Accounts & Access">
            <Sub title="Account Creation" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Accounts are created using a valid email address and a password of at least 6 characters.</Li>
              <Li>Email addresses are verified as part of the registration process to prevent fraudulent accounts.</Li>
              <Li>You may create only one account per email address.</Li>
              <Li>Wave Platforms, Inc. reserves the right to reject account registrations that appear to be fraudulent or abusive.</Li>
            </ul>

            <Sub title="Account Security" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Passwords are stored using secure one-way hashing — we can never see your actual password.</Li>
              <Li>Use a strong, unique password. We recommend at least 12 characters with a mix of letters, numbers, and symbols.</Li>
              <Li>Never share your password with anyone, including Wave AI support staff (we will never ask for it).</Li>
              <Li>Suspicious activity on your account should be reported immediately so we can take protective action.</Li>
            </ul>

            <Sub title="Account Suspension & Termination" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Accounts may be suspended or terminated for violations of these Terms, particularly the Acceptable Use Policy.</Li>
              <Li>We will generally provide notice before suspension unless the violation is severe (e.g., illegal content).</Li>
              <Li>Terminated accounts cannot be reactivated. You may create a new account with a different email if you believe termination was in error — please contact us.</Li>
            </ul>

            <Sub title="Account Deletion" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>You may request account deletion at any time by contacting our support team.</Li>
              <Li>Upon deletion, your account data will be removed within 30 days, subject to any legal retention requirements.</Li>
              <Li>Local chat history stored on your device will not be deleted automatically — clear it manually through your browser settings.</Li>
            </ul>
          </Section>

          {/* ═══ INTELLECTUAL PROPERTY ══════════════════════════════════ */}
          <Section id="ip" icon={Award} iconColor="text-indigo-500" title="Intellectual Property">
            <Sub title="Our IP" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Wave AI, the Wave AI logo, the orb visual identity, Wave Platforms, Inc., and all associated branding, code, and interfaces are owned by or licensed to Wave Platforms, Inc.</Li>
              <Li>You may not copy, reproduce, modify, distribute, or create derivative works from Wave AI's interface, branding, or proprietary code without written permission.</Li>
              <Li>The Wave AI name and branding may not be used in any way that implies endorsement or affiliation without explicit written authorization from Wave Platforms, Inc.</Li>
            </ul>

            <Sub title="Your Content" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Content you generate using Wave AI (AI responses, images, videos, code) is yours to use, subject to these Terms and applicable law.</Li>
              <Li>You grant Wave Platforms, Inc. a limited, non-exclusive license to process the content you submit solely for the purpose of delivering the service.</Li>
              <Li>We do not claim ownership of any creative output you generate using Wave AI.</Li>
              <Li>You are responsible for ensuring that any content you submit does not infringe third-party intellectual property rights.</Li>
            </ul>

            <Sub title="Open Source Components" />
            <p>
              Wave AI is built using open-source software including React, TypeScript, Tailwind CSS, and others. These components retain their respective licenses. Full attribution is available upon request.
            </p>

            <Sub title="DMCA / Copyright Claims" />
            <p>
              If you believe any content on Wave AI infringes your copyright, please contact us at the email address in the Support section with a description of the allegedly infringing content, your contact information, and a statement that you have a good faith belief the use is unauthorized.
            </p>
          </Section>

          {/* ═══ SERVICE AVAILABILITY ══════════════════════════════════ */}
          <Section id="availability" icon={Wifi} iconColor="text-teal-500" title="Service Availability">
            <Sub title="Uptime Commitment" />
            <p>
              Wave AI is provided on a best-effort basis. While we strive for high availability, we cannot guarantee 100% uptime. AI responses depend on network connectivity and the availability of underlying AI processing infrastructure.
            </p>

            <Sub title="Planned Maintenance" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Planned maintenance windows will be announced via our official WhatsApp channel and social platforms where possible.</Li>
              <Li>Emergency maintenance may occur without notice to address security or stability issues.</Li>
              <Li>During maintenance, some or all features may be temporarily unavailable.</Li>
            </ul>

            <Sub title="Service Interruptions" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>AI response failures during network interruptions or high load will display a clear error message.</Li>
              <Li>Wave AI automatically retries requests using multiple providers before displaying an error.</Li>
              <Li>We are not liable for damages resulting from service interruptions beyond our reasonable control.</Li>
            </ul>

            <Sub title="Geographic Availability" />
            <p>
              Wave AI is available globally. Performance may vary by region depending on network conditions and infrastructure proximity. We do not intentionally restrict access based on geographic location.
            </p>
          </Section>

          {/* ═══ PAYMENTS & PLANS ═════════════════════════════════════════ */}
          <Section id="payments" icon={Star} iconColor="text-yellow-500" title="Payments & Plans">
            <Sub title="Free Access" />
            <p>
              Wave AI is currently available entirely free of charge. All core features including chat, code generation, voice synthesis, vision analysis, and file analysis are accessible at no cost. Image and video generation features require account registration (also free).
            </p>

            <Sub title="Future Paid Features" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Wave Platforms, Inc. may introduce premium subscription plans in the future to support ongoing development and infrastructure costs.</Li>
              <Li>Existing users will receive advance notice of any monetization changes affecting features they currently use for free.</Li>
              <Li>Free-tier access will always be maintained for core conversational features.</Li>
            </ul>

            <Sub title="No Hidden Charges" />
            <p>
              We will never charge you without explicit, informed consent. No payment information is collected at this time. If payment features are introduced, they will use secure, industry-standard payment processors and will be clearly labeled.
            </p>
          </Section>

          {/* ═══ CHILDREN & MINORS ════════════════════════════════════════ */}
          <Section id="minors" icon={Shield} iconColor="text-rose-400" title="Children & Minors">
            <Sub title="Minimum Age Requirements" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Wave AI is not intended for children under 13 years of age.</Li>
              <Li>We do not knowingly collect personal information from children under 13.</Li>
              <Li>If we become aware that a child under 13 has provided personal information, we will delete it promptly.</Li>
            </ul>

            <Sub title="Users Aged 13–17" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Users between 13 and 17 years old must have parental or legal guardian consent to create an account.</Li>
              <Li>Parents and guardians are responsible for supervising their child's use of Wave AI.</Li>
              <Li>We recommend parents enable browser-level content filtering for users in this age group.</Li>
            </ul>

            <Sub title="Parental Requests" />
            <p>
              If you are a parent or guardian and believe your child has created an account without your consent, please contact us using the details in the Support section. We will promptly review and, if confirmed, delete the account and all associated data.
            </p>
          </Section>

          {/* ═══ THIRD-PARTY LINKS ════════════════════════════════════════ */}
          <Section id="thirdparty" icon={Globe} iconColor="text-slate-500" title="Third-Party Links & Services">
            <p>
              Wave AI may display links to or integrate with third-party websites, services, or resources. These are provided for informational and functional purposes only.
            </p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Wave Platforms, Inc. is not responsible for the content, privacy practices, or terms of any third-party website or service.</Li>
              <Li>Clicking third-party links from within Wave AI takes you outside our platform — we encourage you to review the privacy policies of any external sites you visit.</Li>
              <Li>Any transactions or interactions you have with third parties are solely between you and that party.</Li>
              <Li>Wave AI integrates with external AI processing infrastructure to deliver responses. These providers have their own terms and privacy policies and receive only the minimum data necessary to process your requests.</Li>
            </ul>
          </Section>

          {/* ═══ MOBILE & PWA ════════════════════════════════════════════ */}
          <Section id="mobile" icon={Smartphone} iconColor="text-orange-500" title="Mobile & PWA">
            <p>
              Wave AI is a Progressive Web App (PWA) — it can be installed on any modern device including iPhones, Android phones, tablets, and desktop computers without going through an app store.
            </p>

            <Sub title="Installation" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>On iOS: Open in Safari → tap Share → "Add to Home Screen".</Li>
              <Li>On Android: Open in Chrome → tap the menu → "Install App" or "Add to Home Screen".</Li>
              <Li>On Desktop: Look for the install icon in your browser's address bar.</Li>
              <Li>Once installed, Wave AI behaves like a native app with offline caching for the interface.</Li>
            </ul>

            <Sub title="PWA Capabilities" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>The app interface loads from cache even when offline, though AI responses require an internet connection.</Li>
              <Li>Push notifications may be added in future updates — you will be asked for permission before any notifications are sent.</Li>
              <Li>The app is updated automatically in the background when a new version is available.</Li>
            </ul>

            <Sub title="Device Permissions" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li><strong>Microphone:</strong> Required only for the Voice Call feature. Permission is requested only when you tap "Start Voice Call".</Li>
              <Li><strong>Camera:</strong> Not required or requested by Wave AI at this time.</Li>
              <Li><strong>Notifications:</strong> Not used at this time — may be introduced as an opt-in feature in the future.</Li>
              <Li><strong>Location:</strong> Not collected or used by Wave AI.</Li>
            </ul>
          </Section>

          {/* ═══ POLICY CHANGES ══════════════════════════════════════════ */}
          <Section id="changes" icon={Settings} iconColor="text-slate-400" title="Policy Changes & Updates">
            <p>
              Wave Platforms, Inc. may update these Terms, Privacy Policy, and related policies from time to time. Here is how we handle changes:
            </p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li><strong>Minor changes:</strong> Corrections, clarifications, and updates that don't materially affect your rights may be made without specific notice beyond updating the "last updated" date.</Li>
              <Li><strong>Material changes:</strong> Significant changes that affect your rights or obligations will be communicated via in-app notification, banner, or announcement on our official channels at least 7 days before taking effect.</Li>
              <Li><strong>Continued use:</strong> Your continued use of Wave AI after the effective date of any changes constitutes your acceptance of the updated policies.</Li>
              <Li><strong>Objection:</strong> If you materially disagree with an update, you may close your account. Contact us before doing so — we may be able to address your concern.</Li>
            </ul>
          </Section>

          {/* ═══ DISCLAIMER ══════════════════════════════════════════════ */}
          <Section id="disclaimer" icon={AlertTriangle} iconColor="text-red-500" title="Disclaimer & Limitation of Liability">
            <Sub title="AI-Generated Content Disclaimer" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Wave AI responses are generated by artificial intelligence and may contain errors, inaccuracies, outdated information, or content that sounds authoritative but is incorrect.</Li>
              <Li>Do not rely on Wave AI for medical diagnosis, legal advice, financial decisions, or any other safety-critical matter without consulting a qualified human professional.</Li>
              <Li>Always verify important information from authoritative, primary sources before acting on it.</Li>
              <Li>AI-generated code should be reviewed and tested before deployment in production environments.</Li>
              <Li>AI-generated images and videos may not accurately represent real people, places, or events.</Li>
            </ul>

            <Sub title="No Warranty" />
            <p>
              Wave AI is provided "as is" and "as available" without any express or implied warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, completeness, or non-infringement.
            </p>

            <Sub title="Limitation of Liability" />
            <p>
              To the maximum extent permitted by applicable law, Wave Platforms, Inc. and its directors, officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including loss of profits, data, goodwill, or other intangible losses, arising from:
            </p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Your access to or inability to access Wave AI.</Li>
              <Li>Any AI-generated content provided through Wave AI.</Li>
              <Li>Unauthorized access to or alteration of your transmissions or data.</Li>
              <Li>Statements or conduct of any third party on or through the service.</Li>
              <Li>Any other matter relating to Wave AI.</Li>
            </ul>
          </Section>

          {/* ═══ COMMUNITY GUIDELINES ════════════════════════════════════ */}
          <Section id="community" icon={Heart} iconColor="text-pink-500" title="Community Guidelines">
            <p>
              Wave AI is used by people from all walks of life, backgrounds, and cultures. We ask everyone to uphold these community standards to keep it a positive and productive environment.
            </p>

            <Sub title="Be Respectful" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Treat the AI system and the platform with the same respect you would show another person.</Li>
              <Li>Avoid using Wave AI to practice or develop hate speech, harassment tactics, or intimidation strategies.</Li>
              <Li>Do not attempt to "break" or manipulate the AI into generating harmful content — this violates our Acceptable Use Policy.</Li>
            </ul>

            <Sub title="Be Honest" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Do not use Wave AI to generate content intended to deceive others, including fake news, fraudulent reviews, or misleading documents.</Li>
              <Li>Do not misrepresent AI-generated content as your own original work in contexts where that would constitute academic fraud or professional dishonesty.</Li>
            </ul>

            <Sub title="Be Responsible" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Understand that you bear responsibility for how you use AI-generated content.</Li>
              <Li>Use Wave AI to learn, create, solve problems, and connect — not to harm, manipulate, or deceive.</Li>
              <Li>Report misuse or content that violates these guidelines using the contact channels below.</Li>
            </ul>
          </Section>

          {/* ═══ TERMINATION ══════════════════════════════════════════════ */}
          <Section id="termination" icon={Ban} iconColor="text-red-400" title="Termination Policy">
            <Sub title="Termination by Us" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>We reserve the right to suspend or terminate access to Wave AI at any time, with or without cause, with or without notice.</Li>
              <Li>Violations of the Acceptable Use Policy, particularly those involving illegal content, are grounds for immediate termination without warning.</Li>
              <Li>Repeated or severe violations of any part of these Terms may result in permanent banning.</Li>
            </ul>

            <Sub title="Termination by You" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>You may stop using Wave AI at any time. For account deletion, contact us using the support details below.</Li>
              <Li>Upon your termination, your account data will be deleted in accordance with our data retention policy.</Li>
            </ul>

            <Sub title="Effect of Termination" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Upon termination, your right to access Wave AI ceases immediately.</Li>
              <Li>Provisions of these Terms that by their nature should survive termination (including IP, disclaimer, and limitation of liability sections) will continue to apply.</Li>
            </ul>
          </Section>

          {/* ═══ ACCESSIBILITY ════════════════════════════════════════════ */}
          <Section id="accessibility" icon={Zap} iconColor="text-amber-400" title="Accessibility">
            <p>
              Wave Platforms, Inc. is committed to making Wave AI accessible to all users, including those with disabilities.
            </p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Wave AI is built using semantic HTML and follows WCAG 2.1 accessibility guidelines as a baseline.</Li>
              <Li>All interactive elements maintain minimum tap target sizes of 44×44px for easy touch access.</Li>
              <Li>Color contrast ratios meet or exceed 4.5:1 for normal text to ensure readability.</Li>
              <Li>Text sizes are responsive and respect system font size preferences.</Li>
              <Li>Wave AI supports screen reader navigation through proper ARIA labels and semantic structure.</Li>
              <Li>The Voice Call feature offers an alternative to text input for users who prefer speech.</Li>
              <Li>If you encounter accessibility barriers, please report them to us — we treat accessibility issues with high priority.</Li>
            </ul>
          </Section>

          {/* ═══ CONTACT & SUPPORT ═══════════════════════════════════════ */}
          <Section id="contact" icon={HeadphonesIcon} iconColor="text-blue-400" title="Contact & Support">
            <p>
              We're here to help. Whether you have a question, want to report an issue, or are interested in a business partnership — reach out through any channel below.
            </p>
            <div className="grid gap-3 mt-2">
              {[
                {
                  icon: Youtube,
                  color: "text-red-500",
                  bg: "bg-red-50 border-red-100",
                  label: "YouTube — Tutorials & Updates",
                  desc: "Watch guides, feature demos, and announcements",
                  href: "https://www.youtube.com/@Wave-platfoms",
                },
                {
                  icon: MessageCircle,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50 border-emerald-100",
                  label: "WhatsApp Community Channel",
                  desc: "Join for real-time updates, tips, and community support",
                  href: "https://whatsapp.com/channel/0029VbDD5xgBlHpjUBmayj30",
                },
                {
                  icon: Globe,
                  color: "text-violet-500",
                  bg: "bg-violet-50 border-violet-100",
                  label: "TikTok — @itsmeddy",
                  desc: "Short demos, tips, and behind-the-scenes",
                  href: "https://www.tiktok.com/@itsmeddy",
                },
                {
                  icon: Mail,
                  color: "text-primary",
                  bg: "bg-blue-50 border-blue-100",
                  label: "Business & General Inquiries",
                  desc: "Contact Wave Platforms, Inc. for enterprise, partnerships, and support",
                  href: "mailto:delostvoyage@gmail.com",
                },
              ].map(({ icon: Icon, color, bg, label, desc, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3.5 p-4 rounded-xl border ${bg} transition-all hover:opacity-80 active:opacity-70`}
                  style={{ touchAction: "manipulation" }}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-slate-100 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 leading-tight">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                </a>
              ))}
            </div>
            <div className="mt-4 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Response Times</p>
              <ul className="space-y-1 text-xs text-slate-500">
                <li>• WhatsApp Community: typically within a few hours during business hours</li>
                <li>• Email inquiries: 1–3 business days</li>
                <li>• Critical security vulnerabilities: escalated immediately, response within 24 hours</li>
                <li>• GDPR / privacy requests: within 30 days as required by law</li>
              </ul>
            </div>
          </Section>

          {/* ═══ FAQ ══════════════════════════════════════════════════════ */}
          <Section id="faq" icon={HelpCircle} iconColor="text-emerald-400" title="Frequently Asked Questions">
            {[
              {
                q: "Is Wave AI free to use?",
                a: "Yes. Wave AI is completely free. All features including chat, code generation, voice synthesis, and image generation are available at no cost. An account is required only for certain features like image and video generation.",
              },
              {
                q: "Does Wave AI store my conversations?",
                a: "By default, conversations are stored only on your device in your browser's localStorage. They are not sent to our servers unless you explicitly enable cloud sync as a signed-in user.",
              },
              {
                q: "Can I use Wave AI offline?",
                a: "The app interface loads from cache offline (as a PWA), but AI responses require an internet connection since they are processed by AI systems.",
              },
              {
                q: "Is Wave AI safe for children?",
                a: "Wave AI is designed for users aged 13 and above. Users under 18 require parental consent. We have content filters in place, but parental supervision is recommended for all minors.",
              },
              {
                q: "Who is behind Wave AI?",
                a: "Wave AI is a brand product of Wave Platforms, Inc., a technology company founded and led by CEO Meddy Mususwa. Wave Platforms focuses on building intelligent, accessible software products.",
              },
              {
                q: "How do I delete my account?",
                a: "Contact us via email at delostvoyage@gmail.com or via our WhatsApp channel with a deletion request. We will process it within 30 days.",
              },
              {
                q: "Can I install Wave AI on my phone?",
                a: "Yes! Wave AI is a Progressive Web App (PWA). On Android: use Chrome and tap 'Add to Home Screen'. On iPhone: use Safari and tap Share → 'Add to Home Screen'. It installs like a native app.",
              },
              {
                q: "Does Wave AI use my data to train AI?",
                a: "No. Your conversations are never used to train AI models. We are committed to keeping your data private and your conversations are processed only to generate your responses.",
              },
              {
                q: "What languages does Wave AI support?",
                a: "Wave AI can understand and respond in multiple languages including English, French, Spanish, Swahili, Arabic, Mandarin, German, Portuguese, and many others. The quality may vary by language.",
              },
              {
                q: "What should I do if Wave AI gives me incorrect information?",
                a: "Always verify important information from authoritative primary sources. Wave AI is a helpful tool but not infallible. For critical decisions — medical, legal, financial — always consult a qualified professional.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group border border-slate-100 rounded-xl overflow-hidden">
                <summary
                  className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors list-none"
                  style={{ touchAction: "manipulation" }}
                >
                  {q}
                  <ChevronRight size={14} className="text-slate-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 pt-1 text-sm text-slate-500 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {a}
                </div>
              </details>
            ))}
          </Section>

          {/* ═══ TRANSPARENCY ════════════════════════════════════════════ */}
          <Section id="transparency" icon={Eye} iconColor="text-cyan-400" title="Transparency & Open Practices">
            <p>
              We believe transparency builds trust. Here is everything you should know about how Wave AI operates:
            </p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Wave AI does not sell your personal data to any third party — ever.</Li>
              <Li>Wave AI does not use your conversations to train AI models — ever.</Li>
              <Li>Chat history lives on your device (localStorage) by default — you own it completely.</Li>
              <Li>All AI responses are generated in real-time and are unique to your request.</Li>
              <Li>We use Row Level Security (RLS) on all cloud database tables — your synced data is only accessible by you, enforced at the database level.</Li>
              <Li>Authentication sessions are cryptographically signed and have limited expiry.</Li>
              <Li>We will never ask for your password via email, chat, or any channel other than the official sign-in form on wave-ai.app.</Li>
              <Li>Our infrastructure uses industry-standard encryption (TLS 1.3) for all data in transit.</Li>
              <Li>All cloud-stored data is encrypted at rest.</Li>
              <Li>Security incidents affecting user data will be disclosed to affected users within 72 hours of discovery, in accordance with GDPR requirements.</Li>
              <Li>We do not run targeted advertising or ad networks of any kind.</Li>
              <Li>These policies apply equally to all users, regardless of geography or account type.</Li>
            </ul>
          </Section>

          {/* ═══ ABOUT THE COMPANY ═══════════════════════════════════════ */}
          <Section id="company" icon={Building2} iconColor="text-violet-400" title="About Wave Platforms, Inc.">
            <p>
              Wave AI is a brand product of <strong className="text-slate-700">Wave Platforms, Inc.</strong> — a technology company building intelligent software products focused on accessibility, performance, and exceptional user experience.
            </p>

            <Sub title="Leadership" />
            <ul className="space-y-1.5 list-none pl-0">
              <Li><strong>CEO & Founder:</strong> Meddy Mususwa — visionary technology leader who founded Wave Platforms with the mission of bringing world-class AI technology to East Africa and a global audience.</Li>
            </ul>

            <Sub title="Mission" />
            <p>
              Wave AI's mission is to make advanced AI capabilities universally accessible — easy to use, fast to respond, and available on any device. We believe that AI should empower people, not confuse or exclude them.
            </p>

            <Sub title="Official Channels" />
            <div className="space-y-2 mt-2">
              {[
                { label: "YouTube", href: "https://www.youtube.com/@Wave-platfoms", color: "text-red-500" },
                { label: "WhatsApp Community", href: "https://whatsapp.com/channel/0029VbDD5xgBlHpjUBmayj30", color: "text-emerald-500" },
                { label: "TikTok — @itsmeddy", href: "https://www.tiktok.com/@itsmeddy", color: "text-slate-700" },
                { label: "Email — delostvoyage@gmail.com", href: "mailto:delostvoyage@gmail.com", color: "text-primary" },
              ].map(({ label, href, color }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm font-medium hover:underline ${color}`}
                  style={{ touchAction: "manipulation" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />{label}
                </a>
              ))}
            </div>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              ® 2026 Wave Platforms, Inc.™ · Wave AI is a brand product of Wave Platforms. All rights reserved.
            </p>
          </Section>

          {/* ═══ VERSION HISTORY ══════════════════════════════════════════ */}
          <Section id="updates" icon={RefreshCw} iconColor="text-slate-400" title="Version History & Updates">
            <div className="space-y-3">
              {[
                {
                  version: "v1.1",
                  date: "April 27, 2026",
                  note: "Added sections: Data & Storage, Accounts & Access, Intellectual Property, Service Availability, Payments & Plans, Children & Minors, Third-Party Links, Mobile & PWA, Policy Changes, Community Guidelines, Termination, Accessibility, FAQ, Transparency, and About the Company. Added sidebar navigation.",
                },
                {
                  version: "v1.0",
                  date: "April 27, 2026",
                  note: "Initial Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use Policy, Disclaimer, and Support documentation published.",
                },
              ].map(({ version, date, note }) => (
                <div key={version} className="flex gap-3 text-xs">
                  <span className="font-mono font-semibold text-primary flex-shrink-0 mt-0.5">{version}</span>
                  <div>
                    <span className="text-slate-400">{date} — </span>
                    <span className="text-slate-600">{note}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              These documents are living policies subject to change. Material updates will be announced in the app and via our community channels.
            </p>
          </Section>

          {/* Footer */}
          <div className="pt-4 pb-10 text-center space-y-3">
            <p className="text-[11px] text-slate-400">® 2026 Wave Platforms, Inc.™ · All rights reserved.</p>
            <p className="text-[11px] text-slate-400">Wave AI is a brand product of Wave Platforms, Inc.</p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <a href="#tos" className="text-xs text-primary hover:underline font-medium" style={{ touchAction: "manipulation" }}>Terms of Service</a>
              <span className="text-slate-200">·</span>
              <a href="#privacy" className="text-xs text-slate-500 hover:underline" style={{ touchAction: "manipulation" }}>Privacy Policy</a>
              <span className="text-slate-200">·</span>
              <a href="#contact" className="text-xs text-slate-500 hover:underline" style={{ touchAction: "manipulation" }}>Support</a>
              <span className="text-slate-200">·</span>
              <Link to="/app" className="text-xs text-slate-400 hover:text-slate-600 hover:underline" style={{ touchAction: "manipulation" }}>Open App</Link>
              <span className="text-slate-200">·</span>
              <Link to="/about" className="text-xs text-slate-400 hover:text-slate-600 hover:underline" style={{ touchAction: "manipulation" }}>About</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
