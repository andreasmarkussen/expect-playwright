import type { Page, ElementHandle } from "playwright-core"
import { PageWaitForSelectorOptions } from "../../global"

const ExpectTypePage = "Page"
const ExpectTypeElementHandle = "ElementHandle"

type ExpectType = typeof ExpectTypePage | typeof ExpectTypeElementHandle

export type ExpectInputType = Page | ElementHandle

export const detectExpectType = (value: ExpectInputType): ExpectType => {
  const className = value.constructor.name
  switch (className) {
    case "Page":
      return ExpectTypePage
    case "ElementHandle":
      return ExpectTypeElementHandle
    default:
      throw new Error(`could not recognize type: ${className}`)
  }
}

interface getElementTextReturn {
  elementHandle: ElementHandle
  selector?: string
  expectedValue: string
}

export type InputArguments = [
  Page | ElementHandle,
  string?,
  (string | PageWaitForSelectorOptions)?,
  PageWaitForSelectorOptions?
]

const lastElementHasType = (
  args: InputArguments,
  type: "string" | "object"
): boolean => typeof args[args.length - 1] === type

const getSelectorOptions = (args: InputArguments) => {
  let selectorOptions: PageWaitForSelectorOptions | undefined = undefined
  if (args.length === 3 && lastElementHasType(args, "object")) {
    selectorOptions = args[2] as PageWaitForSelectorOptions
  }
  if (args.length === 4 && lastElementHasType(args, "object")) {
    selectorOptions = args[3] as PageWaitForSelectorOptions
  }
  return selectorOptions
}

export const getElementText = async (
  ...args: InputArguments
): Promise<getElementTextReturn> => {
  if (args.length > 1) {
    const type = detectExpectType(args[0])
    /**
     * Handle the following cases:
     * - expect(page).foo("bar")
     * - expect(element).foo("bar")
     */
    if (args.length === 2) {
      if (type === ExpectTypeElementHandle) {
        const iframe = await (args[0] as ElementHandle).contentFrame()
        const elem = iframe ? await iframe.$("body") : args[0]

        return {
          elementHandle: elem as ElementHandle,
          expectedValue: args[1] as string,
        }
      }
      const page = args[0] as Page
      return {
        elementHandle: (await page.$("body")) as ElementHandle,
        expectedValue: args[1] as string,
      }
    }
    /**
     * Handle the following case:
     * - expect(page).foo("#foo", "bar")
     */
    const selector = args[1] as string
    if (type === ExpectTypePage) {
      const page = args[0] as Page
      const selectorOptions = getSelectorOptions(args)
      try {
        await page.waitForSelector(selector, selectorOptions!)
      } catch (err) {
        throw new Error(`Timeout exceed for element ${quote(selector)}`)
      }
      return {
        elementHandle: (await page.$(selector)) as ElementHandle,
        expectedValue: args[2] as string,
      }
    }
    if (type === ExpectTypeElementHandle) {
      const iframe = await (args[0] as ElementHandle).contentFrame()
      const elem = iframe ? await iframe.$("body") : args[0]
      const selectorOptions = getSelectorOptions(args)
      try {
        await elem!.waitForSelector(selector, selectorOptions!)
      } catch (err) {
        throw new Error(`Timeout exceed for element ${quote(selector)}`)
      }
      return {
        elementHandle: (await elem!.$(selector)) as ElementHandle,
        expectedValue: args[2] as string,
      }
    }
  }
  throw new Error(`Invalid input length: ${args.length}`)
}

export const quote = (val: string | null) => (val === null ? "" : `'${val}'`)

export const getMessage = (
  { isNot, promise, utils }: jest.MatcherContext,
  matcher: string,
  expected: string | number | null,
  received: string | number | null
) => {
  const message = isNot
    ? `Expected: not ${utils.printExpected(expected)}`
    : `Expected: ${utils.printExpected(expected)}\n` +
      `Received: ${utils.printReceived(received)}`

  return (
    utils.matcherHint(matcher, undefined, undefined, { isNot, promise }) +
    "\n\n" +
    message
  )
}
