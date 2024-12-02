import type { MetaFunction } from "react-router";
import { LandingClosing } from "~/components/LandingClosing/LandingClosing";
import { LandingFeatures } from "~/components/LandingFeatures/LandingFeatures";
import { LandingHero } from "~/components/LandingHero/LandingHero";
import { LandingTestimonials } from "~/components/LandingTestimonials/LandingTestimonials";

export const meta: MetaFunction = () => {
  return [
    { title: "Mantine Remix App" },
    { name: "description", content: "Welcome to Mantine!" },
  ];
};

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
