import type { SVGProps } from "react";

type IconName =
  | "arrowRight"
  | "certificate"
  | "check"
  | "close"
  | "copy"
  | "external"
  | "key"
  | "menu"
  | "network"
  | "plus"
  | "refresh"
  | "search"
  | "shield"
  | "wallet"
  | "warning";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

/** Small, dependency-free icon set for the application interface. */
export function Icon({ name, ...props }: IconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };

  switch (name) {
    case "shield":
      return <svg {...common}><path d="M12 3 4.5 6.2v5.1c0 4.6 3.1 8.8 7.5 9.7 4.4-.9 7.5-5.1 7.5-9.7V6.2L12 3Z" /><path d="m8.8 12 2.1 2.1 4.4-4.4" /></svg>;
    case "certificate":
      return <svg {...common}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M7 8h6M7 12h4M16 18l-2 3-2-3" /></svg>;
    case "wallet":
      return <svg {...common}><path d="M20 7V5.6A1.6 1.6 0 0 0 18.4 4H5.6A2.6 2.6 0 0 0 3 6.6v10.8A2.6 2.6 0 0 0 5.6 20h12.8a1.6 1.6 0 0 0 1.6-1.6V17" /><path d="M3 8h15.4A1.6 1.6 0 0 1 20 9.6v4.8a1.6 1.6 0 0 1-1.6 1.6h-3.8a2.6 2.6 0 0 1 0-5.2H20" /><circle cx="14.5" cy="13.4" r=".5" fill="currentColor" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
    case "key":
      return <svg {...common}><circle cx="8.5" cy="15.5" r="3.5" /><path d="m11 13 8-8M16 6l2 2m-4-4 2 2" /></svg>;
    case "network":
      return <svg {...common}><circle cx="12" cy="4.5" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="m10.8 6.1-4.5 10M13.2 6.1l4.5 10M7 18h10" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "arrowRight":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "external":
      return <svg {...common}><path d="M14 4h6v6M20 4l-9 9" /><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" /></svg>;
    case "copy":
      return <svg {...common}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
    case "refresh":
      return <svg {...common}><path d="M20 11a8 8 0 0 0-14.8-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M21 19v-5h-5" /></svg>;
    case "warning":
      return <svg {...common}><path d="M10.3 4.2 2.7 17.1A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.9L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16.5h.01" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4.2 4.2L19 6.5" /></svg>;
    case "close":
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "menu":
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  }
}
