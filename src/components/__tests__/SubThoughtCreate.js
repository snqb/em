import { getThoughtsRanked } from '../../util.js'

it('create subthought', async () => {
  const thought = document.wrapper.find('div.editable')
  expect(thought.text()).toBe('')
  const keyboardResponder = document.wrapper.find('#keyboard')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter', ctrlKey: true })
  await thought.update()
  jest.runAllTimers()
  expect(thought.text()).toBe('c')
  expect(getThoughtsRanked(['c'])[0].value).toBe('')
})
