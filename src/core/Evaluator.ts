import RenderContext from '../definitions/types/RenderContext';
import dynamic from '../definitions/types/Dynamic';
import Bouer from '../instance/Bouer';
import Extend from '../shared/helpers/Extend';
import { buildError } from '../shared/helpers/Utils';
import Logger from '../shared/logger/Logger';

export default class Evaluator {
  bouer: Bouer;

  constructor(bouer: Bouer) {
    this.bouer = bouer;
  }

  execRaw(code: string, context?: RenderContext) {
    // Executing the expression
    try {
      Function(code).call(context || this.bouer);
    } catch (error) {
      Logger.error(buildError(error));
    }
  }

  exec(opts: {
    data: object,
    code: string,
    isReturn?: boolean,
    aditional?: dynamic,
    args?: any[],
    context: RenderContext
  }) {
    const dataToUse = Extend.obj(
      (this.bouer.globalData || {}),
      (opts.aditional || {}),
      (opts.data || {}),
      {
        $root: this.bouer.data,
        $mixin: Extend.mixin
      });

    delete (opts as any).data;
    opts.data = dataToUse;
    return Evaluator.run(opts);
  }

  static run(opts: {
    code: string,
    data?: object,
    args?: any[],
    isReturn?: boolean,
    context?: RenderContext
  }) {
    try {
      return Function('var d$=arguments[0].d;return(function(){var r$;with(d$){' +
        (opts.isReturn === false ? '' : 'r$=') + opts.code + '}return r$;}).apply(this, arguments[0].a)')
        .call(opts.context, { d: opts.data || {}, a: opts.args });
    } catch (error) {
      Logger.error(buildError(error));
    }
  }
}
