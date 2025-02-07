import { Accordion, Container, Space, Title } from "@mantine/core";
import classes from "./PremiumFAQ.module.css";

const questions = [
  {
    question: "What is Premium?",
    answer:
      "GiveawayBot Premium is a subscription that unlocks the full potential of GiveawayBot. With Premium, you can run longer giveaways, have more winners, and unlock more features to supercharge your giveaways!",
  },
  {
    question: "What happens when I cancel?",
    answer:
      "If you cancel your subscription, you will continue to have access to Premium until the end of your billing period. After that, you will lose access to Premium features.",
  },
  {
    question: "How many servers does my subscription cover?",
    answer:
      "A single Premium subscription will only cover one server. If you want to use Premium on multiple servers, you will need to purchase a subscription for each server.",
  },
];

export const PremiumFAQ = () => {
  const items = questions.map((item) => (
    <Accordion.Item
      key={item.question}
      value={item.question}
      className={classes.item}
    >
      <Accordion.Control>{item.question}</Accordion.Control>
      <Accordion.Panel>{item.answer}</Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <Container className={classes.wrapper}>
      <Title className={classes.title}>Frequently Asked Questions</Title>
      <Space h="lg" />
      <Accordion className={classes.accordion} multiple variant="contained">
        {items}
      </Accordion>
    </Container>
  );
};
