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

export default function Terms() {
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
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 40 }}>Last updated: 4 November 2026</p>

        <Section title="1. About ChurchCompass">
          <p>ChurchCompass is a church management platform operated by <strong>Elmoril Ltd</strong> ("we", "us", "our"), a company registered in England and Wales. By registering for or using ChurchCompass, you agree to these Terms of Service.</p>
          <p style={{ marginTop: 10 }}>Contact: <strong>hello@elmorilx.com</strong></p>
        </Section>

        <Section title="2. Who can use ChurchCompass">
          <p>ChurchCompass is intended for use by churches, faith communities, and religious organisations. By registering, you confirm that:</p>
          <ul style={{ paddingLeft: 20, margin: '10px 0 0' }}>
            <li style={{ marginBottom: 8 }}>You are representing a legitimate church or faith organisation.</li>
            <li style={{ marginBottom: 8 }}>You are at least 18 years old.</li>
            <li style={{ marginBottom: 8 }}>You have authority to agree to these terms on behalf of your organisation.</li>
            <li style={{ marginBottom: 8 }}>All information you provide during registration is accurate and truthful.</li>
          </ul>
        </Section>

        <Section title="3. Free and Pro plans">
          <p><strong>Free plan</strong> — available at no charge, subject to limits (100 members, 3 admin accounts). We reserve the right to change Free plan limits with 30 days' notice.</p>
          <p style={{ marginTop: 10 }}><strong>Pro plan</strong> — charged at the current listed price (monthly or annual). Pro subscriptions are managed through Stripe. Payment is taken at the start of each billing period.</p>
          <p style={{ marginTop: 10 }}><strong>Free trial</strong> — new Pro monthly subscribers receive a 14-day free trial. No charge is made until the trial ends. You may cancel before the trial ends and will not be charged.</p>
          <p style={{ marginTop: 10 }}><strong>Annual billing</strong> — annual Pro subscriptions are charged upfront for 12 months and are non-refundable except as required by law.</p>
        </Section>

        <Section title="4. Cancellation and refunds">
          <p><strong>Monthly Pro</strong> — you may cancel at any time. Access continues until the end of the current billing period. No partial refunds are issued for unused days.</p>
          <p style={{ marginTop: 10 }}><strong>Annual Pro</strong> — you may cancel at any time. Access continues until the end of the annual period. We do not offer pro-rated refunds on annual subscriptions except where required by UK consumer law.</p>
          <p style={{ marginTop: 10 }}><strong>14-day cooling-off right</strong> — if you are a consumer (not acting in a business capacity), you have a 14-day right to cancel under the Consumer Contracts Regulations 2013. As a church or faith organisation using this service for organisational purposes, this right may not apply, but we will consider reasonable requests in good faith.</p>
          <p style={{ marginTop: 10 }}>To cancel, manage your subscription from your admin Settings page → Plan &amp; Billing → Manage billing.</p>
        </Section>

        <Section title="5. Acceptable use">
          <p>You agree not to use ChurchCompass to:</p>
          <ul style={{ paddingLeft: 20, margin: '10px 0 0' }}>
            <li style={{ marginBottom: 8 }}>Store or transmit any unlawful, harmful, or offensive content.</li>
            <li style={{ marginBottom: 8 }}>Send unsolicited bulk emails or spam through the Communications module.</li>
            <li style={{ marginBottom: 8 }}>Attempt to access data belonging to other churches or organisations.</li>
            <li style={{ marginBottom: 8 }}>Reverse engineer, decompile, or copy any part of the software.</li>
            <li style={{ marginBottom: 8 }}>Circumvent any security or authentication measures.</li>
            <li style={{ marginBottom: 8 }}>Use the platform for any commercial purpose other than managing your own church.</li>
          </ul>
          <p style={{ marginTop: 10 }}>We reserve the right to suspend or terminate accounts that breach these terms without notice.</p>
        </Section>

        <Section title="6. Your data and GDPR">
          <p>When you use ChurchCompass to store data about your church members, visitors, and children, you are the <strong>data controller</strong> for that personal data. We act as your <strong>data processor</strong>.</p>
          <p style={{ marginTop: 10 }}>You are responsible for:</p>
          <ul style={{ paddingLeft: 20, margin: '10px 0 0' }}>
            <li style={{ marginBottom: 8 }}>Having a lawful basis to collect and store personal data about your members.</li>
            <li style={{ marginBottom: 8 }}>Complying with UK GDPR and the Data Protection Act 2018 in your use of the platform.</li>
            <li style={{ marginBottom: 8 }}>Obtaining appropriate consent when collecting children's data or sensitive personal information.</li>
            <li style={{ marginBottom: 8 }}>Responding to data subject requests from your own members.</li>
          </ul>
          <p style={{ marginTop: 10 }}>Our full Privacy Policy sets out how we handle data: see <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', color: NAV, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>Privacy Policy</button>.</p>
        </Section>

        <Section title="7. Safeguarding responsibilities">
          <p>ChurchCompass provides tools to assist with safeguarding (DBS record tracking, incident logging, children's check-in). These tools do not replace your organisation's legal safeguarding obligations.</p>
          <p style={{ marginTop: 10 }}>You remain fully responsible for:</p>
          <ul style={{ paddingLeft: 20, margin: '10px 0 0' }}>
            <li style={{ marginBottom: 8 }}>Maintaining a current safeguarding policy appropriate for your organisation.</li>
            <li style={{ marginBottom: 8 }}>Ensuring DBS checks are obtained and renewed in accordance with applicable guidance.</li>
            <li style={{ marginBottom: 8 }}>Reporting incidents to appropriate authorities as required by law.</li>
          </ul>
          <p style={{ marginTop: 10 }}>We provide record-keeping tools in good faith but accept no liability for safeguarding failures.</p>
        </Section>

        <Section title="8. Giving and financial records">
          <p>ChurchCompass provides a Giving module for churches to record donations internally. We are not a payment processor and do not handle or transmit actual donation funds.</p>
          <p style={{ marginTop: 10 }}>Gift Aid claims are the sole responsibility of the church. ChurchCompass provides estimated Gift Aid values as a convenience. You must verify all figures with HMRC before making a claim.</p>
        </Section>

        <Section title="9. Availability and uptime">
          <p>We aim to keep ChurchCompass available at all times but do not guarantee uninterrupted access. We may carry out maintenance, upgrades, or experience outages. We will endeavour to give advance notice of planned downtime where possible.</p>
          <p style={{ marginTop: 10 }}>ChurchCompass is provided "as is". We do not warrant that the service will be error-free or meet any specific requirements.</p>
        </Section>

        <Section title="10. Limitation of liability">
          <p>To the fullest extent permitted by law, Elmoril Ltd shall not be liable for:</p>
          <ul style={{ paddingLeft: 20, margin: '10px 0 0' }}>
            <li style={{ marginBottom: 8 }}>Loss of data, revenue, or profits arising from use of ChurchCompass.</li>
            <li style={{ marginBottom: 8 }}>Any indirect or consequential loss.</li>
            <li style={{ marginBottom: 8 }}>Loss arising from your failure to maintain appropriate backups.</li>
            <li style={{ marginBottom: 8 }}>Any breach of your data protection or safeguarding obligations.</li>
          </ul>
          <p style={{ marginTop: 10 }}>Our total liability to you in any 12-month period shall not exceed the total subscription fees you paid to us in that period.</p>
          <p style={{ marginTop: 10 }}>Nothing in these terms limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.</p>
        </Section>

        <Section title="11. Intellectual property">
          <p>ChurchCompass, including all software, design, and content, is owned by Elmoril Ltd. These terms do not grant you any rights to our intellectual property.</p>
          <p style={{ marginTop: 10 }}>Your church's data (member records, attendance, giving records, etc.) remains yours. You may export your data at any time using the export functions in the platform. On account closure, we will retain data for 30 days before deletion, during which you may request an export.</p>
        </Section>

        <Section title="12. Changes to these terms">
          <p>We may update these terms from time to time. We will notify registered church admins by email at least 14 days before material changes take effect. Continued use of ChurchCompass after the effective date constitutes acceptance of the revised terms.</p>
        </Section>

        <Section title="13. Termination">
          <p>We may suspend or terminate your account if you breach these terms, fail to pay subscription fees, or if we decide to discontinue the service. We will give reasonable notice where possible. On termination, your data will be retained for 30 days and then deleted.</p>
          <p style={{ marginTop: 10 }}>You may delete your account at any time by contacting <strong>hello@elmorilx.com</strong>.</p>
        </Section>

        <Section title="14. Governing law">
          <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
        </Section>
      </div>

      <footer style={{ background: '#0f1f35', padding: '20px 32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
        ChurchCompass — free church management · by Elmoril · elmorilx.com
      </footer>
    </div>
  );
}
