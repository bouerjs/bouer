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
import Evaluator from "../Evaluator";
import ReactiveEvent from "../event/ReactiveEvent";
import Reactive from "../reactive/Reactive";
import Watch from "./Watch";
import dynamic from "../../types/dynamic";
import { delimiterResponse } from "../../types/delimiterResponse";
import IoC from "../../shared/helpers/IoC";
import watchCallback from "../../types/watchCallback";

export default class Binder {
  bouer: Bouer;
  evaluator: Evaluator;
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
    IoC.Register(this);

    this.evaluator = IoC.Resolve('Evaluator')!;
    this.bouer = bouer;
    this.cleanup();
  }

  create(options: {
    node: Node,
    data: dynamic,
    fields: delimiterResponse[],
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
            return data[originalValue] = ownerElement[propertyNameToBind];
        }
      }

      ReactiveEvent.once('AfterGet', event => {
        event.onemit = reactive => {
          this.binds.push(reactive.watch(value => {
            callback(this.BindingDirection.fromDataToInput, value)
            onChange(value, node);
          }, node));
        }

        const result = this.evaluator.exec({
          expression: originalValue,
          data: data
        });

        ownerElement[propertyNameToBind] = (isObject(result) ? toStr(result) : (isNull(result) ? '' : result))
      });

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

    ReactiveEvent.once('AfterGet', event => {
      event.onemit = reactive => {
        this.binds.push(reactive.watch(value => {
          setter();
          onChange(value, node);
        }, node));
      }

      setter();
    });

    propertyBindConfig.boundNode = nodeToBind;
    return propertyBindConfig;
  }

  watch(propertyName: string, callback: watchCallback, targetObject?: object) {
    let mWatch: Watch<any, any> | null = null;
    const mTargetObject = targetObject || this.bouer.data;

    ReactiveEvent.once('AfterGet', event => {
      event.onemit = reactive => mWatch = reactive.watch(callback);
      const _ = (mTargetObject as any)[propertyName];
    });

    return mWatch;
  }

  /** Creates a process for unbind properties when it does not exists anymore in the DOM */
  private cleanup() {
    taskRunner(() => {
      const availableBinds: Watch<any, any>[] = [];

      forEach(this.binds, watch => {
        if (!watch.node) return availableBinds.push(watch);
        if (watch.node.isConnected) return availableBinds.push(watch);
        watch.destroy();
      })

      this.binds = availableBinds;
    }, 1000);
  }
}
