import React from 'react'
import { App } from '../App'

// eslint-disable-next-line fp/no-let
let wrapper = null

// eslint-disable-next-line no-undef
beforeAll(async () => {
  wrapper = await window.createTestApp(<App />)
})

// eslint-disable-next-line no-undef
afterAll(() => {
  window.cleanupTestApp()
  wrapper = null
})

it('create and edit subthought', async () => {
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
