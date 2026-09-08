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
   * Resolves a path or token against context, transparently supporting params. prefix or nested context.params.
   * Prioritizes nominatorSnapshot values over nominatorId references for point-in-time accuracy.
   */
  resolveVariable(context: any, path: string): any {
    if (!context || !path) return null;

    // 1. If path is targeting nominatorId.<field> but nominatorSnapshot is present,
    // prioritize the point-in-time snapshot values over nominatorId.
    const isNominatorIdPath =
      path.startsWith('nominatorId.') || path.startsWith('params.nominatorId.');
    if (isNominatorIdPath) {
      const isPrefixed = path.startsWith('params.');
      const subField = path.replace(/^(params\.)?nominatorId\./, '');
      const snapshot =
        this.resolvePath(
          context,
          isPrefixed ? 'params.nominatorSnapshot' : 'nominatorSnapshot',
        ) || this.resolvePath(context, 'nominatorSnapshot');

      if (snapshot && typeof snapshot === 'object') {
        if (subField === 'name' && snapshot.name !== undefined) return snapshot.name;
        if (subField === 'email' && snapshot.email !== undefined) return snapshot.email;
        if (
          (subField === 'organization' || subField === 'company') &&
          snapshot.company !== undefined
        ) {
          return snapshot.company;
        }
        if (
          (subField === 'phone' || subField === 'phoneNumber') &&
          snapshot.phone !== undefined
        ) {
          return snapshot.phone;
        }
        if (subField === 'city' && snapshot.city !== undefined) return snapshot.city;
      }
    }

    // 2. If path is targeting nominatorSnapshot.<field> on a legacy record without snapshot,
    // gracefully fall back to populated nominatorId fields.
    const isNominatorSnapshotPath =
      path.startsWith('nominatorSnapshot.') ||
      path.startsWith('params.nominatorSnapshot.');
    if (isNominatorSnapshotPath) {
      let resolvedSnapshot = this.resolvePath(context, path);
      if (
        resolvedSnapshot === null ||
        resolvedSnapshot === undefined ||
        (path.startsWith('params.') && !resolvedSnapshot)
      ) {
        if (path.startsWith('params.')) {
          resolvedSnapshot = this.resolvePath(context, path.substring(7));
        } else {
          const paramsCtx =
            context && typeof context.get === 'function'
              ? context.get('params')
              : context?.params;
          if (paramsCtx) {
            resolvedSnapshot = this.resolvePath(paramsCtx, path);
          }
        }
      }

      if (resolvedSnapshot !== null && resolvedSnapshot !== undefined) {
        return resolvedSnapshot;
      }

      const isPrefixed = path.startsWith('params.');
      const subField = path.replace(/^(params\.)?nominatorSnapshot\./, '');
      const nominator =
        this.resolvePath(
          context,
          isPrefixed ? 'params.nominatorId' : 'nominatorId',
        ) || this.resolvePath(context, 'nominatorId');

      if (nominator && typeof nominator === 'object') {
        if (subField === 'name') return nominator.name || null;
        if (subField === 'email') return nominator.email || null;
        if (subField === 'company' || subField === 'organization') {
          return nominator.organization || nominator.company || null;
        }
        if (subField === 'phone' || subField === 'phoneNumber') {
          return nominator.phoneNumber || nominator.phone || null;
        }
        if (subField === 'city') return nominator.city || null;
      }
    }

    let resolved = this.resolvePath(context, path);

    if (resolved === null || resolved === undefined) {
      if (path.startsWith('params.')) {
        const fallbackPath = path.substring(7); // remove 'params.'
        resolved = this.resolvePath(context, fallbackPath);
      } else {
        let paramsContext: any;
        if (context && typeof context.get === 'function') {
          paramsContext = context.get('params');
        } else if (context && typeof context === 'object') {
          paramsContext = context.params;
        }
        if (paramsContext) {
          resolved = this.resolvePath(paramsContext, path);
        }
      }
    }

    return resolved;
  }

  /**
   * Renders a loop block over an array path with child items having priority access to their own fields.
   */
  private renderLoopBlock(
    arrayPath: string,
    blockContent: string,
    parentContext: any,
    itemAlias?: string,
  ): string {
    const list = this.resolveVariable(parentContext, arrayPath);
    if (!Array.isArray(list) || list.length === 0) {
      return '';
    }

    return list
      .map((item, index) => {
        const itemObj =
          item && typeof item.toObject === 'function'
            ? item.toObject()
            : item && typeof item === 'object'
              ? { ...item }
              : { value: item };

        // Ensure 1-based index is present on the item
        if (itemObj.index === undefined) {
          itemObj.index = index + 1;
        }

        const iterationContext: any = {
          ...parentContext,
          ...itemObj,
          index: index + 1,
          '@index': index,
          '@number': index + 1,
          '@first': index === 0,
          '@last': index === list.length - 1,
          'forloop.index': index + 1,
          'forloop.index0': index,
          'forloop.first': index === 0,
          'forloop.last': index === list.length - 1,
          'loop.index': index + 1,
          'loop.index0': index,
          'loop.first': index === 0,
          'loop.last': index === list.length - 1,
          this: itemObj,
        };

        if (itemAlias) {
          iterationContext[itemAlias] = itemObj;
        }

        return this.interpolate(blockContent, iterationContext);
      })
      .join('');
  }

  /**
   * Scans a template string for:
   * 1. Brevo / Liquid / Django loop blocks:
   *    {% for item in arrayPath %}...{% endfor %} or {{ for item in arrayPath }}...{{ endfor }}
   * 2. Handlebars block loops:
   *    {{#each path}}...{{/each}} or {{#path}}...{{/path}}
   * 3. Conditional blocks:
   *    {% if condition %}...{% else %}...{% endif %} or {{#if condition}}...{{/if}}
   * 4. Double curly-brace tokens:
   *    {{ path.key }} or {{- path.key -}}
   */
  interpolate(templateText: string, context: any): string {
    if (!templateText) return '';

    // Step 1: Process Brevo / Liquid / Django loops:
    // {% for item in arrayPath %}...{% endfor %} or {{ for item in arrayPath }}...{{ endfor }}
    let processed = templateText.replace(
      /(?:{%|{{)[-~]?\s*for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_.]+)\s*[-~]?(?:%}|}})([\s\S]*?)(?:{%|{{)[-~]?\s*endfor\s*[-~]?(?:%}|}})/gi,
      (_match, itemAlias, arrayPath, blockContent) => {
        return this.renderLoopBlock(
          arrayPath.trim(),
          blockContent,
          context,
          itemAlias.trim(),
        );
      },
    );

    // Step 2: Process Handlebars explicit block loop iterations: {{#each arrayPath}}...{{/each}}
    processed = processed.replace(
      /{{\s*#each\s+([^}]+)\s*}}([\s\S]*?){{\s*\/each\s*}}/g,
      (_match, arrayPath, blockContent) => {
        return this.renderLoopBlock(arrayPath.trim(), blockContent, context);
      },
    );

    // Step 3: Handlebars section block syntax: {{#arrayPath}}...{{/arrayPath}}
    processed = processed.replace(
      /{{\s*#([a-zA-Z0-9_.]+)\s*}}([\s\S]*?){{\s*\/\1\s*}}/g,
      (_match, arrayPath, blockContent) => {
        const trimmedPath = arrayPath.trim();
        if (trimmedPath === 'if' || trimmedPath === 'each') return _match;
        const resolved = this.resolveVariable(context, trimmedPath);
        if (Array.isArray(resolved)) {
          return this.renderLoopBlock(trimmedPath, blockContent, context);
        }
        if (resolved) {
          return this.interpolate(blockContent, context);
        }
        return '';
      },
    );

    // Step 4: Conditional blocks:
    // Brevo / Liquid: {% if condition %}...{% else %}...{% endif %}
    processed = processed.replace(
      /(?:{%|{{)[-~]?\s*if\s+(not\s+)?([a-zA-Z0-9_.]+)\s*[-~]?(?:%}|}})([\s\S]*?)(?:(?:{%|{{)[-~]?\s*else\s*[-~]?(?:%}|}})([\s\S]*?))?(?:{%|{{)[-~]?\s*endif\s*[-~]?(?:%}|}})/gi,
      (_match, isNot, conditionPath, ifBlock, elseBlock = '') => {
        const trimmedPath = conditionPath.trim();
        const val = this.resolveVariable(context, trimmedPath);
        const isTruthy = Boolean(
          val &&
            (Array.isArray(val)
              ? val.length > 0
              : String(val).trim().length > 0 &&
                String(val).trim() !== 'false' &&
                String(val).trim() !== '0'),
        );
        const shouldRenderIf = isNot ? !isTruthy : isTruthy;
        return shouldRenderIf
          ? this.interpolate(ifBlock, context)
          : this.interpolate(elseBlock, context);
      },
    );

    // Handlebars: {{#if condition}}...{{else}}...{{/if}}
    processed = processed.replace(
      /{{\s*#if\s+([a-zA-Z0-9_.]+)\s*}}([\s\S]*?)(?:{{\s*else\s*}}([\s\S]*?))?{{\s*\/if\s*}}/gi,
      (_match, conditionPath, ifBlock, elseBlock = '') => {
        const trimmedPath = conditionPath.trim();
        const val = this.resolveVariable(context, trimmedPath);
        const isTruthy = Boolean(
          val &&
            (Array.isArray(val)
              ? val.length > 0
              : String(val).trim().length > 0 &&
                String(val).trim() !== 'false' &&
                String(val).trim() !== '0'),
        );
        return isTruthy
          ? this.interpolate(ifBlock, context)
          : this.interpolate(elseBlock, context);
      },
    );

    // Step 5: Standard token interpolation {{ token }} or {{- token -}}
    return processed.replace(/{{\s*([^}]+)\s*}}/g, (_match, rawPathKey) => {
      const trimmedPath = rawPathKey.trim().replace(/^[-~]\s*|\s*[-~]$/g, '');

      // Skip helper/block delimiters if unmatched
      if (
        trimmedPath.startsWith('#') ||
        trimmedPath.startsWith('/') ||
        trimmedPath === 'else' ||
        trimmedPath.startsWith('%')
      ) {
        return '';
      }

      const resolved = this.resolveVariable(context, trimmedPath);

      if (resolved === null || resolved === undefined) {
        return '';
      }

      if (Array.isArray(resolved)) {
        // If array of objects, format gracefully rather than returning [object Object]
        if (
          resolved.length > 0 &&
          typeof resolved[0] === 'object' &&
          resolved[0] !== null
        ) {
          if (
            trimmedPath === 'nominees' ||
            trimmedPath === 'params.nominees'
          ) {
            const tableVal = this.resolveVariable(context, 'nomineesTable');
            if (tableVal) return String(tableVal);
          }

          return resolved
            .map((item, idx) => {
              const label =
                item.name ||
                item.contactName ||
                item.title ||
                item.email ||
                `Item ${idx + 1}`;
              const extra = item.category || item.company || item.organization;
              return extra ? `${label} (${extra})` : label;
            })
            .join(', ');
        }
        return resolved.join(', ');
      }

      return String(resolved);
    });
  }
}
