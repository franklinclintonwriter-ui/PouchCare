/**
 * Immutably update a single item in a list by its id.
 *
 * Maps over the list and applies the updater function only to the item
 * whose `id` matches the provided value. All other items pass through
 * unchanged.
 *
 * @param {Array<Object>} list    - Source array of objects with an `id` field
 * @param {string}        id      - The id of the item to update
 * @param {Function}      updater - Receives the matching item; must return
 *                                  the replacement object
 * @returns {Array<Object>} A new array with the updated item in place
 */
export function withUpdated(list, id, updater) {
  return list.map((item) => (item.id === id ? updater(item) : item));
}
