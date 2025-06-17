import { nprogress } from "@mantine/nprogress";
import { useEffect } from "react";
import { useNavigation } from "react-router";

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
