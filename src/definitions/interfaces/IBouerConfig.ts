export default interface IBouerConfig {
  /** Allow to use hash (#) on page navigation, by default is `true` */
  usehash?: boolean;

  /** Allow to keep the data modified during the component lifecycle */
  activeClassName?: string;

  /** Allow to prefetch the component content when the application is ready, by default is `true` */
  prefetch?: boolean;

  /** Defines the default color of the skeleton */
  skeleton?: { background: string, wave: string }

	/** Allow to unbind an Element if isn't connected to the DOM, by default is `true` */
	autoUnbind?: boolean;

	/** Allow to remove listeners when the Element isn't connected to the DOM, by default is `true` */
	autoOffEvent?: boolean;
}