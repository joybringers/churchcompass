'use client';
import { useState, useEffect, useRef } from 'react';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const sections = [
  { id: 'intro',         title: '1. Introduction' },
  { id: 'getting-started', title: '2. Getting Started' },
  { id: 'plans',         title: '3. Plans & Pricing' },
  { id: 'dashboard',     title: '4. Admin Dashboard' },
  { id: 'members',       title: '5. Managing Members' },
  { id: 'kiosk',         title: '6. The Kiosk' },
  { id: 'firsttimers',   title: '7. First-timer Forms' },
  { id: 'events',        title: '8. Events' },
  { id: 'guard',         title: '9. Guard Module' },
  { id: 'reports',       title: '10. Reports' },
  { id: 'settings',      title: '11. Settings & Billing' },
  { id: 'troubleshoot',  title: '12. Troubleshooting' },
];

function Tip({ children }) {
  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: `4px solid ${GOLD}`, borderRadius: 8, padding: '10px 14px', margin: '12px 0', display: 'flex', gap: 10 }}>
      <i className="fas fa-lightbulb" style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: '0.875rem', color: '#78350f' }}>{children}</span>
    </div>
  );
}

function Note({ children }) {
  return (
    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderLeft: '4px solid #3b82f6', borderRadius: 8, padding: '10px 14px', margin: '12px 0', display: 'flex', gap: 10 }}>
      <i className="fas fa-circle-info" style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>{children}</span>
    </div>
  );
}

function H2({ children }) {
  return <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: NAV, margin: '24px 0 8px' }}>{children}</h2>;
}

function H3({ children }) {
  return <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', margin: '18px 0 6px' }}>{children}</h3>;
}

function P({ children }) {
  return <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.65, margin: '6px 0' }}>{children}</p>;
}

function UL({ items }) {
  return (
    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
      ))}
    </ul>
  );
}

function SectionHeader({ id, number, title, icon }) {
  return (
    <div id={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 10px', borderBottom: `2px solid ${GOLD}`, marginBottom: 16, scrollMarginTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: NAV, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`fas ${icon}`} style={{ color: GOLD, fontSize: 15 }} />
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Section {number}</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: NAV, margin: 0 }}>{title}</h2>
      </div>
    </div>
  );
}

function Url({ path }) {
  return <code style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: 5, fontSize: '0.82rem', color: '#1e3a5f', fontFamily: 'monospace' }}>{path}</code>;
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('intro');
  const contentRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* TOC sidebar */}
      <aside style={{ width: 220, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '24px 0' }}>
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #e2e8f0', marginBottom: 8 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>User Guide</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: NAV, marginTop: 2 }}>Contents</div>
        </div>
        {sections.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', borderLeft: `3px solid ${activeSection === s.id ? GOLD : 'transparent'}`, background: activeSection === s.id ? '#fffbeb' : 'transparent', color: activeSection === s.id ? NAV : '#64748b', fontSize: '0.8rem', fontWeight: activeSection === s.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
            {s.title}
          </button>
        ))}
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', marginTop: 16 }}>
          <P>Need more help?</P>
          <a href="mailto:admin@elmorilx.com" style={{ fontSize: '0.8rem', color: NAV, fontWeight: 600 }}>admin@elmorilx.com</a>
        </div>
      </aside>

      {/* Content */}
      <div ref={contentRef} style={{ flex: 1, maxWidth: 760, padding: '32px 40px', overflowY: 'auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>ChurchCompass</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: NAV, margin: '0 0 8px' }}>User Guide</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Everything you need to get the most out of ChurchCompass — from setup to daily use.</p>
        </div>

        {/* ── 1. INTRODUCTION ── */}
        <SectionHeader id="intro" number="1" title="Introduction" icon="fa-compass" />
        <P>ChurchCompass is a web-based church management platform built by Elmoril Ltd to help churches of all sizes run smoothly. Everything your team needs — member records, kiosk sign-in, attendance tracking, digital welcome cards, event management, and safeguarding logs — is in one place, accessible from any device with a browser.</P>
        <H2>What ChurchCompass does for you</H2>
        <UL items={[
          'Keep a live directory of your congregation — adults, youth, and children all in one Members list.',
          'Run a self-service kiosk on a tablet so members check in and out without a desk volunteer.',
          'Capture first-time visitors with a digital welcome card and follow up with their details automatically.',
          'Track attendance at every service and event with one click.',
          'Log safeguarding incidents and DBS/clearance records in the Guard module.',
          'See attendance trends and CSV-export your data at any time.',
        ]} />
        <P>Each church gets its own private URL slug (e.g. <Url path="churchcompass.elmorilx.com/grace-community" />). Your kiosk, first-timer form, and admin dashboard all live under that address. No app download required — everything works in a browser.</P>

        {/* ── 2. GETTING STARTED ── */}
        <SectionHeader id="getting-started" number="2" title="Getting Started" icon="fa-rocket" />
        <H2>Step 1 — Register your church</H2>
        <P>Go to <Url path="churchcompass.elmorilx.com" /> and click <strong>Register Your Church</strong> (top-right corner) or <strong>Get Started Free</strong>. Fill in the registration form:</P>
        <UL items={[
          'Church name — appears on your kiosk and member records.',
          'URL slug — a short web-safe name (e.g. grace-community). This becomes part of your unique web address.',
          'Denomination and address — optional but helpful for the member directory.',
          'Admin email and password — your login for the admin area. Keep it safe.',
        ]} />
        <Tip>Register on the Free plan first, explore all the features, and upgrade to Pro later from your Settings page.</Tip>

        <H2>Step 2 — Confirm your email</H2>
        <P>After submitting the form you will receive a confirmation email. Click the link inside to activate your account. If you do not see it within a few minutes, check your spam/junk folder.</P>

        <H2>Step 3 — Sign in to your admin dashboard</H2>
        <P>Go to <Url path="churchcompass.elmorilx.com/YOUR-SLUG/admin" /> and enter your admin email and password.</P>

        {/* ── 3. PLANS ── */}
        <SectionHeader id="plans" number="3" title="Plans & Pricing" icon="fa-tag" />
        <H2>Free plan</H2>
        <UL items={['Up to 100 members', '3 admin accounts', 'Kiosk check-in/out', 'Attendance tracking', 'First-timer forms & follow-up', 'Events management']} />
        <Note>The Free plan is fully functional for smaller congregations. No credit card required.</Note>

        <H2>Pro plan — £9/month (or £90/year)</H2>
        <UL items={['Up to 500 members', 'Unlimited admin accounts', 'Everything in Free', 'CSV export', 'Custom fields', 'Groups & Teams', 'Guard module — DBS tracker & incident log', 'Priority support']} />
        <Tip>Start the 14-day free trial — no card required. The card is only needed after the trial ends.</Tip>

        <H2>Upgrading</H2>
        <P>Go to <strong>Settings → Billing</strong> inside the admin dashboard and click <strong>Upgrade to Pro</strong>. UK churches pay via Stripe; Nigerian churches pay in Naira (₦) via Flutterwave.</P>

        {/* ── 4. DASHBOARD ── */}
        <SectionHeader id="dashboard" number="4" title="Admin Dashboard" icon="fa-gauge-high" />
        <H2>Navigation sidebar</H2>
        <P>The left sidebar contains links to every section:</P>
        <UL items={[
          'Dashboard — today\'s attendance summary and quick-action cards.',
          'Members — your full member directory.',
          'Events — upcoming and past services and events.',
          'Attendance — attendance records per service.',
          'Children — children\'s check-in view.',
          'Groups — small groups and teams.',
          'Guard — safeguarding records (Pro plan).',
          'Giving — tithes and offering records.',
          'First Timers — new visitors who filled in a welcome card.',
          'Communications — send messages to your congregation.',
          'Reports — attendance trends and CSV export.',
          'Settings — church profile, branding, billing, and admin accounts.',
        ]} />

        <H2>Dashboard summary cards</H2>
        <P>The top row shows four live stats: today's attendance, total members, first-timers this month, and upcoming events. Below them, quick-action buttons jump straight to common tasks.</P>

        {/* ── 5. MEMBERS ── */}
        <SectionHeader id="members" number="5" title="Managing Members" icon="fa-users" />
        <H2>The member directory</H2>
        <P>The Members page shows every person in your congregation in a searchable, filterable table. Each row shows name, type (adult / youth / child), email, phone, and active status.</P>

        <H2>Adding a member manually</H2>
        <P>Click <strong>Add Member</strong> at the top-right of the Members page and fill in first name, last name, member type, email, and phone. Click Save.</P>

        <H2>Auto-import from kiosk and first-timer forms</H2>
        <P>Any person who signs in through the kiosk or fills in a first-timer welcome card is automatically added to the Members list as an active member — no manual import needed.</P>
        <Tip>If a member signs in with a name that already exists, their record is updated rather than duplicated.</Tip>

        <H2>Editing a member record</H2>
        <P>Click any row in the Members table to open that person's profile. You can edit any field, add notes, or mark them as inactive (hides them from attendance views but keeps their history).</P>

        <H2>Searching and filtering</H2>
        <P>Use the search box to find anyone by name. Use the Type filter to show only Adults, Youth, or Children. The Active toggle shows only current active members.</P>

        <H2>CSV export (Pro)</H2>
        <P>Click <strong>Export CSV</strong> on the Members page. The file includes all fields and opens in Excel, Google Sheets, or Numbers.</P>

        {/* ── 6. KIOSK ── */}
        <SectionHeader id="kiosk" number="6" title="The Kiosk (Check-in / Check-out)" icon="fa-desktop" />
        <H2>Setting up your kiosk</H2>
        <P>Open the kiosk URL on a tablet browser:</P>
        <div style={{ margin: '8px 0 12px' }}><Url path="churchcompass.elmorilx.com/YOUR-SLUG/signin" /></div>
        <Tip>Bookmark the kiosk URL in the tablet browser and set it to full-screen (kiosk mode) so members see only the sign-in screen.</Tip>

        <H2>The sign-in screen</H2>
        <P>The kiosk shows three tabs — Adults, Youth, Children. Members find their name and tap it to check in. A confirmation message appears. At the end of the service they tap their name again to check out.</P>

        <H2>Family check-in</H2>
        <P>When a parent checks in, they can also check in their children in one step — all family members are checked in simultaneously.</P>

        <H2>Admin kiosk view</H2>
        <P>Inside the admin dashboard, the <strong>Children</strong> page shows a live table of everyone currently checked in, including check-in time. You can manually check out anyone from there if they forgot to tap the kiosk.</P>
        <Note>The kiosk auto-adds any new sign-in to the Members list. Someone not yet in your directory will appear as a new member automatically.</Note>

        {/* ── 7. FIRST TIMERS ── */}
        <SectionHeader id="firsttimers" number="7" title="First-timer Forms" icon="fa-user-plus" />
        <H2>The first-timer URL</H2>
        <div style={{ margin: '8px 0 12px' }}><Url path="churchcompass.elmorilx.com/YOUR-SLUG/firsttimer" /></div>
        <P>Direct new visitors to this URL on a tablet or give them the link to fill in on their phone.</P>

        <H2>What the form collects</H2>
        <UL items={['First name and last name', 'Phone number', 'Email address', 'How they heard about the church', 'A prayer request or message (optional)']} />
        <P>Pro plan churches can add custom fields (e.g. age group, interests, would like a follow-up call).</P>

        <H2>What happens after they submit</H2>
        <P>The visitor is automatically added to the Members list and appears in the <strong>First Timers</strong> section of the admin dashboard, sorted by date, so your team can follow up.</P>
        <Tip>Assign someone to review the First Timers list each week and reach out personally within 48 hours for the best visitor retention.</Tip>

        {/* ── 8. EVENTS ── */}
        <SectionHeader id="events" number="8" title="Events" icon="fa-calendar-days" />
        <H2>Creating an event</H2>
        <P>Go to <strong>Events → New Event</strong> and fill in the event name, date and time, location, and description. Click Save.</P>

        <H2>Recording event attendance</H2>
        <P>Open the event from the Events list and click <strong>Take Attendance</strong>. Tick the members who attended and click Save.</P>
        <Tip>For Sunday services, the kiosk handles attendance automatically. Manual attendance is most useful for smaller midweek events, cell groups, or external meetings.</Tip>

        <H2>Viewing past attendance</H2>
        <P>Open any past event to see the attendance record — who was there, the total headcount, and the date. This data feeds into the Reports section.</P>

        {/* ── 9. GUARD ── */}
        <SectionHeader id="guard" number="9" title="Guard Module — Safeguarding" icon="fa-shield-halved" />
        <Note>The Guard module is available on the Pro plan only.</Note>

        <H2>DBS / clearance tracker</H2>
        <P>Keeps a record of every volunteer and staff member who has been DBS-checked. For each person you can record:</P>
        <UL items={['Full name and role', 'DBS certificate number', 'Issue date and expiry date', 'Status — Valid, Expiring Soon, or Expired']} />
        <P>The system flags records due to expire within 60 days with an alert banner on the Guard page.</P>

        <H2>Incident log</H2>
        <P>A secure, time-stamped record of any safeguarding concern or incident. For each entry you record the date and time, people involved, description of the concern, action taken, and follow-up required. All entries are only visible to admin accounts.</P>
        <Tip>Always record incidents as soon as possible while details are fresh. A pattern of small concerns can be just as important as a single major event.</Tip>

        {/* ── 10. REPORTS ── */}
        <SectionHeader id="reports" number="10" title="Reports & Analytics" icon="fa-chart-bar" />
        <H2>Attendance chart</H2>
        <P>A line chart shows weekly attendance over the last 12 months. Hover over any point to see the exact date and headcount.</P>

        <H2>Member growth chart</H2>
        <P>Tracks new members added each month vs those deactivated — your net congregation growth over time.</P>

        <H2>CSV export (Pro)</H2>
        <P>Click <strong>Export CSV</strong> on the Reports page to download a full attendance dataset including every check-in event with date, time, member name, and member type.</P>

        {/* ── 11. SETTINGS ── */}
        <SectionHeader id="settings" number="11" title="Settings & Billing" icon="fa-gear" />
        <H2>Church profile</H2>
        <P>Update your church name, denomination, address, phone, website, and primary brand colour (used as the accent on your kiosk).</P>

        <H2>Admin accounts</H2>
        <P>Go to <strong>Settings → Admin Accounts</strong> and click <strong>Add Account</strong> to give team members their own login. Each account has the same permissions as the main admin.</P>
        <Tip>Create separate accounts for each team member rather than sharing one login — this gives you a clear audit trail of who made changes.</Tip>

        <H2>Billing & plan</H2>
        <P>The <strong>Settings → Billing</strong> section shows your current plan. From here you can upgrade from Free to Pro, view your next billing date, and manage your subscription.</P>
        <Note>Nigerian churches pay in Naira (₦) via Flutterwave — ₦2,000/month or ₦20,000/year. To cancel, email admin@elmorilx.com.</Note>

        {/* ── 12. TROUBLESHOOTING ── */}
        <SectionHeader id="troubleshoot" number="12" title="Troubleshooting" icon="fa-wrench" />

        <H3>I cannot log in to the admin dashboard</H3>
        <UL items={[
          'Check you are using the correct email address — the one you used to register.',
          'Use the Forgot Password link on the sign-in screen to reset your password.',
          'If the problem persists, email admin@elmorilx.com.',
        ]} />

        <H3>The kiosk is not showing my members</H3>
        <UL items={[
          'Make sure the kiosk URL includes your church slug.',
          'Try refreshing the kiosk browser page.',
          'Check that you have members added in the Members section of the admin dashboard.',
        ]} />

        <H3>A member checked in but is not appearing in attendance</H3>
        <UL items={[
          'Reload the admin Kiosk page — it updates in real time but may need a manual refresh.',
          'Check the Events page if you are tracking a specific event attendance separately.',
        ]} />

        <H3>I upgraded to Pro but features are still showing as locked</H3>
        <UL items={[
          'Sign out and sign back in to refresh your session.',
          'If the problem persists after 10 minutes, email admin@elmorilx.com with your church name.',
        ]} />

        <H3>I need to cancel my Pro subscription</H3>
        <UL items={[
          'UK (Stripe): Go to Settings → Billing → Manage Billing to cancel directly in the Stripe portal.',
          'Nigeria (Flutterwave): Email admin@elmorilx.com with your church name and email address.',
        ]} />

        {/* Footer */}
        <div style={{ marginTop: 48, padding: '24px 0', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>ChurchCompass is built by Elmoril Ltd</p>
          <a href="mailto:admin@elmorilx.com" style={{ color: NAV, fontSize: '0.85rem', fontWeight: 600 }}>admin@elmorilx.com</a>
          <span style={{ color: '#cbd5e1', margin: '0 8px' }}>·</span>
          <a href="https://elmorilx.com" target="_blank" rel="noreferrer" style={{ color: NAV, fontSize: '0.85rem', fontWeight: 600 }}>elmorilx.com</a>
        </div>

      </div>
    </div>
  );
}
