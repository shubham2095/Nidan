import Container from '../../components/public/Container.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Seo from '../../components/public/Seo.jsx';
import { useSite } from '../../context/SiteContext.jsx';

// Plain-language summary written for the DPDP Act. TODO: have the clinic's legal adviser review it
// and fill in the retention period before launch.
export default function PrivacyPolicyPage() {
  const { clinic } = useSite();

  return (
    <>
      <Seo title="Privacy Policy" description={`How ${clinic.name} collects, uses and protects your personal information.`} />
      <PageHeader title="Privacy Policy" crumbs={[{ label: 'Privacy Policy' }]} />
      <Container className="max-w-3xl py-14">
        <div className="rich-text">
          <p>
            {clinic.name} respects your privacy. This page explains, in simple words, what information we collect through this website,
            why we collect it and how we look after it.
          </p>

          <h2>What we collect</h2>
          <p>
            Only what we need to help you: your name, phone number, email (optional), the reason for your visit or enquiry and, for
            children, their date of birth and a guardian&apos;s name. We do not ask for anything we do not need.
          </p>

          <h2>Why we collect it</h2>
          <ul>
            <li>To book, confirm and manage your appointment.</li>
            <li>To reply to your enquiry or review.</li>
            <li>To remind you about follow-up visits and vaccinations, if you are a patient.</li>
          </ul>

          <h2>Your consent</h2>
          <p>
            We collect your details only after you tick the consent box on our forms. You can withdraw your consent at any time by
            contacting us.
          </p>

          <h2>Who can see it</h2>
          <p>
            Only authorised staff of {clinic.name} can see your details, and doctors can see their own patients&apos; records. We
            never sell your information and we do not show patient information on the public website.
          </p>

          <h2>How long we keep it</h2>
          <p>TODO: the clinic to confirm how long appointment and patient records are kept.</p>

          <h2>Your rights</h2>
          <p>
            You may ask to see, correct or delete your information, or withdraw your consent. Email us at{' '}
            <a href={`mailto:${clinic.email}`}>{clinic.email}</a> or call {clinic.phonePrimary}.
          </p>
        </div>
      </Container>
    </>
  );
}
