// The exact Google Maps listings of the two clinics, taken from the "Embed a map" code Google gives for each one.
//  - embedUrl: the map shown on the website (the src of Google's iframe)
//  - mapUrl:   the link behind "Get directions"; it opens the same listing (cid = the listing's number in Google Maps)
// Used by the seeders so a new database and an existing one end up with the same maps. Staff can change either one
// in Admin > Locations.
const SECTOR_51 = {
  embedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.8058936524444!2d77.36461360000001!3d28.5755909!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce590901ee353%3A0x77cc1469062402d2!2sDr%20Rajeev%20Ranjan%20-%20Best%20Pediatrician%20and%20Child%20Specialist%20in%20Noida%20%7C%20Child%20Specialist!5e0!3m2!1sen!2sin!4v1792936326683!5m2!1sen!2sin',
  mapUrl: 'https://www.google.com/maps?cid=8632297027069543122',
};

const GAUR_CITY = {
  embedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.728228701706!2d77.4255795!3d28.6079288!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cefecd12d7ecd%3A0xe3745d1d36820c86!2sNidan%20Mother%20%26%20Child%20Care!5e0!3m2!1sen!2sin!4v1792936028487!5m2!1sen!2sin',
  mapUrl: 'https://www.google.com/maps?cid=16389827323958004870',
};

module.exports = {
  'nidan-sector-51': SECTOR_51,
  'nidan-gaur-city': GAUR_CITY,
};
