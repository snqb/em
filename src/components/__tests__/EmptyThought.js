it('create and edit empty thought', async () => {
  const thoughts = document.wrapper.find('div.transformContain div ul.children')
  const thought = thoughts.find(
    'li.leaf div.thought-container div.thought div.editable',
  )
  expect(thought.text()).toBe('')
  const keyboardResponder = document.wrapper.find('div#keyboard')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  jest.runAllTimers()
  await thought.update()
  expect(thought.text()).toBe('c')
})
