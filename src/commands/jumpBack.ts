import Command from '../@types/Command'
import { jumpActionCreator as jump } from '../actions/jump'
import JumpBackIcon from '../components/icons/JumpBackIcon'

const jumpBackShortcut: Command = {
  id: 'jumpBack',
  label: 'Jump Back',
  description: 'Move the cursor to the last thought that was edited.',
  keyboard: { key: 'j', meta: true },
  gesture: 'lul',
  multicursor: 'ignore',
  svg: JumpBackIcon,
  exec: dispatch => {
    dispatch(jump(-1))
  },
}

export default jumpBackShortcut