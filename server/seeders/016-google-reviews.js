const { createOnce } = require('../utils/seedHelpers');

// Reviews that patients posted publicly on the clinic's Google listing, copied word for word (spelling included).
// Google's pasted text carried no star ratings, so none are shown rather than guessing them.
// Left out on purpose: reviews with no text, one that thanks another hospital, one that names a different doctor,
// one that is only a translation error ("Go"), and one that describes a surgery in detail (private health information).
// Staff can hide, reorder or edit any of them in Admin > Testimonials.
const reviews = [
  {
    name: 'Sidharth Mohan',
    content:
      'Outstanding Care at Nidan Mother & Child Care with Dr. Manisha Ranjan!\n\n' +
      "We are absolutely thrilled to share our positive experience at Nidan Mother & Child Care! Choosing to consult Dr. Manisha Ranjan for my wife's pregnancy, from the very beginning until delivery, was one of the best decisions we made.\n\n" +
      'Dr. Manisha Ranjan is truly exceptional gynecologist. She is highly professional, yet incredibly warm and patient. Throughout the entire journey, she took the time to address all our questions and doubts, providing clarity and reassurance every step of the way. Thanks to her expert guidance and supportive approach, my wife was able to have a successful normal delivery, and we are immensely grateful for her care.\n\n' +
      'The experience at the clinic was wonderful overall. The entire staff at Nidan Mother & Child Care is remarkably friendly and kind. We were consistently greeted with a smile, which created a welcoming and comforting atmosphere during every visit.\n\n' +
      'We feel very fortunate to have been under the care of Dr. Manisha Ranjan. We highly recommend Nidan Mother & Child Care to any expecting parents looking for top-tier, compassionate, and professional care!',
  },
  {
    name: 'Priyansh Setia',
    content:
      'We regularly visit for our child’s vaccinations and routine checkups with Dr. Rajeev Ranjan. The wait time is always minimal, and the doctor is extremely attentive and caring.',
  },
  {
    name: 'Ashwani Sharma',
    content:
      "Great experience.\nMy kid's frequent illness is over now.\nLess midication and fruitful suggestions.\nEventhough he is an alopathic doctor but his suggestions are always focuses on natural diet and home made remedies to keep your kid healthy.",
  },
  {
    name: 'Rajeev Gangwar',
    content:
      "Great experience at Nidan Mother and Child Care Clinic, Sector 51. I visited for vaccination of my 6 months' daughter. Doctor is very experienced, knowledgeable and caring, staff is polite, and the clinic is clean and well-managed. Highly recommend!",
  },
  {
    name: 'Prabhat Kushwah',
    content:
      'We feel truly blessed to have been under the care of Dr. Manisha during our entire pregnancy journey. From the very first visit till the delivery, she guided us with so much patience, love, and genuine care. She always suggested what was best for both mother and baby and ensured every step was taken with complete confidence and comfort.\n\n' +
      'Her regular monitoring and detailed check-ups gave us immense peace of mind throughout. What makes her truly special is her 24×7 availability — no matter what time we called or messaged, she was always there to respond and guide us calmly. That kind of dedication is truly rare and priceless.\n\n' +
      'Dr. Manisha continuously motivated both of us — not just medically, but emotionally as well. Her positive words, constant encouragement, and motherly approach made this journey so beautiful and stress-free.\n\n' +
      'She is undoubtedly one of the best gynecologists in Noida and Greater Noida, especially when it comes to normal deliveries and personalized care. We had an excellent experience with her and will forever be thankful for the warmth and support she provided.\n\n' +
      'Highly recommend Dr. Manisha to every expecting couple — she’s not just a doctor, she’s a blessing in this journey of parenthood. 💕',
  },
  {
    name: 'Shalini Joshi',
    content:
      'Dr. Manisha Ranjan is truly an exceptional gynecologist!!\n' +
      'There are no words to express how grateful we are for the incredible support she gave us. She felt like family throughout our pregnancy and delivery.\n' +
      'She took her time to break down each phase of pregnancy in clear terms, ensuring we felt comfortable and understood what to expect. Her knowledge and expertise were evident in every consultation, and she always made sure to address all our questions and concerns with patience and clarity.\n' +
      'As the due date approached, I felt confident and prepared for the birth, all thanks to her detailed guidance and support. She skillfully handled any challenges that came up, demonstrating her deep knowledge and experience. Her ability to make quick, informed decisions ensured that everything progressed smoothly and safely.\n' +
      'Thanks to her expertise, I was able to have a smooth and successful normal vaginal delivery.\n' +
      'We are deeply thankful for the personalized care and attention we received from Dr. Manisha Ranjan. Her dedication to her patients is truly remarkable, and we highly recommend her to anyone seeking a compassionate and knowledgeable gynecologist for their pregnancy journey.\n' +
      "Thank you, Manisha ma'am, for making this experience so positive and memorable!",
  },
  {
    name: 'Laxmi Mahato',
    content:
      'Dr Rajeev Ranjan is a great pediatrician. He would listen to all the concern one would have and then patiently answer. I visited her for my baby vaccination and she clear all the questions we had . Thank you mam for all your good work .I highly recommend Dr Rajeev.\n\n' +
      'Thanks Doctor and your Staff',
  },
  {
    name: 'Deepak Tripathi',
    content:
      'He is one of the best doctors in the vicinity. He listens to the parent patiently and advices the best medical treatment for the little ones. Highly recommended.',
  },
  {
    name: 'Sujit Singh',
    content:
      'Best child specialist as I went for vaccination of my baby. He helped to get lot of information about growth and development.he is great doctor.',
  },
  {
    name: 'Seventh Wonder',
    content:
      'We are writing to express our heartfelt gratitude to Manisha Ranjan ma’am for her exceptional care and expertise in delivering our precious baby and bringing happiness in our incomplete world. Words can not adequately convey the depths of our appreciation for the role she played in this momentous occasion. Based on our history and challenges during pregnancy, Manisha Ranjan has advised us with the right course of approach for successful pregnancy, which we had followed with positive results. Her unwavering support and guidance throughout the pregnancy journey provided us with immense comfort and confidence. She has been very mindful and co-operative to us and made us feel secure every step of the way. Under her thoughtful guidance, we always experienced that our journey is on the right track. The day of our baby\'s arrival will forever be etched in our memories, and we are immensely grateful for her skilled hands and expertise in ensuring a safe and successful delivery. We would also like to extend our gratitude to the incredible team of nurses and support staff who worked tirelessly alongside you. Our closed family also had a history of two successful deliveries in the past. We consider doctor Manisha Ranjan as one of the best gynecologists in NCR without doubt. Our best wishes and regards to Manisha Ranjan and pray for her healthy long life so that she continues to enlighten many more families with more success stories. Lots to love from our family and little one. ❤️ ♥️ 💙 💕 💓 💖',
  },
  {
    name: 'Tenzin Spidey',
    content:
      'I had a good experience here. Dr. Ranjan was so polite and sincere with all the checkups. I would say one of the best gynaecologist in Delhi NCR. I highly recommend her.',
  },
  { name: 'Anjali Verma', content: 'Best child specialist. Doctors are very nice and polite.' },
  { name: 'Naveen Kumar', content: 'caring, experienced and good doctors over there.' },
  { name: 'Suman Singh', content: 'Best clinic in Noida Dr are also good for care' },
  { name: 'Mukesh Kumar', content: 'excellent services and very knowledgeable doctor' },
  { name: 'Anjulika Baa', content: 'I highly recommend her to anyone looking for a gynacologist.' },
  { name: 'Shivi Agrawal', content: 'Gycnee doctor are very nice. They are very polite and great service' },
  { name: 'Kishan Kumar', content: 'Very good doctor and staff....' },
  { name: 'Shivam Bharti', content: 'Best doctor in noida' },
];

module.exports = {
  async up({ models: { Testimonial } }) {
    for (const [index, { name, content }] of reviews.entries()) {
      // sortOrder keeps the strongest, most varied reviews first, which is what the home page slider shows
      await createOnce(Testimonial, { name, source: 'google' }, { content, label: 'Google review', status: 'approved', sortOrder: index + 1 });
    }
  },
};
