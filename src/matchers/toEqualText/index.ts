import { AsyncExpectationResult } from 'expect/build/types'
import { getElementText, quote, InputArguments } from '../utils'

const toEqualText = async (...args: InputArguments): AsyncExpectationResult => {
  const { elementHandle, selector, expectedValue } = await getElementText(...args)
  /* istanbul ignore next */
  const actualTextContent = await elementHandle.evaluate((el) => el.textContent)
  if (actualTextContent === expectedValue) {
    return {
      pass: true,
      message: () => `${quote(expectedValue)} does not equal ${quote(actualTextContent)}.`
    }
  }
  return {
    pass: false,
    message: () => `${quote(expectedValue)} does not equal ${quote(actualTextContent)}${selector ? ' of ' + quote(selector) + "." : '.'}`
  }
}

export default toEqualText