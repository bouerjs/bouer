export default interface IBouerConfig {
  /** Allow to render again all the array items on array changes */
  rerenderOnArrayChange: boolean

  /** Allow to use DOMContentLoaded event */
  useDOMLoadEvent: boolean

  /** Defines the default color of the skeleton */
  skeleton: { background: string, wave: string }

  /** Allow to use hash (#) on page navigation */
  usehash?: boolean

  /** Allow to keep the data modified during the component lifecycle */
  keepData?: boolean

  /** Allow to preload the component content when the application is ready */
  preload?: boolean
}
