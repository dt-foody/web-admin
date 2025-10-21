export interface TreeNode<T = any> {
  id: string;
  parent?: string | null;
  name: string;
  children?: TreeNode<T>[];
  level?: number;
  expanded?: boolean;
  isActive?: boolean;
  data: T; // giữ nguyên dữ liệu gốc
}

/**
 * Build tree từ mảng flat
 * @param items Mảng object có id, parent
 * @param rootId Id gốc (default: 'root')
 */
export function buildTree<T extends { id: string; parent?: string | null; name: string }>(
  items: T[],
  rootId: string = 'root',
  expanded: boolean = true,
): TreeNode<T>[] {
  const map: Record<string, T[]> = {};
  items.forEach((item) => {
    const parent = item.parent || rootId;
    if (!map[parent]) map[parent] = [];
    map[parent].push(item);
  });

  const result: TreeNode<T>[] = [];
  const traverse = (parent: string, level: number) => {
    const nodes = map[parent];
    if (!nodes) return;
    nodes.forEach((node) => {
      const treeNode: TreeNode<T> = {
        id: node.id,
        parent: node.parent || null,
        name: node.name,
        children: [],
        level,
        expanded,
        data: node,
      };
      result.push(treeNode);
      traverse(node.id, level + 1);
      if (treeNode.children && treeNode.children.length === 0) delete treeNode.children;
    });
  };

  traverse(rootId, 0);
  return result;
}

/**
 * Flatten tree ra mảng 1 chiều
 * @param tree TreeNode[]
 * @param searchTerm Optional search filter
 */
export function flattenTree<T>(tree: TreeNode<T>[], searchTerm: string = ''): TreeNode<T>[] {
  const flattened: TreeNode<T>[] = [];

  const flatten = (nodes: TreeNode<T>[]) => {
    nodes.forEach((node) => {
      if (!searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        flattened.push(node);
      }
      if (node.expanded && node.children?.length) {
        flatten(node.children);
      }
    });
  };

  flatten(tree);
  return flattened;
}

/**
 * Build tree options cho ng-select dạng tree
 */
export interface TreeOption {
  value: string;
  label: string;
  level: number;
}

export function buildTreeOptions<T extends { id: string; parent?: string | null; name: string }>(
  items: T[],
  rootId: string | null = null,
  prefix: string = '— ',
): TreeOption[] {
  const map: Record<string, T[]> = {};
  items.forEach((item) => {
    const parent = item.parent ?? rootId;
    if (!map[parent as string]) map[parent as string] = [];
    map[parent as string].push(item);
  });

  const result: TreeOption[] = [];

  const traverse = (parent: string | null, level: number) => {
    const nodes = map[parent as string];
    if (!nodes) return;
    nodes.forEach((node) => {
      result.push({
        value: node.id,
        label: `${prefix.repeat(level)}${node.name}`,
        level,
      });
      traverse(node.id, level + 1);
    });
  };

  traverse(rootId, 0);
  return result;
}
