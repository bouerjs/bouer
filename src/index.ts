import IBouerOptions from './definitions/interfaces/IBouerOptions';
import Bouer from './instance/Bouer';
import IoCContainer, { $inject } from './shared/helpers/IoCContainer';

export default Bouer;

export { default as Compiler } from './core/compiler/Compiler';
export { Component, default as ComponentPrototype } from './core/component/Component';
export { $computed, default as Computed } from './core/reactive/Computed';
export { $inert, $reactive, default as ReactivePropertyDescriptor } from './core/reactive/Reactive';
export { default as Watch } from './core/binder/Watch';
export { default as Routing } from './core/routing/Routing';
export { default as ViewChild } from './core/ViewChild';

export { $field, default as FieldSchema } from './core/form/FieldSchema';
export { $form, default as FormHandler } from './core/form/FormHandler';
export { default as FormSchema } from './core/form/FormSchema';

export { default as Extend } from './shared/helpers/Extend';
export { default as Property } from './shared/helpers/Property';

export { default as IMiddlewareResult } from './core/middleware/IMiddlewareResult';
export { default as IAsset } from './definitions/interfaces/IAsset';
export { default as IBinderConfig } from './definitions/interfaces/IBinderConfig';
export { default as IBouerConfig } from './definitions/interfaces/IBouerConfig';
export { default as IComponentOptions } from './definitions/interfaces/IComponentOptions';
export { default as IDelimiter } from './definitions/interfaces/IDelimiter';
export { default as IDelimiterResponse } from './definitions/interfaces/IDelimiterResponse';
export { default as IEventEmitterOptions } from './definitions/interfaces/IEventEmitterOptions';
export { default as IEventModifiers } from './definitions/interfaces/IEventModifiers';
export { default as IEventSubscription } from './definitions/interfaces/IEventSubscription';
export { default as IMiddleware } from './definitions/interfaces/IMiddleware';

export { default as CustomDirective } from './definitions/types/CustomDirective';
export { default as DataType } from './definitions/types/DataType';
export { default as dynamic } from './definitions/types/Dynamic';
export { default as RenderContext } from './definitions/types/RenderContext';
export { default as SkeletonOptions } from './definitions/types/SkeletonOptions';
export { default as WatchCallback } from './definitions/types/WatchCallback';

export * from './definitions/interfaces/IFieldSchema';
export { prop } from './core/compiler/Directive/DataInject';
export { code, setData, webRequest } from './shared/helpers/Utils';

/**
 * Creates a new bouer app
 * @param {string} selector the selector of the element to be controlled by the instance
 * @param {object?} options the options to the instance
 * @returns Bouer instance
 */
export function $createApp<Data extends {} = {}, Global extends {} = {}, Deps extends {} = {}>(
  selector?: string, options?: IBouerOptions<Data, Global, Deps>
) {
  return new Bouer<Data, Global, Deps>(selector, options);
};

export class IoC {
  /**
   * Adds a service to generic app
   * @param ctor the service that should be resolved future on
   * @param params the parameter that needs to be resolved every time the service is requested.
   * @param isSingleton mark the service as singleton to avoid creating an instance whenever it's requested
   */
  static add = IoCContainer.add;
  /**
   * Resolves the Service with all it's dependencies
   * @param ctor the class the needs to be resolved
   * @returns the instance of the class resolved
   */
  static resolve = IoCContainer.resolve;
}

export { $inject, IBouerOptions };
