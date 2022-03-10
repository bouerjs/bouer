import RenderContext from '../definitions/types/RenderContext';
import dynamic from '../definitions/types/Dynamic';
import Bouer from '../instance/Bouer';
import Extend from '../shared/helpers/Extend';
import ServiceProvider from '../shared/helpers/ServiceProvider';
import { buildError } from '../shared/helpers/Utils';
import Logger from '../shared/logger/Logger';
import Base from './Base';

export default class Evaluator extends Base {
  bouer: Bouer;

  constructor(bouer: Bouer) {
    super();
    this.bouer = bouer;
    ServiceProvider.add('Evaluator', this);
  }

  execRaw(code: string, context?: RenderContext): void {
    // Executing the expression
    try {
      Function('(function(){ ' + code + ' }).call(this)')
        .call(context || this.bouer);
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
    const dataToUse = Extend.obj((aditional || {}), (data || {}),
      {
        $root: this.bouer.data,
        $mixin: Extend.mixin
      });

    try {
      return Function('var d$=arguments[0].d;return(function(){var r$;with(d$){' +
        (isReturn === false ? '' : 'r$=') + expression + '}return r$;}).apply(this, arguments[0].a)')
        .call((context || this.bouer), { d: dataToUse, a: args });
    } catch (error) {
      Logger.error(buildError(error));
    }
  }
}
