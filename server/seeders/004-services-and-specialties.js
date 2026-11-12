const { createOnce } = require('../utils/seedHelpers');

// `icon` is a lucide-react icon name used by the public site.
const services = [
  {
    slug: 'maternity',
    name: 'Maternity',
    icon: 'baby',
    shortDescription: 'Caring, personalised support through pregnancy, delivery and the early weeks with your newborn.',
    description:
      '<p>Pregnancy is a special journey, and you deserve care that feels personal at every step. Our maternity services include regular antenatal check-ups, guidance for a healthy pregnancy and support for a safe delivery, with a focus on vaginal deliveries wherever it is medically appropriate.</p>' +
      '<p>After delivery, we continue to look after you and your baby with postnatal check-ups and newborn care from our paediatric team.</p>',
  },
  {
    slug: 'neonatology',
    name: 'Neonatology',
    icon: 'heart-pulse',
    shortDescription: 'Specialised care for newborns, including babies who need extra attention in their first days.',
    description:
      '<p>The first days of life matter. Our neonatology care is led by a Consultant Paediatrician & Neonatologist and focuses on the health, feeding and growth of newborn babies.</p>' +
      '<p>We guide parents through newborn care, answer your questions and make sure your baby gets the right support from day one.</p>',
  },
  {
    slug: 'gynaecology',
    name: 'Gynaecology',
    icon: 'stethoscope',
    shortDescription: 'Compassionate care for women at every stage of life.',
    description:
      "<p>From adolescence through to menopause, our gynaecology services cover women's health concerns with privacy, respect and clear explanations.</p>",
  },
  {
    slug: 'fertility-ivf',
    name: 'Fertility & IVF',
    icon: 'sprout',
    shortDescription: 'Guidance and treatment for couples who are finding it hard to conceive.',
    description:
      '<p>Planning a family can be emotional, and you do not have to go through it alone. We offer evaluation, counselling and treatment options for couples facing difficulty in conceiving, including IUI and other fertility treatments.</p>' +
      '<p>Your care plan is shaped around you, with honest guidance at every step.</p>',
  },
  {
    slug: 'neonatal-icu',
    name: 'Neonatal ICU',
    icon: 'activity',
    shortDescription: 'Intensive care support for newborns who need close monitoring and specialised treatment.',
    description:
      '<p>Some babies need extra support in their first days or weeks. Neonatal intensive care provides close monitoring and specialised treatment for newborns who are premature or unwell.</p>' +
      '<p>Our team keeps parents informed and involved throughout.</p>',
  },
  {
    slug: 'fetal-medicine',
    name: 'Fetal Medicine',
    icon: 'scan-heart',
    shortDescription: "Monitoring and assessment of your baby's health and development during pregnancy.",
    description:
      "<p>Fetal medicine focuses on how your baby is growing and developing before birth. Scans and assessments help your doctor plan the safest care for you and your baby throughout pregnancy.</p>",
  },
  {
    slug: 'general-and-laparoscopic-surgery',
    name: 'General & Laparoscopic Surgery',
    icon: 'scissors',
    shortDescription: 'Surgical care, including minimally invasive (laparoscopic) procedures.',
    description:
      '<p>When surgery is needed, we aim to make the experience as safe and comfortable as possible. Our surgical services include general surgery and laparoscopic (keyhole) procedures, where appropriate.</p>',
  },
  {
    slug: 'paediatrics',
    name: 'Paediatrics',
    icon: 'smile',
    shortDescription: 'Complete healthcare for children, from routine check-ups to vaccinations and common illnesses.',
    description:
      '<p>Our paediatric services look after your child from infancy through adolescence. These include routine check-ups, growth and development monitoring, child vaccinations and care for common childhood conditions.</p>' +
      '<p>We take time to listen to parents and explain every step in simple language.</p>',
  },
  {
    slug: 'physiotherapy',
    name: 'Physiotherapy',
    icon: 'dumbbell',
    shortDescription: 'Gentle, guided physiotherapy to help you recover and stay active.',
    description:
      '<p>Physiotherapy helps you recover strength and movement. Sessions are planned around your needs and comfort.</p>',
  },
  {
    slug: 'pcod-lifestyle-management',
    name: 'PCOD & Lifestyle Management',
    icon: 'pill',
    shortDescription: 'Personalized care for PCOD, combining medical treatment with diet, exercise and lifestyle guidance.',
    description:
      '<p>PCOD is a common hormonal condition that can cause irregular periods, weight gain, acne and difficulty getting pregnant. Simple lifestyle changes, such as balanced eating, regular exercise, good sleep and stress control, can greatly improve symptoms. Our gynaecologist creates a personalised plan for you, combining lifestyle guidance with medical treatment when needed. Book a consultation today for caring, confidential PCOD support.</p>',
  },
  {
    slug: 'antenatal-classes',
    name: 'Antenatal Classes',
    icon: 'users',
    shortDescription: 'Preparing expectant mothers for pregnancy, birth and life with a newborn.',
    description:
      '<p>Antenatal classes help you feel informed and confident about pregnancy, labour and caring for your newborn.</p>',
  },
  {
    slug: 'lactation',
    name: 'Lactation',
    icon: 'heart-handshake',
    shortDescription: 'Support and guidance for mothers with breastfeeding.',
    description:
      '<p>Breastfeeding can take time and practice. Our lactation support helps mothers and babies get started and gives practical help with common feeding concerns.</p>',
  },
  {
    slug: 'menopause-clinic',
    name: 'Menopause Clinic',
    icon: 'scan-heart',
    shortDescription: 'Expert care and support to help women manage menopause symptoms and stay healthy.',
    description:
      "<p>Menopause is a natural stage in a woman's life, but symptoms like hot flushes, night sweats, mood changes, poor sleep and irregular periods can affect daily life. Our menopause clinic offers personalised care, including symptom relief, lifestyle guidance and screening for bone health and heart health. Our gynaecologist helps you understand your options and feel your best through this transition. Book a consultation today for caring, confidential support.</p>",
  },
  {
    slug: 'endometriosis-care',
    name: 'Endometriosis Care',
    icon: 'heart-pulse',
    shortDescription: 'Diagnosis and personalised treatment to relieve endometriosis pain and protect fertility.',
    description:
      '<p>Endometriosis is a condition where tissue similar to the lining of the uterus grows outside it, often causing painful periods, pelvic pain, pain during intercourse and difficulty getting pregnant. Early diagnosis through a detailed consultation, examination and ultrasound helps us plan the right care for you. Treatment may include pain relief, hormonal therapy, fertility support or surgery when needed, based on your symptoms and goals. Book a consultation today for caring, confidential endometriosis support.</p>',
  },
];

const specialties = [
  {
    title: 'Child Vaccinations',
    icon: 'syringe',
    description: "Keeping your child protected with timely vaccinations, guided by a paediatrician and a clear schedule you can follow.",
  },
  {
    title: 'Infertility Treatments',
    icon: 'sprout',
    description: 'Evaluation, counselling and treatments such as IUI for couples hoping to start or grow their family.',
  },
  {
    title: 'High-Risk Pregnancy Care',
    icon: 'shield-plus',
    description: 'Closer monitoring and extra support for pregnancies that need additional attention, for you and your baby.',
  },
  {
    title: 'Vaginal Deliveries',
    icon: 'baby',
    description: 'Supportive, patient-centred care for women planning a vaginal delivery whenever it is medically appropriate.',
  },
  {
    title: 'Laparoscopic Surgeries',
    icon: 'scissors',
    description: 'Minimally invasive surgery, where suitable, for gentler procedures and a smoother recovery.',
  },
  {
    title: 'Laboratory Services',
    icon: 'flask-conical',
    description: 'Convenient diagnostic tests to support timely, accurate decisions about your care.',
  },
];

module.exports = {
  async up({ models: { Service, Specialty } }) {
    for (const [index, { slug, ...values }] of services.entries()) {
      await createOnce(Service, { slug }, { ...values, sortOrder: index + 1 });
    }
    for (const [index, { title, ...values }] of specialties.entries()) {
      await createOnce(Specialty, { title }, { ...values, sortOrder: index + 1 });
    }
  },
};
