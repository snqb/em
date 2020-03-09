// util
import {
  addContext,
  getThoughtsRanked,
  hashContext,
  equalArrays,
  equalThoughtRanked,
  equalPath,
  getThought,
  hashThought,
  moveThought,
  reduceObj,
  removeContext,
  rootedContextOf,
  head,
  headRank,
  sync,
  timestamp,
  pathToContext,
  updateUrlHistory,
  getNextRank,
} from '../util.js'

import { subsetThoughts } from '../util/subsetThoughts.js'

import * as _ from 'lodash';
import sortBy from 'lodash.sortby'
import reverse from 'lodash.reverse'

// side effect: sync
export default (state, { oldPath, newPath }) => {

  const thoughtIndex = { ...state.thoughtIndex }
  const oldThoughts = pathToContext(oldPath)
  const newThoughts = pathToContext(newPath)
  const value = head(oldThoughts)
  const key = hashThought(value)
  const oldRank = headRank(oldPath)
  const newRank = headRank(newPath)
  const oldContext = rootedContextOf(oldThoughts)
  const newContext = rootedContextOf(newThoughts)
  const sameContext = equalArrays(oldContext, newContext)
  const oldThought = getThought(value, thoughtIndex)
  const newThought = moveThought(oldThought, oldContext, newContext, oldRank, newRank)
  const editing = equalPath(state.cursorBeforeEdit, oldPath)

  const recentlyEdited = reverse(sortBy([...state.recentlyEdited], 'lastUpdated')).map(recentlyEditedThought => {
    /* updating the path of the thought and its descendants as well */
    return {
      ...recentlyEditedThought,
      path: equalPath(recentlyEditedThought.path, oldPath) ? newPath
        : subsetThoughts(recentlyEditedThought.path, oldPath) ? newPath.concat(recentlyEditedThought.path.slice(newPath.length))
          : recentlyEditedThought.path
    }
  })

  // preserve contextIndex
  const contextEncodedOld = hashContext(oldContext)
  const contextEncodedNew = hashContext(newContext)

  // if the contexts have changed, remove the value from the old contextIndex and add it to the new
  const subthoughtsOld = (state.contextIndex[contextEncodedOld] || [])
    .filter(child => !equalThoughtRanked(child, { value, rank: oldRank }))
  const subthoughtsNew = (state.contextIndex[contextEncodedNew] || [])
    .filter(child => !equalThoughtRanked(child, { value, rank: oldRank }))
    .concat({
      value,
      rank: newRank,
      lastUpdated: timestamp()
    })

  const newLastRank = getNextRank(newPath, state.thoughtIndex, state.contextIndex);

  const recursiveUpdates = (thoughtsRanked, contextRecursive = [], accumRecursive = {}, recursiveDepth = 0) => {

    return getThoughtsRanked(thoughtsRanked, state.thoughtIndex, state.contextIndex).reduce((accum, child, i) => {
      const hashedKey = hashThought(child.value)
      const childThought = getThought(child.value, thoughtIndex)

      // remove and add the new context of the child
      const contextNew = newThoughts.concat(contextRecursive)

      // update rank of first depth of childs
      const movedRank = recursiveDepth ? child.rank : newLastRank + i

      const childNew = addContext(removeContext(childThought, pathToContext(thoughtsRanked), child.rank), contextNew, movedRank)

      // update local thoughtIndex so that we do not have to wait for firebase
      thoughtIndex[hashedKey] = childNew

      const accumNew = {
        // merge ancestor updates
        ...accumRecursive,
        // merge sibling updates
        // Order matters: accum must have precendence over accumRecursive so that contextNew is correct
        ...accum,
        // merge current thought update
        [hashedKey]: {
          value: child.value,
          rank: movedRank,
          thoughtIndex: childNew,
          context: pathToContext(thoughtsRanked),
          contextsOld: ((accumRecursive[hashedKey] || {}).contextsOld || []).concat([pathToContext(thoughtsRanked)]),
          contextsNew: ((accumRecursive[hashedKey] || {}).contextsNew || []).concat([contextNew])
        }
      }

      return {
        ...accumNew,
        ...recursiveUpdates(thoughtsRanked.concat(child), contextRecursive.concat(child.value), accumNew, recursiveDepth + 1)
      }
    }, {})
  }

  const descendantUpdatesResult = recursiveUpdates(oldPath)
  const descendantUpdates = reduceObj(descendantUpdatesResult, (key, value) => ({
    [key]: value.thoughtIndex
  }))

  const contextIndexDescendantUpdates = sameContext
    ? {}
    : reduceObj(descendantUpdatesResult, (hashedKey, result, accumContexts) =>
      result.contextsOld.reduce((accum, contextOld, i) => {
        const contextNew = result.contextsNew[i]
        const contextEncodedOld = hashContext(contextOld)
        const contextEncodedNew = hashContext(contextNew)
        return {
          ...accum,
          [contextEncodedOld]: (accumContexts[contextEncodedOld] || state.contextIndex[contextEncodedOld] || [])
            .filter(child => child.value !== result.value),
          //if already exists, don't add.
          [contextEncodedNew]: _.uniqBy((accumContexts[contextEncodedNew] || state.contextIndex[contextEncodedNew] || [])
            .concat(
              [{
                value: result.value,
                rank: result.rank,
                lastUpdated: timestamp()
              }]),
            "value"
          )
        }
      }, {})
    )

  const contextIndexUpdates = {
    [contextEncodedOld]: subthoughtsOld,
    [contextEncodedNew]: subthoughtsNew,
    ...contextIndexDescendantUpdates
  }

  const contextIndexNew = {
    ...state.contextIndex,
    ...contextIndexUpdates
  }
  Object.keys(contextIndexNew).forEach(contextEncoded => {
    const subthoughts = contextIndexNew[contextEncoded]
    if (!subthoughts || subthoughts.length === 0) {
      delete contextIndexNew[contextEncoded] // eslint-disable-line fp/no-delete
    }
  })

  const thoughtIndexUpdates = {
    [key]: newThought,
    ...descendantUpdates
  }

  thoughtIndex[key] = newThought

  // preserve contextViews
  const contextViewsNew = { ...state.contextViews }
  if (state.contextViews[contextEncodedNew] !== state.contextViews[contextEncodedOld]) {
    contextViewsNew[contextEncodedNew] = state.contextViews[contextEncodedOld]
    delete contextViewsNew[contextEncodedOld] // eslint-disable-line fp/no-delete
  }

  setTimeout(() => {
    // do not sync to state since this reducer returns the new state
    sync(thoughtIndexUpdates, contextIndexUpdates, { state: false, recentlyEdited })

    if (editing) {
      updateUrlHistory(newPath, { replace: true })
    }
  })

  return {
    thoughtIndex,
    dataNonce: state.dataNonce + 1,
    cursor: editing ? newPath : state.cursor,
    cursorBeforeEdit: editing ? newPath : state.cursorBeforeEdit,
    contextIndex: contextIndexNew,
    contextViews: contextViewsNew,
    recentlyEdited
  }
}
