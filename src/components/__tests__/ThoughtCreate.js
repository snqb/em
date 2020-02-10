it('create thought', async () => {
  const thought = document.wrapper.find('div.editable')
  expect(thought.text()).toBe('')
})
