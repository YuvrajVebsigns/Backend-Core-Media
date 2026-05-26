export interface INavbarItem {
  id: string;
  title: string;
  position: string;
  order: number;
  isVisible: boolean;
  parentId?: string;
  items: any[];
  children?: INavbarItem[];
}

export function buildNestedMenu(items: any[]): INavbarItem[] {
  const itemMap = new Map<string, INavbarItem>();
  const roots: INavbarItem[] = [];

  // Initialize map
  items.forEach((item) => {
    const raw = item.toJSON ? item.toJSON() : item;
    itemMap.set(raw.id || raw._id.toString(), {
      ...raw,
      id: raw.id || raw._id.toString(),
      children: [],
    });
  });

  // Build tree
  itemMap.forEach((item) => {
    if (item.parentId) {
      const parentIdStr = item.parentId.toString();
      const parent = itemMap.get(parentIdStr);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        roots.push(item);
      }
    } else {
      roots.push(item);
    }
  });

  // Sort children by order
  itemMap.forEach((item) => {
    if (item.children) {
      item.children.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  });

  // Sort roots by order
  return roots.sort((a, b) => (a.order || 0) - (b.order || 0));
}
