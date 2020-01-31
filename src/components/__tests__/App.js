import React from 'react'
import { App } from '../App'

// eslint-disable-next-line no-undef
beforeAll(async () => {
  document.getSelection = () => ({
    type: 'None',
  })
  document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
    collapse: () => {},
  })
  window.getSelection = () => ({
    focusOffset: 3,
    removeAllRanges: () => {},
    addRange: () => {},
  })
})

// eslint-disable-next-line no-undef
afterAll(() => {
  // eslint-disable-next-line fp/no-delete
  delete document.getSelection
  // eslint-disable-next-line fp/no-delete
  delete window.getSelection
})

it('create and edit empty thought', async () => {
  const wrapper = await window.createTestApp(<App />)
  const thoughts = wrapper.find('div.transformContain div ul')
  const thought = thoughts.find(
    'li.leaf div.thought-container div.thought div.editable',
  )
  // eslint-disable-next-line no-undef
  expect(thought.text()).toBe('')
  const keyboardResponder = wrapper.find('div#keyboard')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  // eslint-disable-next-line no-undef
  jest.runAllTimers()
  await thought.update()
  // eslint-disable-next-line no-undef
  expect(thought.text()).toBe('c')
})

it('create and edit subthought', async () => {
  const wrapper = await window.createTestApp(<App />)
  const thoughts = wrapper.find('div.transformContain div ul')
  const thought = thoughts.find(
    'li.leaf div.thought-container div.thought div.editable',
  )
  // eslint-disable-next-line no-undef
  expect(thought.text()).toBe('')
  const keyboardResponder = wrapper.find('div#keyboard')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  // eslint-disable-next-line no-undef
  jest.runAllTimers()
  await thought.update()
  // eslint-disable-next-line no-undef
  expect(thought.text()).toBe('c')
})
