import { ref } from 'vue'
import type { Ref } from 'vue'

type QueryResult<T> = { data: T | null, error: null }

function ok<T>(data: T): QueryResult<T> {
  return { data, error: null }
}

export function createMockSupabaseClient() {
  const tables: Record<string, unknown[]> = {
    plants: [],
    care_tasks: [],
    sites: []
  }

  function from(table: string) {
    const state = {
      filters: [] as Array<(row: Record<string, unknown>) => boolean>,
      orderCol: null as string | null,
      orderAsc: true,
      limitCount: null as number | null,
      selectCols: '*'
    }

    const builder = {
      select(_cols?: string) {
        state.selectCols = _cols ?? '*'
        return builder
      },
      eq(col: string, val: unknown) {
        state.filters.push(row => row[col] === val)
        return builder
      },
      neq(col: string, val: unknown) {
        state.filters.push(row => row[col] !== val)
        return builder
      },
      in(col: string, vals: unknown[]) {
        state.filters.push(row => vals.includes(row[col]))
        return builder
      },
      lte(col: string, val: string) {
        state.filters.push(row => String(row[col]) <= val)
        return builder
      },
      gte(col: string, val: string) {
        state.filters.push(row => String(row[col]) >= val)
        return builder
      },
      order(col: string, opts?: { ascending?: boolean }) {
        state.orderCol = col
        state.orderAsc = opts?.ascending ?? true
        return builder
      },
      limit(n: number) {
        state.limitCount = n
        return builder
      },
      async then(
        resolve: (value: QueryResult<unknown[]>) => void
      ) {
        let rows = (tables[table] ?? []).filter((row) => {
          const record = row as Record<string, unknown>
          return state.filters.every(fn => fn(record))
        })
        if (state.orderCol) {
          const col = state.orderCol
          rows = [...rows].sort((a, b) => {
            const av = String((a as Record<string, unknown>)[col])
            const bv = String((b as Record<string, unknown>)[col])
            return state.orderAsc ? av.localeCompare(bv) : bv.localeCompare(av)
          })
        }
        if (state.limitCount !== null) {
          rows = rows.slice(0, state.limitCount)
        }
        resolve(ok(rows))
      },
      delete() {
        return {
          eq(col: string, val: unknown) {
            return {
              neq(idCol: string, idVal: unknown) {
                return {
                  async then(resolve: (value: { error: null }) => void) {
                    tables[table] = (tables[table] ?? []).filter((row) => {
                      const record = row as Record<string, unknown>
                      return !(record[col] === val && record[idCol] !== idVal)
                    })
                    resolve({ error: null })
                  }
                }
              }
            }
          }
        }
      }
    }

    return builder
  }

  return {
    from,
    seed(table: string, rows: unknown[]) {
      tables[table] = rows
    },
    auth: {
      getUser: async () => ({ data: { user: { id: 'test-user-id' } }, error: null })
    }
  }
}

export function mockSupabaseUser(id = 'test-user-id'): Ref<{ id: string } | null> {
  return ref({ id })
}
