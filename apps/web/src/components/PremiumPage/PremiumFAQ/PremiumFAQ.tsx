import { Accordion, Container, Space, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import classes from "./PremiumFAQ.module.css";

const questionKeys = [
  {
    questionKey: "premium.faq.whatIsPremium.question" as const,
    answerKey: "premium.faq.whatIsPremium.answer" as const,
  },
  {
    questionKey: "premium.faq.whatHappensWhenCancel.question" as const,
    answerKey: "premium.faq.whatHappensWhenCancel.answer" as const,
  },
  {
    questionKey: "premium.faq.howManyServers.question" as const,
    answerKey: "premium.faq.howManyServers.answer" as const,
  },
];

export const PremiumFAQ = () => {
  const { t } = useTranslation();

  const items = questionKeys.map((item) => (
    <Accordion.Item
      key={item.questionKey}
      value={item.questionKey}
      className={classes.item}
    >
      <Accordion.Control>{t(item.questionKey)}</Accordion.Control>
      <Accordion.Panel>{t(item.answerKey)}</Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <Container className={classes.wrapper}>
      <Title className={classes.title}>{t("premium.faq.title")}</Title>
      <Space h="lg" />
      <Accordion className={classes.accordion} multiple variant="contained">
        {items}
      </Accordion>
    </Container>
  );
};
