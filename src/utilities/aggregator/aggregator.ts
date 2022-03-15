type Primitive = string | number | boolean;

interface SortCriteria {
  [key: string]: 'asc' | 'desc' | SortComprehension;
}

interface SortComprehension {
  order: 'asc' | 'desc';
  preference?: Primitive[];
}

export class Aggregator {
  public static groupByIntoMap<T>(list: T[], field: keyof T | string): { [key: string]: T[] } {
    return list.reduce(
      (result, item) => {
        const fieldVal = String(Aggregator.deepGet(item, String(field).split('.')));
        return ({
          ...result,
          [fieldVal]: [
            ...(result[fieldVal] || []),
            item,
          ],
        });
      },
      {},
    );
  }

  public static groupByIntoPairList<T>(list: T[], field: keyof T | string): [string, T[]][] {
    const asMap = Aggregator.groupByIntoMap(list, field);
    return Object.keys(asMap).map((key) => {
      return [key, asMap[key]] as [string, any[]];
    });
  }

  public static sorted<T>(list: T[], sort: SortCriteria[], comparator?: (a, b) => number): T[] {
    return list.sort((a, b) => {
      let comparison = 0;

      for (const sortBy of sort) {
        for (const key in sortBy) {
          if (!(key in sortBy)) {
            continue;
          }

          const aKeyValue = Aggregator.deepGet(a, key.split('.')).toLowerCase();
          const bKeyValue = Aggregator.deepGet(b, key.split('.')).toLowerCase();

          comparison = comparator ? comparator(aKeyValue, bKeyValue) : String(aKeyValue).localeCompare(bKeyValue);

          if (sortBy[key] === 'asc' || sortBy[key] === 'desc') {
            comparison = sortBy[key] === 'asc' ? comparison : -comparison;
          } else {
            const comprehension = sortBy[key] as SortComprehension;

            if (comprehension.preference) {
              for (let index = 0; index < comprehension.preference.length; index++) {
                if (typeof comprehension.preference[index] === 'string') {
                  comprehension.preference[index] = (comprehension.preference[index] as any).toLowerCase();
                }
              }
              if (comprehension.preference.indexOf(aKeyValue) > -1 && comprehension.preference.indexOf(bKeyValue) > -1) {
                comparison = comprehension.preference.indexOf(aKeyValue) - comprehension.preference.indexOf(bKeyValue);
              } else if (comprehension.preference.indexOf(aKeyValue) > -1 && comprehension.preference.indexOf(bKeyValue) === -1) {
                comparison = -1;
              } else if (comprehension.preference.indexOf(bKeyValue) > -1 && comprehension.preference.indexOf(aKeyValue) === -1) {
                comparison = 1;
              }
            }

            comparison = comprehension.order === 'asc' ? comparison : -comparison;
          }
        }

        if (comparison !== 0) {
          break;
        }
      }

      return comparison;
    });
  }

  public static filtered<T>(list: T[], filter: { [key: string]: { operation: '==' | '<=' | '>=' | '!=', value: any } }[] ): T[] {
    return list.filter((l) => {
      let toFilter = true;

      for (const filterBy of filter) {
        if (!toFilter) {
          break;
        }

        for (const key in filterBy) {
          if (!(key in filterBy)) {
            continue;
          }

          const lValue = Aggregator.deepGet(l, key.split('.'));
          const {operation, value} = filterBy[key];

          switch (operation) {
            case '==': {
              toFilter = lValue === value;
              break;
            }
            case '<=': {
              toFilter = lValue <= value;
              break;
            }
            case '>=': {
              toFilter = lValue <= value;
              break;
            }
            case '!=': {
              toFilter = lValue !== value;
              break;
            }
          }
        }
      }

      return toFilter;
    });
  }

  private static deepGet = (obj, props) => props.reduce((agg, prop) => (agg && agg[prop]) ? agg[prop] : null, obj);
}
