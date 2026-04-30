import {
  Avatar,
  Card,
  Container,
  Flex,
  Group,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

import classes from "./LandingTestimonials.module.css";

const testimonials = [
  {
    name: "John",
    guild: "John's Server",
    avatar: "https://cdn.discordapp.com/embed/avatars/2.png",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl nec ultricies ultricies, nunc nisl ultricies nunc, nec ultricies nunc nisl nec nunc.",
  },
  {
    name: "Jane",
    guild: "Jane's Server",
    avatar: "https://cdn.discordapp.com/embed/avatars/3.png",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl nec ultricies ultricies, nunc nisl ultricies nunc, nec ultricies nunc nisl nec nunc.",
  },
  {
    name: "Alice",
    guild: "Alice's Server",
    avatar: "https://cdn.discordapp.com/embed/avatars/4.png",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl nec ultricies ultricies, nunc nisl ultricies nunc, nec ultricies nunc nisl nec nunc.",
  },
  {
    name: "Bob",
    guild: "Bob's Server",
    avatar: "https://cdn.discordapp.com/embed/avatars/5.png",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl nec ultricies ultricies, nunc nisl ultricies nunc, nec ultricies nunc nisl nec nunc.",
  },
];

export function LandingTestimonials() {
  const { t } = useTranslation();

  const testimonialsList = testimonials.map((testimonial) => (
    <Card
      key={testimonial.name}
      shadow="md"
      radius="md"
      className={classes.card}
      padding="xl"
    >
      <Group>
        <Avatar src={testimonial.avatar} alt={testimonial.name} radius="xl" />
        <Flex direction="column">
          <Text fz="lg" fw={500} className={classes.cardTitle}>
            {testimonial.name}
          </Text>
          <Text fz="sm" c="dimmed">
            {testimonial.guild}
          </Text>
        </Flex>
      </Group>
      <Text fz="sm" mt="md">
        {testimonial.text}
      </Text>
    </Card>
  ));

  return (
    <Container className={classes.wrapper}>
      <Title className={classes.title}>{t("landing.testimonials.title")}</Title>
      <Container size={560} p={0}>
        <Text size="sm" className={classes.description}>
          {t("landing.testimonials.description")}
        </Text>
      </Container>
      <SimpleGrid
        mt={60}
        cols={{ base: 1, sm: 2 }}
        spacing="xl"
        verticalSpacing="xl"
      >
        {testimonialsList}
      </SimpleGrid>
    </Container>
  );
}
