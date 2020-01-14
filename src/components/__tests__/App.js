import React from 'react'
import { mount } from 'enzyme'
import { App } from '../App'

// eslint-disable-next-line no-undef
beforeAll(() => {
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

it('App', async () => {
  // eslint-disable-next-line no-undef
  jest.useFakeTimers()
  const wrapper = await mount(<App />, { attachTo: document.body })
  const skipTutorial = wrapper.find('div.modal-actions div a')
  skipTutorial.simulate('click')
  const keyboardResponder = wrapper.find('div#keyboard')
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  // eslint-disable-next-line no-undef
  jest.runAllTimers()
  await wrapper.update()
  const thoughts = wrapper.find('div.transformContain div ul')
  const thought = thoughts.find(
    'li.leaf div.thought-container div.thought div.editable',
  )
  // eslint-disable-next-line no-undef
  expect(thought.text()).toBe('')
  await thought.simulate('change', { target: { value: 'c' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  // eslint-disable-next-line no-undef
  jest.runAllTimers()
  await thought.update()
  // eslint-disable-next-line no-undef
  expect(thought.text()).toBe('c')
})
