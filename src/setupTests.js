import Adapter from 'enzyme-adapter-react-16'
import { configure, mount } from 'enzyme'
import 'jest-localstorage-mock'

configure({ adapter: new Adapter() })

window.createTestApp = async (app) => {
  // eslint-disable-next-line no-undef
  jest.useFakeTimers()
  const wrapper = await mount(app, { attachTo: document.body })
  const skipTutorial = wrapper.find('div.modal-actions div a')
  skipTutorial.simulate('click')
  const keyboardResponder = wrapper.find('div#keyboard')
  await keyboardResponder.simulate('keydown', { key: 'Enter' })
  // eslint-disable-next-line no-undef
  jest.runAllTimers()
  await wrapper.update()
  return wrapper
}
