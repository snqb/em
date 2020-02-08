import React from 'react'
import { act } from 'react-dom/test-utils'
import Adapter from 'enzyme-adapter-react-16'
import { configure, mount } from 'enzyme'
import 'jest-localstorage-mock'

import App from './App.js'
import { handleKeyboard } from './shortcuts.js'

configure({ adapter: new Adapter() })

const createTestApp = async (app) => {
  document.getSelection = () => ({
    type: 'None',
    removeAllRanges: () => {},
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

  window.location = {
    pathname: '',
  }

  await act(async () => {
    // eslint-disable-next-line no-undef
    jest.useFakeTimers()
    const wrapper = await mount(
      <div
        id="keyboard"
        onKeyDown={handleKeyboard}
        tabIndex="0"
      >
        {app}
      </div>,
      { attachTo: document.body },
    )
    const skipTutorial = wrapper.find('div.modal-actions div a')
    skipTutorial.simulate('click')
    const keyboardResponder = wrapper.find('#keyboard')
    await keyboardResponder.simulate('keydown', { key: 'Enter' })
    // eslint-disable-next-line no-undef
    jest.runAllTimers()
    await wrapper.update()
    document.wrapper = wrapper
  })
}

const cleanupTestApp = () => {
  // eslint-disable-next-line fp/no-delete
  delete document.getSelection
  // eslint-disable-next-line fp/no-delete
  delete window.getSelection
  // eslint-disable-next-line fp/no-delete
  delete window.wrapper
}

beforeAll(async () => {
  createTestApp(<App />)
})

afterAll(() => {
  cleanupTestApp()
})
