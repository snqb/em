import { act } from 'react-dom/test-utils'
import { getThoughtsRanked } from '../../util.js'

it('delete subthought', async () => {
  const thought = document.wrapper.find(
    'li.leaf div.thought-container div.thought div.editable',
  )
  expect(thought.text()).toBe('')
  const keyboardResponder = document.wrapper.find('div#keyboard')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter', ctrlKey: true })
  jest.runAllTimers()
  await thought.update()
  expect(thought.text()).toBe('c')
  // eslint-disable-next-line fp/no-let
  let subthoughtsData = getThoughtsRanked(['c'])
  // eslint-disable-next-line fp/no-let
  let subthoughtData = subthoughtsData[0]
  expect(subthoughtData.value).toBe('')
  await document.wrapper.update()
  const subthought = document.wrapper.find(
    'ul.distance-from-cursor-0 li.leaf div.thought-container div.thought div.editable',
  )
  jest.runAllTimers()
  await subthought.update()
  expect(subthought.text()).toBe('')
  subthoughtsData = getThoughtsRanked(['c'])
  subthoughtData = subthoughtsData[0]
  expect(subthoughtData.value).toBe('')
  await act(async () => {
    await subthought.simulate('keydown', { key: 'Backspace' })
  })
  subthoughtsData = getThoughtsRanked(['c'])
  expect(subthoughtsData.length).toBe(0)
})
