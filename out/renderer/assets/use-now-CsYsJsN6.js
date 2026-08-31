import { r as reactExports } from "./lucide-react-Cs1Usobv.js";
function useNow(active = true, intervalMs = 1e3) {
  const [now, setNow] = reactExports.useState(() => Date.now());
  reactExports.useEffect(() => {
    if (!active) {
      return;
    }
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [active, intervalMs]);
  return now;
}
export {
  useNow as u
};
