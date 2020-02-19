import { getThoughtsRanked } from '../../util.js'

it('edit subthought', async () => {
  const thought = document.wrapper.find('div.editable')
  expect(thought.text()).toBe('')
  const keyboardResponder = document.wrapper.find('div#keyboard')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter', ctrlKey: true })
  jest.runAllTimers()
  await thought.update()
  expect(thought.text()).toBe('c')
  expect(getThoughtsRanked(['c'])[0].value).toBe('')
  await document.wrapper.update()
  const subthought = document.wrapper.find(
    'ul.distance-from-cursor-0 li.leaf div.thought-container div.thought div.editable',
  )
  await subthought.simulate('change', { target: { value: 's' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  jest.runAllTimers()
  await subthought.update()
  expect(subthought.text()).toBe('s')
  expect(getThoughtsRanked(['c'])[0].value).toBe('')
})
