import assert from 'node:assert/strict'
import { initialFollowing, hasFollowed, addFollowed, removeFollowed } from '../src/utils/following.js'

assert.deepEqual(initialFollowing(null, null, true), [1, 5])
assert.deepEqual(initialFollowing(null, null, false), [])
assert.deepEqual(initialFollowing([], [1, 5], true), [])
assert.deepEqual(initialFollowing(null, [], true), [])
assert.deepEqual(initialFollowing(null, ['legacy-id', 5], false), ['legacy-id', 5])
assert.deepEqual(initialFollowing('invalid', [5], false), [5])
assert.deepEqual(initialFollowing([1, '1', 'uuid', null, {}, '', NaN], [5], true), [1, 'uuid'])
assert.equal(hasFollowed([1], '1'), true)
assert.equal(hasFollowed(['1'], 1), true)
const saved = [1, 'uuid']
assert.equal(addFollowed(saved, '1'), saved)
assert.equal(addFollowed(saved, null), saved)
assert.deepEqual(removeFollowed(saved, '1'), ['uuid'])
assert.deepEqual(saved, [1, 'uuid']) // No mutation of previous React state.
let ids = initialFollowing(null, null, true)
ids = removeFollowed(ids, '1')
ids = removeFollowed(ids, '5')
assert.deepEqual(initialFollowing(JSON.parse(JSON.stringify(ids)), [1, 5], true), [])
ids = addFollowed(ids, 'real-profile')
assert.deepEqual(initialFollowing(JSON.parse(JSON.stringify(ids)), [], false), ['real-profile'])
console.log('Seguimiento: migración, vacíos, persistencia e identificadores correctos (15 comprobaciones).')
