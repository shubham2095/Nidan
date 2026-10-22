import {
  Activity, Baby, Building2, Dumbbell, FlaskConical, HeartHandshake, HeartPulse, Pill,
  ScanHeart, Scissors, ShieldPlus, Smile, Sparkles, Sprout, Stethoscope, Syringe, Users,
} from 'lucide-react';

// Icon names are stored in the database (services, specialties, why-choose-us), so they map to components here.
const ICONS = {
  activity: Activity,
  baby: Baby,
  'building-2': Building2,
  dumbbell: Dumbbell,
  'flask-conical': FlaskConical,
  'heart-handshake': HeartHandshake,
  'heart-pulse': HeartPulse,
  pill: Pill,
  'scan-heart': ScanHeart,
  scissors: Scissors,
  'shield-plus': ShieldPlus,
  smile: Smile,
  sparkles: Sparkles,
  sprout: Sprout,
  stethoscope: Stethoscope,
  syringe: Syringe,
  users: Users,
};

export default function Icon({ name, ...props }) {
  const Component = ICONS[name] || Stethoscope;
  return <Component aria-hidden="true" {...props} />;
}
