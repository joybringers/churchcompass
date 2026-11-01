'use client';
import { useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: NAV, marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #f1f5f9' }}>{title}</h2>
      <div style={{ color: '#374151', fontSize: '0.925rem', lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function Privacy() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: NAV, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-compass" style={{ color: NAV, fontSize: 16 }} />
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
        </div>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}>← Home</button>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 40 }}>Last updated: 1 November 2026</p>

        <Section title="1. Who we are">
          <p>ChurchCompass is a service operated by <strong>Elmoril Ltd</strong> ("we", "us", "our"), a company registered in England and Wales. We provide free church management software to churches and faith communities.</p>
          <p style={{ marginTop: 10 }}>For data protection purposes, Elmoril Ltd is the data controller for information we collect directly. Each church using ChurchCompass is a separate data controller for the personal data of their own members and visitors.</p>
          <p style={{ marginTop: 10 }}>Contact us: <strong>privacy@elmorilx.com</strong></p>
        </Section>

        <Section title="2. What data we collect">
          <p><strong>Church administrator data</strong> — when a church registers, we collect the church name, address, phone number, denomination, and the admin's email address and a hashed (encrypted) password.</p>
          <p style={{ marginTop: 10 }}><strong>Church member and visitor data</strong> — church administrators enter or import names, email addresses, phone numbers, and attendance records for their congregation. This data belongs to the church and is processed on their behalf.</p>
          <p style={{ marginTop: 10 }}><strong>First-timer data</strong> — when a visitor completes a first-timer welcome card, they may provide their name, email, phone, address, and optional prayer requests. This data is visible only to that church's admin.</p>
          <p style={{ marginTop: 10 }}><strong>Attendance records</strong> — sign-in and sign-out times are recorded for members, visitors, and children.</p>
          <p style={{ marginTop: 10 }}><strong>Children's data</strong> — names, guardian details, group assignment, and pickup codes are collected during children's check-in. This is sensitive data and is accessible only to the church admin.</p>
        </Section>

        <Section title="3. Why we collect it (lawful basis)">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}><strong>Contract performance</strong> — to provide the ChurchCompass service to registered churches.</li>
            <li style={{ marginBottom: 8 }}><strong>Legitimate interests</strong> — to monitor platform usage, prevent abuse, and improve the service.</li>
            <li style={{ marginBottom: 8 }}><strong>Consent</strong> — for first-timer forms and any optional fields where a visitor voluntarily provides information.</li>
          </ul>
        </Section>

        <Section title="4. How we use your data">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>To operate and maintain your church's account and dashboard.</li>
            <li style={{ marginBottom: 8 }}>To send service emails (welcome message, password resets).</li>
            <li style={{ marginBottom: 8 }}>To aggregate anonymous usage statistics for platform improvement.</li>
            <li style={{ marginBottom: 8 }}>We do not sell, rent, or share your data with third parties for marketing purposes.</li>
          </ul>
        </Section>

        <Section title="5. Who sees your data">
          <p><strong>Church admins</strong> can see all data for their own church only. They cannot see data from other churches.</p>
          <p style={{ marginTop: 10 }}><strong>Elmoril staff</strong> may access data for support and maintenance purposes, bound by confidentiality obligations.</p>
          <p style={{ marginTop: 10 }}><strong>Supabase</strong> — we use Supabase (a PostgreSQL database platform) to store all data. Supabase processes data under a Data Processing Agreement compliant with UK GDPR.</p>
          <p style={{ marginTop: 10 }}><strong>Vercel</strong> — our application runs on Vercel's hosting platform. Vercel processes request data under standard DPAs.</p>
          <p style={{ marginTop: 10 }}><strong>Resend</strong> — we use Resend to send transactional emails. Only the recipient's email address and the email content are shared.</p>
        </Section>

        <Section title="6. Data retention">
          <p>Church account data is retained for as long as the church remains registered. Member and attendance data is retained until the church admin deletes it or requests deletion of their account.</p>
          <p style={{ marginTop: 10 }}>Password reset tokens expire after 1 hour.</p>
          <p style={{ marginTop: 10 }}>To request deletion of your church's data, contact <strong>privacy@elmorilx.com</strong>.</p>
        </Section>

        <Section title="7. Your rights under UK GDPR">
          <p>If you are an individual whose data has been entered into ChurchCompass, you have the right to:</p>
          <ul style={{ paddingLeft: 20, margin: '10px 0 0' }}>
            <li style={{ marginBottom: 6 }}>Access the personal data held about you</li>
            <li style={{ marginBottom: 6 }}>Request correction of inaccurate data</li>
            <li style={{ marginBottom: 6 }}>Request erasure ("right to be forgotten")</li>
            <li style={{ marginBottom: 6 }}>Object to processing</li>
            <li style={{ marginBottom: 6 }}>Request data portability</li>
          </ul>
          <p style={{ marginTop: 10 }}>To exercise these rights, contact the church that entered your data (as they are the data controller for that data), or contact us at <strong>privacy@elmorilx.com</strong>.</p>
        </Section>

        <Section title="8. Cookies and tracking">
          <p>ChurchCompass does not use advertising cookies or third-party tracking. We use <code>sessionStorage</code> (not cookies) to maintain your admin login session within a browser tab. No tracking pixels or analytics scripts are loaded.</p>
        </Section>

        <Section title="9. Children's data">
          <p>Children's check-in data is collected on behalf of the church for safeguarding purposes. Pickup codes are used to verify authorised collection. This data is not shared with any third party and is visible only to the church admin.</p>
          <p style={{ marginTop: 10 }}>Churches using ChurchCompass for children's check-in are responsible for obtaining appropriate consent from parents or guardians in accordance with their own safeguarding policies.</p>
        </Section>

        <Section title="10. Security">
          <p>Passwords are stored as bcrypt hashes (never plain text). All data is transmitted over HTTPS. Access to admin dashboards requires authentication with email and password.</p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>We may update this policy from time to time. We will notify registered church admins of material changes by email.</p>
        </Section>

        <Section title="12. Complaints">
          <p>If you have concerns about how we handle your data, you can contact the Information Commissioner's Office (ICO) at <strong>ico.org.uk</strong> or by calling 0303 123 1113.</p>
        </Section>
      </div>

      <footer style={{ background: '#0f1f35', padding: '20px 32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
        ChurchCompass — free church management · by Elmoril · elmorilx.com
      </footer>
    </div>
  );
}
