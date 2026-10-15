export function titleCase(input?: string) {
  if (!input) return "";
  return input
    .split(" ")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}
