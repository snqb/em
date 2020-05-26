import _ from 'lodash'
import { treeChange } from '../util/recentlyEditedTree'
import { getThought, getThoughts, getThoughtsRanked, rankThoughtsFirstMatch } from '../selectors'
import updateThoughts from './updateThoughts'

// util
import {
  addContext,
  contextOf,
  equalThoughtRanked,
  hashContext,
  hashThought,
  head,
  headRank,
  headUuid,
  headValue,
  isDivider,
  pathToContext,
  removeContext,
  rootedContextOf,
  timestamp,
  unroot,
} from '../util'

/** Changes the text of an existing thought. */
export default (state, { oldValue, newValue, context, showContexts, thoughtsRanked, rankInContext, contextChain }) => {

  if (oldValue === newValue || isDivider(oldValue)) return state

  // thoughts may exist for both the old value and the new value
  const thoughtIndex = { ...state.thoughts.thoughtIndex }
  const value = headValue(thoughtsRanked)
  const rank = headRank(thoughtsRanked)
  const uuid = headUuid(thoughtsRanked)
  const oldKey = hashThought(oldValue)
  const newKey = hashThought(newValue)
  const thoughtOld = getThought(state, oldValue)
  const thoughtCollision = getThought(state, newValue)
  const thoughtParentOld = getThought(state, value)
  const thoughtsOld = unroot(context).concat(oldValue)
  const thoughtsNew = unroot(context).concat(newValue)
  const contextEncodedOld = hashContext(thoughtsOld)
  const contextEncodedNew = hashContext(thoughtsNew)
  const thoughtsRankedLiveOld = showContexts
    ? contextOf(contextOf(thoughtsRanked)).concat({ value: oldValue, rank: headRank(contextOf(thoughtsRanked)) }).concat(head(thoughtsRanked))
    : contextOf(thoughtsRanked).concat({ value: oldValue, rank })

  const cursorNew = state.cursor && state.cursor.map(thought => thought.value === oldValue && thought.rank === rankInContext
    ? { value: newValue, rank: thought.rank, uuid }
    : thought
  )

  const oldPath = rankThoughtsFirstMatch(state, thoughtsOld)
  const newPath = oldPath.slice(0, oldPath.length - 1).concat({ value: newValue, rank: oldPath.slice(oldPath.length - 1)[0].rank })

  // Uncaught TypeError: Cannot perform 'IsArray' on a proxy that has been revoked at Function.isArray (#417)
  let recentlyEdited = state.recentlyEdited // eslint-disable-line fp/no-let
  try {
    recentlyEdited = treeChange(state.recentlyEdited, oldPath, newPath)
  }
  catch (e) {
    console.error('existingThoughtChange: treeChange immer error')
    console.error(e)
  }

  // hasDescendantOfFloatingContext can be done in O(edges)
  // eslint-disable-next-line jsdoc/require-jsdoc
  const isThoughtOldOrphan = () => !thoughtOld.contexts || thoughtOld.contexts.length < 2
  // eslint-disable-next-line jsdoc/require-jsdoc
  const isThoughtOldSubthoughtless = () => getThoughts(state, [oldValue]).length < 2

  // the old thought less the context
  const newOldThought = !isThoughtOldOrphan() || (showContexts && !isThoughtOldSubthoughtless())
    ? removeContext(thoughtOld, context, rank)
    : null

  // do not add floating thought to context
  const newThoughtWithoutContext = thoughtCollision || {
    value: newValue,
    contexts: [],
    created: timestamp(),
    lastUpdated: timestamp()
  }
  const thoughtNew = thoughtOld.contexts.length > 0
    ? addContext(newThoughtWithoutContext, context, showContexts ? headRank(rootedContextOf(thoughtsRankedLiveOld)) : rank, uuid)
    : newThoughtWithoutContext

  // update local thoughtIndex so that we do not have to wait for firebase
  thoughtIndex[newKey] = thoughtNew

  // do not do anything with old thoughtIndex if hashes match, as the above line already took care of it
  if (oldKey !== newKey) {
    if (newOldThought) {
      thoughtIndex[oldKey] = newOldThought
    }
    else {
      delete thoughtIndex[oldKey] // eslint-disable-line fp/no-delete
    }
  }

  // if context view, change the contexts of the current thought (which is rendered visually as the parent of the context since are in the context view)
  let thoughtParentNew // eslint-disable-line fp/no-let
  if (showContexts) {

    // eslint-disable-next-line fp/no-mutating-assign
    thoughtParentNew = Object.assign({}, thoughtParentOld, {
      contexts: removeContext(thoughtParentOld, contextOf(pathToContext(thoughtsRankedLiveOld)), rank).contexts.concat({
        context: thoughtsNew,
        uuid,
        rank
      }),
      created: thoughtParentOld.created,
      lastUpdated: timestamp()
    })

    thoughtIndex[hashThought(value)] = thoughtParentNew
  }

  // preserve contextIndex
  const contextNew = showContexts ? thoughtsNew : context
  const contextNewEncoded = hashContext(contextNew)
  const thoughtNewSubthoughts = getThoughts(state, contextNew)
    .filter(child =>
      !equalThoughtRanked(child, { value: oldValue, rank }) &&
      !equalThoughtRanked(child, { value: newValue, rank })
    )
    .concat({
      value: showContexts ? value : newValue,
      rank,
      uuid,
      lastUpdated: timestamp()
    })

  // preserve contextIndex
  const contextOld = showContexts ? thoughtsOld : context
  const contextOldEncoded = hashContext(contextOld)
  const thoughtOldSubthoughts = getThoughts(state, contextOld)
    .filter(child => !equalThoughtRanked(child, head(thoughtsRankedLiveOld)))

  const contextParent = rootedContextOf(showContexts
    ? context
    : pathToContext(thoughtsRankedLiveOld)
  )
  const contextParentEncoded = hashContext(contextParent)

  const thoughtParentSubthoughts = showContexts ? getThoughts(state, contextParent)
    .filter(child =>
      (newOldThought || !equalThoughtRanked(child, { value: oldValue, rank: headRank(rootedContextOf(thoughtsRankedLiveOld)) })) &&
      !equalThoughtRanked(child, { value: newValue, rank: headRank(rootedContextOf(thoughtsRankedLiveOld)) })
    )
    // do not add floating thought to context
    .concat(thoughtOld.contexts.length > 0 ? {
      value: newValue,
      uuid,
      rank: headRank(rootedContextOf(thoughtsRankedLiveOld)),
      lastUpdated: timestamp()
    } : [])
    : null

  /**
   * Recursive function to change thought within the context of all descendants.
   *
   * @param contextRecursive The list of additional ancestors built up in recursive calls that must be concatenated to thoughtsNew to get the proper context.
   */
  const recursiveUpdates = (thoughtsRanked, contextRecursive = [], accumRecursive = {}) => {

    return getThoughtsRanked(state, thoughtsRanked).reduce((accum, child) => {

      const hashedKey = hashThought(child.value)
      const childThought = getThought(state, child.value)

      // this should only happen if there is a thoughtIndex integrity violation
      if (!childThought) {
        // console.error(`Missing child ${child.value} in ${pathToContext(thoughtsRanked)}`)
        const accumNew = {
          ...accumRecursive,
          ...accum,
        }
        return {
          ...recursiveUpdates(thoughtsRanked.concat(child), contextRecursive.concat(child.value), accumNew)
        }
      }

      // remove and add the new context of the child
      const contextNew = thoughtsNew.concat(showContexts ? value : []).concat(contextRecursive)
      const childNew = addContext(removeContext(childThought, pathToContext(thoughtsRanked), child.rank), contextNew, child.rank, child.uuid)

      // update local thoughtIndex so that we do not have to wait for firebase
      thoughtIndex[hashedKey] = childNew

      const accumNew = {
        // merge ancestor updates
        ...accumRecursive,
        // merge sibling updates
        // Order matters: accum must have precendence over accumRecursive so that contextNew is correct
        ...accum,
        // merge current thought updates
        [hashedKey]: {
          thoughtIndex: childNew,
          context: pathToContext(thoughtsRanked),
          // return parallel lists so that the old contextIndex can be deleted and new contextIndex can be added
          // TODO: This could be improved by putting it directly into the form required by contextIndex to avoid later merging
          contextsOld: ((accumRecursive[hashedKey] || {}).contextsOld || []).concat([pathToContext(thoughtsRanked)]),
          contextsNew: ((accumRecursive[hashedKey] || {}).contextsNew || []).concat([contextNew])
        }
      }

      // merge all updates and pass them on to the recursive call
      return {
        ...accumNew,
        ...recursiveUpdates(thoughtsRanked.concat(child), contextRecursive.concat(child.value), accumNew)
      }
    }, {})
  }

  const descendantUpdatesResult = recursiveUpdates(thoughtsRankedLiveOld)
  const descendantUpdates = _.transform(descendantUpdatesResult, (accum, value, key) => {
    accum[key] = value.thoughtIndex
  }, {})

  const contextIndexDescendantUpdates = _.transform(descendantUpdatesResult, (accum, result, key) => {
    const output = result.contextsOld.reduce((accumInner, contextOld, i) => {
      const contextNew = result.contextsNew[i]
      const contextOldEncoded = hashContext(contextOld)
      const contextNewEncoded = hashContext(contextNew)
      const thoughtsOld = getThoughts(state, contextOld)
      const thoughtsNew = getThoughts(state, contextNew)
      return {
        ...accumInner,
        [contextOldEncoded]: null,
        [contextNewEncoded]: {
          ...state.thoughts.contextIndex[contextOldEncoded],
          children: [...thoughtsOld, ...thoughtsNew],
          lastUpdated: timestamp()
        }
      }
    }, {})
    // eslint-disable-next-line fp/no-mutating-assign
    Object.assign(accum, output)
  }, {})

  const thoughtIndexUpdates = {
    // if the hashes of oldValue and newValue are equal, thoughtNew takes precedence since it contains the updated thought
    [oldKey]: newOldThought,
    [newKey]: thoughtNew,
    ...descendantUpdates
  }

  const contextIndexUpdates = {
    [contextNewEncoded]: {
      children: thoughtNewSubthoughts,
      lastUpdated: timestamp(),
    },
    ...showContexts ? {
      [contextOldEncoded]: {
        children: thoughtOldSubthoughts,
        lastUpdated: timestamp(),
      },
      [contextParentEncoded]: {
        children: thoughtParentSubthoughts,
        lastUpdated: timestamp(),
      }
    } : null,
    ...contextIndexDescendantUpdates
  }

  // preserve contextViews
  const contextViewsNew = { ...state.contextViews }
  if (state.contextViews[contextEncodedNew] !== state.contextViews[contextEncodedOld]) {
    contextViewsNew[contextEncodedNew] = state.contextViews[contextEncodedOld]
    delete contextViewsNew[contextEncodedOld] // eslint-disable-line fp/no-delete
  }

  // new state
  // do not bump data nonce, otherwise editable will be re-rendered
  const stateNew = {
    ...state,
    // update cursor so that the other contexts superscript and depth-bar will re-render
    // do not update cursorBeforeEdit by default as that serves as the transcendental head to identify the thought being edited
    cursor: cursorNew,
    contextViews: contextViewsNew,
  }

  return updateThoughts(stateNew, { thoughtIndexUpdates, contextIndexUpdates, recentlyEdited, contextChain })
}
