import { isFilterList } from '@buildone/app-server-tslib/utils';

import type { FilterCriteria, FilterList, QueryObject } from '@buildone/app-server-tslib/utils';

/**
 * Translates a B1 QueryObject into OData v4 query parameters.
 *
 * Supported B1 operators: eq, neq, gt, lt, gte, lte, contains, begins, ends, isNull
 * Unsupported: notcontains (no direct OData v4 equivalent — filtered client-side)
 */

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function criteriaToOData(c: FilterCriteria): string {
  const field = c.field;
  const val = formatValue(c.value);
  switch (c.operator) {
    case 'eq':
    case '=':
      return `${field} eq ${val}`;
    case 'neq':
    case 'ne':
    case '<>':
      return `${field} ne ${val}`;
    case 'gt':
    case '>':
      return `${field} gt ${val}`;
    case 'lt':
    case '<':
      return `${field} lt ${val}`;
    case 'gte':
    case 'ge':
    case '>=':
      return `${field} ge ${val}`;
    case 'lte':
    case 'le':
    case '<=':
      return `${field} le ${val}`;
    case 'contains':
    case 'matches':
      return `contains(${field},${val})`;
    case 'begins':
    case 'startswith':
    case 'beginsmatches':
      return `startswith(${field},${val})`;
    case 'ends':
    case 'endswith':
      return `endswith(${field},${val})`;
    case 'isNull':
      return c.value ? `${field} eq null` : `${field} ne null`;
    default:
      return `${field} eq ${val}`;
  }
}

function filterListToOData(list: FilterList<unknown>): string {
  const parts = list.filters.map((f) => {
    if (isFilterList(f)) return `(${filterListToOData(f as FilterList<unknown>)})`;
    return criteriaToOData(f as FilterCriteria);
  });
  return parts.join(` ${list.logic} `);
}

export interface ODataParams {
  $filter?: string;
  $top?: string;
  $skip?: string;
  $orderby?: string;
}

export function buildODataParams(query: QueryObject<unknown>): ODataParams {
  const params: ODataParams = {};

  if (query.filters && isFilterList(query.filters)) {
    const filterStr = filterListToOData(query.filters as FilterList<unknown>);
    if (filterStr) params.$filter = filterStr;
  }

  if (query.limit != null) params.$top = String(query.limit);
  if (query.offset != null && query.offset > 0) params.$skip = String(query.offset);

  if (query.orderBy) {
    const orderBy = query.orderBy as { field: string; order?: string };
    params.$orderby = `${orderBy.field} ${orderBy.order ?? 'asc'}`;
  }

  return params;
}
