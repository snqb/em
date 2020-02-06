import React from 'react'
import App from '../../App'
import { getThoughtsRanked } from '../../util.js'

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
  await keyboardResponder.simulate('keydown', { key: 'Enter', ctrlKey: true })
  // eslint-disable-next-line no-undef
  jest.runAllTimers()
  await thought.update()
  // eslint-disable-next-line no-undef
  expect(thought.text()).toBe('c')
  // eslint-disable-next-line fp/no-let
  let subthoughtsData = getThoughtsRanked(['c'])
  // eslint-disable-next-line fp/no-let
  let subthoughtData = subthoughtsData[0]
  // eslint-disable-next-line no-undef
  expect(subthoughtData.value).toBe('')
  await wrapper.update()
  const subthought = wrapper.find(
    'ul.distance-from-cursor-0 li.leaf div.thought-container div.thought div.editable',
  )
  await subthought.simulate('change', { target: { value: 's' } })
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  // eslint-disable-next-line no-undef
  jest.runAllTimers()
  await subthought.update()
  // eslint-disable-next-line no-undef
  expect(subthought.text()).toBe('s')
  subthoughtsData = getThoughtsRanked(['c'])
  subthoughtData = subthoughtsData[0]
  // eslint-disable-next-line no-undef
  expect(subthoughtData.value).toBe('s')
})
