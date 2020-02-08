import { act } from 'react-dom/test-utils'

it('delete thought', async () => {
  const thought = document.wrapper.find(
    'li.leaf div.thought-container div.thought div.editable',
  )
  expect(thought.text()).toBe('')
  const keyboardResponder = document.wrapper.find('div#keyboard')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  jest.runAllTimers()
  await thought.update()
  expect(thought.text()).toBe('c')
  await keyboardResponder.simulate('keydown', { key: 'Backspace' })
  await thought.simulate('change', { target: { value: '' } })
  await act(async () => {
    await thought.simulate('keydown', { key: 'Backspace' })
  })
  jest.runAllTimers()
  await document.wrapper.update()
  const emptythoughts = document.wrapper.find('div.transformContain div ul.children')
  expect(emptythoughts.length).toBe(0)
})
