export function formatNotificationTime(
  date: string
): string {
  if (!date) {
    return "";
  }

  let normalizedDate = date;

  // Backend may sometimes return a UTC datetime
  // without an explicit timezone.
  if (
    !date.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(date)
  ) {
    normalizedDate = `${date}Z`;
  }

  const created = new Date(normalizedDate);
  const now = new Date();

  if (Number.isNaN(created.getTime())) {
    return "";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (now.getTime() - created.getTime()) / 1000
    )
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} ${
      minutes === 1 ? "minute" : "minutes"
    } ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${
      hours === 1 ? "hour" : "hours"
    } ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return created.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}