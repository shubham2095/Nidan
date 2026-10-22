const { createOnce } = require('../utils/seedHelpers');

// Starter questions for the home page. Written from what the website and clinic already do; the clinic should read
// them once and adjust (Site settings > Frequently asked questions). Plain text only.
const faq = [
  {
    question: 'How do I book an appointment?',
    answer:
      'The quickest way is to book online: choose the doctor, the clinic, a day and a time that suits you, and add a few details. You can also call us or send a WhatsApp message and our team will book it for you.',
  },
  {
    question: 'Is my appointment confirmed straight away?',
    answer:
      'Online bookings reach our team as a request, and you will see "Awaiting confirmation" on the screen. Our team then confirms it, and if you shared an email address we send you a confirmation. If you need a visit sooner, please call us.',
  },
  {
    question: 'Which doctors can I see, and where?',
    answer:
      'Dr. Manisha Ranjan is our Obstetrician and Gynaecologist, and Dr. Rajeev Ranjan is our Paediatrician and Neonatologist. Both see patients at our clinic in Sector 51, Noida. Our opening hours and address are on this page and on the Contact page, and you can pick a day and time in the booking steps.',
  },
  {
    question: "Do you give children's vaccinations?",
    answer:
      "Yes. Child vaccination is one of the things we are known for, and Dr. Rajeev Ranjan looks after children's health from the day they are born. Ask our team about the schedule for your child's age when you book.",
  },
  {
    question: 'Can I change or cancel my appointment?',
    answer:
      'Yes. Please call us or send a WhatsApp message as early as you can, with your name and booking ID, and our team will move or cancel it for you.',
  },
  {
    question: 'What should I bring to the first visit?',
    answer:
      'Please bring any earlier reports, scans and prescriptions. For a child, bring the vaccination card if you have one. If you are pregnant, bring your antenatal records.',
  },
  {
    question: 'Is my personal information kept private?',
    answer:
      'We only ask for the details we need to book and look after your visit, and we look after them carefully. The full details are on our Privacy Policy page.',
  },
];

module.exports = {
  async up({ models: { Setting } }) {
    await createOnce(Setting, { settingKey: 'faq' }, { settingValue: faq });
  },
};
