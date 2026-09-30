import { useSyncExternalStore } from "react";

/** true only on the client; avoids SSR/client tree mismatch without setState-in-effect. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
