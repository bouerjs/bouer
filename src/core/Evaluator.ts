import Bouer from "../instance/Bouer";
import Extend from "../shared/helpers/Extend";
import {
  buildError,
  createEl, forEach,
  getDescriptor, GLOBAL, transferProperty
} from "../shared/helpers/Utils";
import Logger from "../shared/logger/Logger";
import IoC from "../shared/helpers/IoC";
import dynamic from "../definitions/types/Dynamic";
import { Component, IComponent } from "..";

export default class Evaluator {
  private global: Window & typeof globalThis | null;
  private bouer: Bouer;

  constructor(bouer: Bouer) {
		this.bouer = bouer;
    this.global = this.createWindow() as any;

    IoC.Register(this);
  }

  private createWindow() {
    let mWindow: Window | null;

    createEl('iframe', (frame, dom) => {
      frame.style.display = 'none!important';
      dom.body.appendChild(frame);
      mWindow = frame.contentWindow;
      dom.body.removeChild(frame);
    });
    delete (mWindow! as any).name;
    return mWindow!;
  }

  execRaw(expression: string, context?: Bouer | Component): void {
    // Executing the expression
    try {
      const mExpression = "(function(){ " + expression + " }).apply(this, arguments)";
      GLOBAL.Function(mExpression).apply(context || this.bouer);
    } catch (error) {
      Logger.error(buildError(error));
    }
  }

  exec(options: {
    data: object,
    expression: string,
    isReturn?: boolean,
    aditional?: dynamic,
    args?: any[],
		context: Bouer | Component
  }) {
    let { data, args, expression, isReturn, aditional, context } = options;
    const mGlobal = this.global as dynamic;
    const noConfigurableProperties: dynamic = {};
		context = context || this.bouer;

    let dataToUse: dynamic = Extend.obj(aditional || {});
    // Defining the scope data
    forEach(Object.keys(data), key => {
      transferProperty(dataToUse, data, key);
    });
    // Applying the global data to the dataToUse variable
    forEach(Object.keys(this.bouer.globalData!), key => {
      if (key in dataToUse)
        return Logger.warn('It was not possible to use the globalData property "' + key +
          '" because it already defined in the current scope.');
      transferProperty(dataToUse, this.bouer.globalData, key);
    });

    const keys = Object.keys(dataToUse);
    let returnedValue: any;

    // Spreading all the properties
    forEach(keys, key => {
      delete mGlobal[key];

      // In case of non-configurable property store them to be handled
      if (key in mGlobal && getDescriptor(mGlobal, key)!.configurable === true)
        noConfigurableProperties[key] = mGlobal[key];

      if (key in noConfigurableProperties)
        mGlobal[key] = dataToUse[key];

      transferProperty(mGlobal, dataToUse, key);
    });

    // Executing the expression
    try {
      const mExpression = 'return(function(){"use strict"; ' +
        (isReturn === false ? '' : 'return') + ' ' + expression + ' }).apply(this, arguments)';
      returnedValue = this.global!.Function(mExpression).apply(context, args);
    } catch (error) {
      Logger.error(buildError(error));
    }

    // Removing the properties
    forEach(keys, key => delete mGlobal[key]);
    return returnedValue;
  }
}
