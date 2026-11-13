import type { EventFilters, ManagedEvent } from "./event-types";

export function compareEventUpdates(a: ManagedEvent, b: ManagedEvent) {
  return (b.updatedAt ?? b.updated).localeCompare(a.updatedAt ?? a.updated) ||
    a.id.localeCompare(b.id);
}

export function readEventFilters(params: {
  get: (key: string) => string | null;
}): EventFilters {
  const status = params.get("status");
  const sort = params.get("sort");
  const size = Number(params.get("size"));
  return {
    tab: params.get("tab") === "draft" ? "draft" : "published",
    search: params.get("q") ?? "",
    status:
      status === "ongoing" || status === "upcoming" || status === "ended"
        ? status
        : "all",
    sort: sort === "updated" || sort === "title" ? sort : "reference",
    page: Math.max(1, Math.floor(Number(params.get("page"))) || 1),
    pageSize: size === 2 || size === 6 ? size : 4,
  };
}

export function eventHref(filters: EventFilters, eventId?: string) {
  const p = new URLSearchParams();
  if (filters.tab === "draft") p.set("tab", "draft");
  if (filters.search) p.set("q", filters.search);
  if (filters.status !== "all") p.set("status", filters.status);
  if (filters.sort !== "reference") p.set("sort", filters.sort);
  if (filters.page > 1) p.set("page", String(filters.page));
  if (filters.pageSize !== 4) p.set("size", String(filters.pageSize));
  if (eventId) p.set("event", eventId);
  return `/guru/events${p.size ? `?${p}` : ""}`;
}

export function selectEvents(
  events: ManagedEvent[],
  filters: EventFilters,
  deleted: string[],
) {
  const records = events.filter(
    (e) =>
      !deleted.includes(e.id) &&
      (filters.tab === "draft" ? e.status === "draft" : e.status !== "draft") &&
      (filters.status === "all" || e.status === filters.status) &&
      e.title
        .toLocaleLowerCase("id")
        .includes(filters.search.trim().toLocaleLowerCase("id")),
  );
  if (filters.sort === "title")
    records.sort((a, b) => a.title.localeCompare(b.title, "id"));
  if (filters.sort === "updated")
    records.sort(compareEventUpdates);
  const pages = Math.max(1, Math.ceil(records.length / filters.pageSize));
  const page = Math.min(filters.page, pages);
  return {
    total: records.length,
    page,
    pages,
    records: records.slice(
      (page - 1) * filters.pageSize,
      page * filters.pageSize,
    ),
  };
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
export function formatEventDate(value: string, time = false) {
  const [date, clock] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${months[month - 1]} ${year}${time && clock ? `, ${clock.slice(0, 5).replace(":", ".")} WIB` : ""}`;
}
