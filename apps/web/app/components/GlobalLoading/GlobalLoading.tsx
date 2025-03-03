import { nprogress } from "@mantine/nprogress";
import { useEffect, useMemo } from "react";
import { useNavigation } from "react-router";

const messages = [
  "Thinking about the meaning of life",
  "Contemplating the universe",
  "Waiting for the stars to align",
  "Imagining what it would be like to be a cat",
  "Calculating the meaning of life",
  "Wondering if the universe is a simulation",
  "Asking the universe for answers",
];

export function GlobalLoading({ children }: { children: React.ReactNode }) {
  const navigationTransition = useNavigation();
  const active = navigationTransition.state !== "idle";
  // const active = true;

  useEffect(() => {
    if (active) {
      nprogress.start();
    } else {
      nprogress.complete();
    }
  }, [active]);

  const loadingLine = useMemo(() => {
    const line = messages[Math.floor(Math.random() * messages.length)];
    return line + "...";
  }, []);

  // return (
  //   <Box
  //     pos="relative"
  //     role="progressbar"
  //     aria-valuetext={active ? "Loading" : undefined}
  //     aria-hidden={!active}
  //   >
  //     <LoadingOverlay
  //       visible={active}
  //       zIndex={1000}
  //       overlayProps={{ radius: "sm", blur: 2 }}
  //       loaderProps={{
  //         children: (
  //           <Stack h={300} align="center" justify="center" gap="md">
  //             <Box>
  //               <Loader />
  //             </Box>
  //             <Box>{loadingLine}</Box>
  //           </Stack>
  //         ),
  //       }}
  //     />
  //     {children}
  //   </Box>
  // );
  return <>{children}</>;
}
