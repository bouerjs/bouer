import Bouer from "../instance/Bouer";
import { Constants } from "../../shared/helpers/Constants";
import {
  createEl,
  forEach, isFunction, isNull,
  isObject,
  taskRunner,
  toStr,
  trim
} from "../../shared/helpers/Utils";
import { DelimiterResult } from "../DelimiterHandler";
import Evalutator from "../Evaluator";
import ReactiveEvent from "../event/ReactiveEvent";
import Reactive from "../reactive/Reactive";
import Watch from "./Watch";

export default class Binder {
  /**
   * Provide the instance of the class.
   * link: https://refactoring.guru/design-patterns/singleton
   */
  static singleton: Binder;

  bouer: Bouer;
  evaluator: Evalutator;
  binds: Watch<any, any>[] = [];

  private DEFAULT_BINDER_PROPERTIES: any = {
    'text': 'value',
    'number': 'valueAsNumber',
    'checkbox': 'checked',
    'radio': 'checked'
  }
  private BindingDirection = {
    fromInputToData: 'to-data-property',
    fromDataToInput: 'to-input'
  }

  constructor(bouer: Bouer) {
    Binder.singleton = this;

    this.evaluator = Evalutator.singleton;
    this.bouer = bouer;
    this.cleanup();
  }

  create(options: {
    node: Node,
    data: object,
    fields: DelimiterResult[],
    eReplace?: boolean, // Allow to e-[?] replacing
    onChange?: (value: any, node: Node) => void
  }) {
    const { node, data, fields, eReplace } = options;
    const originalValue = trim(node.nodeValue ?? '');
    const originalName = node.nodeName;
    const ownerElement = (node as any).ownerElement || node.parentNode;
    const onChange = options.onChange || ((value: any, node: Node) => { });
    // let reactiveEvent: ReactiveEvent | undefined;

    // Clousure cache property settings
    const propertyBindConfig = {
      name: originalName,
      value: originalValue,
      bindOptions: options,
      boundNode: node
    };

    // Two-Way Data Binding: e-bind:[?]="..."
    if (originalName.substr(0, Constants.bind.length) === Constants.bind) {
      let propertyNameToBind = '';
      if (Constants.bind === originalName) {
        propertyNameToBind = this.DEFAULT_BINDER_PROPERTIES[ownerElement.type] || 'value';
      } else {
        propertyNameToBind = originalName.split(':')[1]; // e-bind:value -> value
      }

      const callback = (direction: string, value: any) => {
        switch (direction) {
          case this.BindingDirection.fromDataToInput:
            return ownerElement[propertyNameToBind] = value;
          case this.BindingDirection.fromInputToData:
            return (data as any)[originalValue] = ownerElement[propertyNameToBind];
        }
      }

      const reactiveEvent = ReactiveEvent.on('AfterGet', (reactive: Reactive<any, any>) => {
        this.binds.push(reactive.watch(value => {
          callback(this.BindingDirection.fromDataToInput, value)
          onChange(value, node);
        }, node));
      })

      const result = this.evaluator.exec({
        expression: originalValue,
        data: data
      });

      if (reactiveEvent)
        ReactiveEvent.off('AfterGet', reactiveEvent.callback);

      ownerElement[propertyNameToBind] = (isObject(result) ? toStr(result) : (isNull(result) ? '' : result))

      const listeners = [ownerElement.nodeName.toLowerCase(), 'propertychange', 'change'];

      const callbackEvent = () => {
        callback(this.BindingDirection.fromInputToData, ownerElement[propertyNameToBind]);
      }

      // Applying the events
      forEach(listeners, listener => ownerElement.addEventListener(listener, callbackEvent, false));

      // Removing the e-bind attr
      ownerElement.removeAttribute(node.nodeName);
      return propertyBindConfig; // Stop Two-Way Data Binding Process
    }

    // One-Way Data Binding
    let nodeToBind = node;

    // If definable property e-[?]="..."
    if (originalName.substr(0, Constants.property.length) === Constants.property && isNull(eReplace)) {
      propertyBindConfig.name = originalName.substr(Constants.property.length);
      ownerElement.setAttribute(propertyBindConfig.name, originalValue);
      nodeToBind = ownerElement.attributes[propertyBindConfig.name];

      // Removing the e-[?] attr
      ownerElement.removeAttribute(node.nodeName);
    }

    // Property value setter
    const setter = () => {
      let valueToSet = propertyBindConfig.value;
      let isHtml = false;

      // Looping all the fields to be setted
      forEach(fields, field => {
        const delimiter = field.delimiter;

        if (delimiter && delimiter.name === 'html')
          isHtml = true;

        let result = this.evaluator.exec({
          expression: field.expression,
          data: data
        });

        result = isNull(result) ? '' : result;
        valueToSet = valueToSet.replace(field.field, toStr(result));

        if (delimiter && isFunction(delimiter.action))
          valueToSet = delimiter.action!(valueToSet, node, data);
      });

      if (!isHtml)
        nodeToBind.nodeValue = valueToSet;
      else {
        const htmlData = createEl('div', el => {
          el.innerHTML = valueToSet;
        }).build().children[0];
        ownerElement.appendChild(htmlData);
        // TODO: Compile HTML Element Here
      }
    }

    // Listening to the property get only if the callback function is defined
    const reactiveEvent = ReactiveEvent.on('BeforeGet', reactive => {
      this.binds.push(reactive.watch(value => {
        setter();
        onChange(value, node);
      }, node));
    })

    setter();

    if (reactiveEvent)
      ReactiveEvent.off('BeforeGet', reactiveEvent.callback);

    propertyBindConfig.boundNode = nodeToBind;
    return propertyBindConfig;
  }

  /** Creates a process for unbind properties when it does not exists anymore in the DOM */
  private cleanup() {
    taskRunner(() => forEach(this.binds, (watch, index) => {
      if (!watch.node) return;

      if (watch.node.isConnected) return;
      watch.destroy();
      this.binds.splice(index, 1);
    }), 1000);
  }
}
