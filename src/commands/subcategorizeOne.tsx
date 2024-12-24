import Command from '../@types/Command'
import { subCategorizeOneActionCreator as subCategorizeOne } from '../actions/subCategorizeOne'
import { subcategorizeMulticursorActionCreator as subcategorizeMulticursor } from '../actions/subcategorizeMulticursor'
import SubCategorizeOneIcon from '../components/icons/SubCategorizeOneIcon'
import hasMulticursor from '../selectors/hasMulticursor'
import isDocumentEditable from '../util/isDocumentEditable'

const multicursor: Command['multicursor'] = {
  enabled: true,
  execMulticursor: (_cursors, dispatch) => dispatch(subcategorizeMulticursor()),
  preventSetCursor: true,
  clearMulticursor: true,
}

// NOTE: The keyboard shortcut for New Uncle handled in New Thought command until it is confirmed that shortcuts are evaluated in the correct order
const subCategorizeOneShortcut: Command = {
  id: 'subcategorizeOne',
  label: 'Subcategorize',
  description: 'Move the current thought into a new, empty thought at the same level.',
  gesture: 'lu',
  keyboard: { key: 'o', meta: true, alt: true },
  multicursor,
  svg: SubCategorizeOneIcon,
  canExecute: state => {
    return isDocumentEditable() && (!!state.cursor || hasMulticursor(state))
  },
  exec: dispatch => dispatch(subCategorizeOne()),
}

// a shortcut for Raine until we have custom user shortcuts
export const subCategorizeOneShortcutAlias: Command = {
  id: 'subcategorizeOneAlias',
  label: 'Subcategorize',
  hideFromHelp: true,
  keyboard: { key: ']', meta: true },
  multicursor,
  svg: SubCategorizeOneIcon,
  canExecute: state => {
    return isDocumentEditable() && (!!state.cursor || hasMulticursor(state))
  },
  exec: dispatch => dispatch(subCategorizeOne()),
}

export default subCategorizeOneShortcut