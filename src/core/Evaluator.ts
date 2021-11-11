import Bouer from "../instance/Bouer";
import Extend from "../shared/helpers/Extend";
import {
  buildError,
  createEl, forEach,
  getDescriptor, GLOBAL, transferProperty
} from "../shared/helpers/Utils";
import Logger from "../shared/logger/Logger";
import dynamic from "../types/dynamic";
import IoC from "../shared/helpers/IoC";

type EvaluatorOptions = {
  data: object,
  expression: string,
  isReturn?: boolean,
  aditional?: object,
  args?: any[],
}

export default class Evaluator {
  private global: Window & typeof globalThis | null;
  private bouer: Bouer;

  constructor(bouer: Bouer) {
    IoC.Register(this);

    this.bouer = bouer;
    this.global = this.createWindow() as any;
  }

  private createWindow(){
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

  execRaw(expression: string, context?: object): void {
    // Executing the expression
    try {
      const mExpression = "(function(){ " + expression + " }).apply(this, arguments)";
      GLOBAL.Function(mExpression).apply(context || this.bouer);
    } catch (error) {
      Logger.error(buildError(error));
    }
  }

  exec(options: EvaluatorOptions) {
    let { data, args, expression, isReturn, aditional } = options;
    const mGlobal = this.global as dynamic;
    const noConfigurableProperties: dynamic = {};

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
      returnedValue = this.global!.Function(mExpression).apply(this.bouer, args);
    } catch (error) {
      Logger.error(buildError(error));
    }

    // Removing the properties
    forEach(keys, key => delete mGlobal[key]);
    return returnedValue;
  }
}
