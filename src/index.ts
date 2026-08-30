import IBouerOptions from './definitions/interfaces/IBouerOptions';
import Bouer from './instance/Bouer';

export { default as Components, Component } from './core/component/Component';

export { default as ReactivePropertyDescriptor, $reactive, $inert } from './core/reactive/Reactive';
export { default as Computed, $computed } from './core/reactive/Computed';

export { default as Compiler } from './core/compiler/Compiler';
export { default as Routing } from './core/routing/Routing';
export { default as Watch } from './core/binder/Watch';
export { default as ViewChild } from './core/ViewChild';

export { default as FormHandler, $form } from './core/form/FormHandler';
export { default as FormSchema } from './core/form/FormSchema';
export { default as FieldSchema, $field } from './core/form/FieldSchema';

export { default as Extend } from './shared/helpers/Extend';
export { default as Prop } from './shared/helpers/Prop';
export { default as IoC } from './shared/helpers/IoCContainer';

export { default as IBouerConfig } from './definitions/interfaces/IBouerConfig';
export { default as IComponentOptions } from './definitions/interfaces/IComponentOptions';
export { default as IBinderConfig } from './definitions/interfaces/IBinderConfig';
export { default as IDelimiter } from './definitions/interfaces/IDelimiter';
export { default as IDelimiterResponse } from './definitions/interfaces/IDelimiterResponse';
export { default as IMiddleware } from './definitions/interfaces/IMiddleware';
export { default as IEventModifiers } from './definitions/interfaces/IEventModifiers';
export { default as IEventSubscription } from './definitions/interfaces/IEventSubscription';
export { default as IEventEmitterOptions } from './definitions/interfaces/IEventEmitterOptions';
export { default as IAsset } from './definitions/interfaces/IAsset';
export { default as IMiddlewareResult } from './core/middleware/IMiddlewareResult';

export { default as dynamic } from './definitions/types/Dynamic';
export { default as CustomDirective } from './definitions/types/CustomDirective';
export { default as RenderContext } from './definitions/types/RenderContext';
export { default as SkeletonOptions } from './definitions/types/SkeletonOptions';
export { default as WatchCallback } from './definitions/types/WatchCallback';
export { default as DataType } from './definitions/types/DataType';

export * from './definitions/interfaces/IFieldSchema';
export * from './shared/helpers/Utils';

/**
 * Creates a new bouer app
 * @param {string} selector the selector of the element to be controlled by the instance
 * @param {object?} options the options to the instance
 * @returns Bouer instance
 */
function $createApp<Data extends {} = {}, Global extends {} = {}, Deps extends {} = {}>(
  selector?: string,
  options?: IBouerOptions<Data, Global, Deps>
) {
  return new Bouer<Data, Global, Deps>(selector, options);
}

export { Bouer as default, IBouerOptions, $createApp };