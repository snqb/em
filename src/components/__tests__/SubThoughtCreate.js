import { getThoughtsRanked } from '../../util.js'

it('create subthought', async () => {
  const thought = document.wrapper.find('div.editable')
  expect(thought.text()).toBe('')
  const keyboardResponder = document.wrapper.find('div#keyboard')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter', ctrlKey: true })
  jest.runAllTimers()
  await thought.update()
  expect(thought.text()).toBe('c')
  const subthoughtsData = getThoughtsRanked(['c'])
  const subthoughtData = subthoughtsData[0]
  expect(subthoughtData.value).toBe('')
})
