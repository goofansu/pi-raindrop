interface BookmarkItem {
  _id?: number | string;
  title?: string;
  link?: string;
  tags?: string[];
  excerpt?: string;
  note?: string;
}

interface TagItem {
  _id?: string;
  count?: number;
}

interface CollectionItem {
  _id?: number | string;
  title?: string;
  count?: number;
  public?: boolean;
  view?: string;
  color?: string;
}

function appendIfPresent(lines: string[], label: string, value: unknown): void {
  if (value !== undefined && value !== null && value !== "") {
    lines.push(`   ${label}: ${String(value)}`);
  }
}

export function formatBookmarkItem(item: BookmarkItem): string {
  const lines = [item.title || item.link || String(item._id ?? "Untitled")];
  appendIfPresent(lines, "ID", item._id);
  appendIfPresent(lines, "Link", item.link);

  const tags = item.tags?.filter((tag) => tag !== "");
  if (tags?.length) {
    lines.push(`   Tags: ${tags.join(", ")}`);
  }

  appendIfPresent(lines, "Excerpt", item.excerpt);
  appendIfPresent(lines, "Note", item.note);
  return lines.join("\n");
}

export function formatTagItem(item: TagItem): string {
  return `${item._id ?? ""} (${item.count ?? 0})`;
}

export function formatCollectionItem(item: CollectionItem): string {
  const lines = [item.title || String(item._id ?? "Untitled")];
  appendIfPresent(lines, "ID", item._id);
  appendIfPresent(lines, "Count", item.count);
  lines.push(`   Visibility: ${item.public ? "public" : "private"}`);
  appendIfPresent(lines, "View", item.view);
  appendIfPresent(lines, "Color", item.color);
  return lines.join("\n");
}
