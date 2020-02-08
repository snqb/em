it('create thought above', async () => {
  const thought = document.wrapper.find(
    'li.leaf div.thought-container div.thought div.editable',
  )
  expect(thought.text()).toBe('')
  const keyboardResponder = document.wrapper.find('div#keyboard')
  await keyboardResponder.simulate('keydown', { key: 'Enter', shiftKey: true })
  const abovethought = document.wrapper.find(
    'li.leaf div.thought-container div.thought div.editable',
  )
  expect(abovethought.text()).toBe('')
  await abovethought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  jest.runAllTimers()
  await abovethought.update()
  expect(abovethought.text()).toBe('c')
})
