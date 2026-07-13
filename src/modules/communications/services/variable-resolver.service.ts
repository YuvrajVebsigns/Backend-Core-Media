import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VariableResolverService {
  private readonly logger = new Logger(VariableResolverService.name);

  /**
   * Safely resolves a dot-notation path on an object, handling nested structures and implicit array mapping.
   */
  resolvePath(obj: any, path: string): any {
    if (!obj || !path) return null;
    const parts = path.split('.');
    return this.resolveParts(obj, parts);
  }

  private resolveParts(current: any, parts: string[]): any {
    if (current === null || current === undefined) {
      return null;
    }
    if (parts.length === 0) {
      return current;
    }

    // If current node is an array, we map the remaining path over its elements
    if (Array.isArray(current)) {
      const results = current.map(item => this.resolveParts(item, parts));
      const flattened = this.flattenAndFilter(results);
      return flattened.length > 0 ? flattened : null;
    }

    const [first, ...rest] = parts;
    
    // Support Mongoose Document get() if available, otherwise standard property access
    let nextValue: any;
    if (current && typeof current.get === 'function') {
      nextValue = current.get(first);
    } else if (current && typeof current === 'object') {
      nextValue = current[first];
    } else {
      return null;
    }

    if (nextValue === null || nextValue === undefined) {
      return null;
    }

    if (Array.isArray(nextValue)) {
      // Encountered an array mid-path
      const results = nextValue.map(item => this.resolveParts(item, rest));
      const flattened = this.flattenAndFilter(results);
      return flattened.length > 0 ? flattened : null;
    }

    return this.resolveParts(nextValue, rest);
  }

  private flattenAndFilter(arr: any[]): any[] {
    const flat: any[] = [];
    for (const item of arr) {
      if (Array.isArray(item)) {
        flat.push(...this.flattenAndFilter(item));
      } else if (item !== null && item !== undefined && item !== '') {
        flat.push(item);
      }
    }
    return flat;
  }

  /**
   * Scans a template string for standard double curly-brace syntax {{ path.key }}
   * and replaces tokens with resolved data. Supports transparent fallback for paths
   * starting with 'params.' prefix or resolving from context.params if nested.
   * If the resolved value is an array, joins elements with a comma and a space.
   */
  interpolate(templateText: string, context: any): string {
    if (!templateText) return '';
    return templateText.replace(/{{\s*([^}]+)\s*}}/g, (match, pathKey) => {
      const trimmedPath = pathKey.trim();
      let resolved = this.resolvePath(context, trimmedPath);

      if (resolved === null || resolved === undefined) {
        if (trimmedPath.startsWith('params.')) {
          const fallbackPath = trimmedPath.substring(7); // remove 'params.'
          resolved = this.resolvePath(context, fallbackPath);
        } else {
          let paramsContext: any;
          if (context && typeof context.get === 'function') {
            paramsContext = context.get('params');
          } else if (context && typeof context === 'object') {
            paramsContext = context.params;
          }
          if (paramsContext) {
            resolved = this.resolvePath(paramsContext, trimmedPath);
          }
        }
      }

      if (resolved === null || resolved === undefined) {
        return '';
      }
      if (Array.isArray(resolved)) {
        return resolved.join(', ');
      }
      return String(resolved);
    });
  }
}
