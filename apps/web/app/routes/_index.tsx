import { LandingClosing } from "~/components/Landing/LandingClosing/LandingClosing";
import { LandingFeatures } from "~/components/Landing/LandingFeatures/LandingFeatures";
import { LandingHero } from "~/components/Landing/LandingHero/LandingHero";
import { LandingTestimonials } from "~/components/Landing/LandingTestimonials/LandingTestimonials";

export default function Index() {
  return (
    <div>
      <LandingHero />
      <LandingFeatures />
      <LandingTestimonials />
      <LandingClosing />
    </div>
  );
}
