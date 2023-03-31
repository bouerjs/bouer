import RenderContext from '../definitions/types/RenderContext';
import dynamic from '../definitions/types/Dynamic';
import Bouer from '../instance/Bouer';
import Extend from '../shared/helpers/Extend';
import IoC from '../shared/helpers/IoCContainer';
import { buildError } from '../shared/helpers/Utils';
import Logger from '../shared/logger/Logger';
import Base from './Base';

export default class Evaluator extends Base {
  bouer: Bouer;

  constructor(bouer: Bouer) {
    super();
    this.bouer = bouer;
    IoC.register(bouer, this);
  }

  execRaw(code: string, context?: RenderContext) {
    // Executing the expression
    try {
      Function(code).call(context || this.bouer);
    } catch (error) {
      Logger.error(buildError(error));
    }
  }

  exec(options: {
    data: object,
    code: string,
    isReturn?: boolean,
    aditional?: dynamic,
    args?: any[],
    context: RenderContext
  }) {
    const { data, args, code: expression, isReturn, aditional, context } = options;
    const dataToUse = Extend.obj(
      (this.bouer.globalData || {}),
      (aditional || {}),
      (data || {}),
      {
        $root: this.bouer.data,
        $mixin: Extend.mixin
      });

    return Evaluator.run({
      code: expression,
      data: dataToUse,
      isReturn: isReturn,
      context: context,
      args: args,
    });
  }

  static run(options: {
    code: string,
    data?: object,
    args?: any[],
    isReturn?: boolean,
    context?: RenderContext
  }) {
    try {
      const { data, args, code: expression, isReturn, context } = options;
      return Function('var d$=arguments[0].d;return(function(){var r$;with(d$){' +
        (isReturn === false ? '' : 'r$=') + expression + '}return r$;}).apply(this, arguments[0].a)')
        .call(context, { d: data || {}, a: args });
    } catch (error) {
      Logger.error(buildError(error));
    }
  }
}
