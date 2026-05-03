export function formatLatency(ms?: number): string {
  if (ms == null) return "-";
  return `${ms}ms`;
}

export function formatMemory(usedMb?: number, totalMb?: number): string {
  if (usedMb == null || totalMb == null) return "-";

  const usedGb = usedMb / 1024;
  const totalGb = totalMb / 1024;

  return `${usedGb.toFixed(1)} GB / ${totalGb.toFixed(0)} GB`;
}

export function formatCpu(percent?: number): string {
  if (percent == null) return "-";
  return `${percent}%`;
}

export function formatUptime(seconds?: number): string {
  if (seconds == null) return "-";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h`;

  const minutes = Math.floor(seconds / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;

  return `${minutes}m`;
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return "-";

  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "-";

  const diffMs = Date.now() - timestamp;
  const seconds = Math.max(0, Math.floor(diffMs / 1000));

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}