import { Icon } from "./Icon";

type Status = "VALID" | "REVOKED" | "NEUTRAL" | "PENDING";

export function StatusBadge({ status, children }: { status: Status; children?: string }) {
  const labels: Record<Status, string> = {
    VALID: "Verified",
    REVOKED: "Revoked",
    NEUTRAL: "On-chain",
    PENDING: "Pending",
  };
  const icon = status === "VALID" ? "check" : status === "REVOKED" ? "warning" : "network";

  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      <Icon name={icon} />
      {children || labels[status]}
    </span>
  );
}
