// Structured data (schema.org) so search engines can show rich results for the clinic and its doctors.

const postalAddress = (location) => ({
  '@type': 'PostalAddress',
  streetAddress: location.address,
  addressLocality: location.city,
  addressRegion: location.state,
  ...(location.postalCode && { postalCode: location.postalCode }),
  addressCountry: 'IN',
});

const sameAs = (social = {}) => Object.values(social).filter(Boolean);

export function clinicJsonLd({ clinic, social, ownClinics }, origin) {
  const [main] = ownClinics;
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    '@id': `${origin}/#clinic`,
    name: clinic.name,
    description: clinic.tagline,
    url: origin,
    telephone: clinic.phonePrimary,
    email: clinic.email,
    medicalSpecialty: ['Obstetric', 'Gynecologic', 'Pediatric', 'Neonatal'],
    ...(main && { address: postalAddress(main) }),
    ...(ownClinics.length && {
      location: ownClinics.map((location) => ({
        '@type': 'Place',
        name: location.name,
        address: postalAddress(location),
        ...(location.mapUrl && { hasMap: location.mapUrl }),
      })),
    }),
    sameAs: sameAs(social),
  };
}

export function physicianJsonLd(doctor, { clinic, ownClinics }, origin) {
  const specialty = /paediatric/i.test(doctor.designation) ? 'Pediatric' : 'Gynecologic';
  const primary = doctor.schedules[0]?.location || ownClinics[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.name,
    url: `${origin}/doctors/${doctor.slug}`,
    description: `${doctor.designation}. ${doctor.qualifications}.`,
    medicalSpecialty: specialty,
    ...(doctor.photoUrl && { image: new URL(doctor.photoUrl, origin).href }),
    telephone: clinic.phonePrimary,
    worksFor: { '@id': `${origin}/#clinic` },
    ...(primary && { address: postalAddress(primary) }),
  };
}

export function articleJsonLd(post, { clinic }, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    url: `${origin}/blog/${post.slug}`,
    ...(post.coverImageUrl && { image: new URL(post.coverImageUrl, origin).href }),
    author: { '@type': post.authorName ? 'Person' : 'Organization', name: post.authorName || clinic.name },
    publisher: { '@type': 'Organization', name: clinic.name },
  };
}
