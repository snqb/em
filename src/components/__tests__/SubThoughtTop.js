import { getThoughtsRanked } from '../../util.js'

it('create top subthought', async () => {
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
  await subthought.simulate('change', { target: { value: 's' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  jest.runAllTimers()
  await subthought.update()
  expect(subthought.text()).toBe('s')
  subthoughtsData = getThoughtsRanked(['c'])
  subthoughtData = subthoughtsData[0]
  expect(subthoughtData.value).toBe('s')
  await keyboardResponder.simulate('keydown', { key: 'Enter', shifKey: true, metaKey: true })
  const subthoughttop = document.wrapper.find(
    'ul.distance-from-cursor-0 li.leaf div.thought-container div.thought div.editable',
  )
  await document.wrapper.update()
  jest.runAllTimers()
  await subthoughttop.update()
  expect(subthoughttop.length).toBe(2)
  // expect(subthoughttop.at(0).text()).toBe('')
})
