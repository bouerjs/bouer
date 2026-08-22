import CustomDirective from '../../../definitions/types/CustomDirective';
import RenderContext from '../../../definitions/types/RenderContext';
import Bouer from '../../../instance/Bouer';
import IoC from '../../../shared/helpers/IoCContainer';
import Binder from '../../binder/Binder';
import DelimiterHandler from '../../DelimiterHandler';
import Evaluator from '../../Evaluator';
import EventHandler from '../../event/EventHandler';
import Compiler, { CompilationHooks } from '../Compiler';
import { $href, $text, $bind, $property } from './Binding';
import { $entry, $put } from './ComponentEntry';
import { $if, $show } from './Conditions';
import { custom } from './Customs';
import { $data, $def, $wait } from './DataInject';
import { $req } from './DataRequest';
import { $for } from './Loops';
import { $skeleton } from './Skeleton';
import { $skip } from './Skip';
import { $form } from './Form';

export default class Directive {
  readonly _IRT_ = true;
  bouer: Bouer;
  binder: Binder;
  evaluator: Evaluator;
  compiler: Compiler;
  eventHandler: EventHandler;
  delimiter: DelimiterHandler;
  context: RenderContext;
  customDirectives: CustomDirective = {};

  constructor(
    compiler: Compiler,
    customDirective: CustomDirective,
    compilerContext: RenderContext
  ) {
    this.compiler = compiler;
    this.context = compilerContext;
    this.bouer = compiler.bouer;
    this.customDirectives = customDirective;

    this.evaluator = IoC.app(this.bouer).resolve(Evaluator)!;
    this.delimiter = IoC.app(this.bouer).resolve(DelimiterHandler)!;
    this.binder = IoC.app(this.bouer).resolve(Binder)!;
    this.eventHandler = IoC.app(this.bouer).resolve(EventHandler)!;
  }

  // Directives
  skip(node: Element) {
    return $skip({
      node: node
    });
  }

  if(node: Node, data: object, compilationHooks: CompilationHooks) {
    return $if({
      binder: this.binder,
      compiler: this.compiler,
      context: this.context,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      data: data,
      node: node,
      compilationHooks: compilationHooks
    });
  }

  show(node: Node, data: object) {
    return $show({
      binder: this.binder,
      evaluator: this.evaluator,
      delimiter: this.delimiter,
      context: this.context,
      node: node,
      data: data
    });
  }


  for(node: Node, data: object, compilationHooks: CompilationHooks) {
    return $for({
      binder: this.binder,
      compiler: this.compiler,
      context: this.context,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      eventHandler: this.eventHandler,
      data: data,
      node: node,
      compilationHooks: compilationHooks
    });
  }

  def(node: Node, data: object) {
    return $def({
      bouer: this.bouer,
      context: this.context,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      data: data,
      node: node
    });
  }

  text(node: Node) {
    return $text({
      node: node
    });
  }

  bind(node: Node, data: object) {
    return $bind({
      binder: this.binder,
      context: this.context,
      delimiter: this.delimiter,
      data: data,
      node: node
    });
  }

  property(node: Node, data: object) {
    return $property({
      binder: this.binder,
      context: this.context,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      node: node,
      data: data
    });
  }

  data(node: Node, data: object, compilationHooks: CompilationHooks) {
    return $data({
      bouer: this.bouer,
      compiler: this.compiler,
      delimiter: this.delimiter,
      evaluator: this.evaluator,
      context: this.context,
      node: node,
      data: data,
      compilationHooks: compilationHooks
    });
  }

  href(node: Node, data: object) {
    return $href({
      bouer: this.bouer,
      binder: this.binder,
      delimiter: this.delimiter,
      context: this.context,
      node: node,
      data: data
    });
  }

  entry(node: Node, data: object) {
    return $entry({
      bouer: this.bouer,
      delimiter: this.delimiter,
      node: node,
      data: data
    });
  }

  put(node: Node, data: object, compilationHooks: CompilationHooks) {
    return $put({
      bouer: this.bouer,
      binder: this.binder,
      delimiter: this.delimiter,
      context: this.context,
      node: node,
      data: data,
      compilationHooks: compilationHooks
    });
  }

  req(node: Node, data: object, compilationHooks: CompilationHooks) {
    return $req({
      bouer: this.bouer,
      compiler: this.compiler,
      delimiter: this.delimiter,
      context: this.context,
      eventHandler: this.eventHandler,
      binder: this.binder,
      node: node,
      data: data,
      compilationHooks: compilationHooks
    });
  }

  wait(node: Node, compilationHooks: CompilationHooks) {
    return $wait({
      bouer: this.bouer,
      compiler: this.compiler,
      delimiter: this.delimiter,
      context: this.context,
      node: node,
      compilationHooks: compilationHooks
    });
  }

  custom(node: Node, data: object): boolean {
    return custom({
      binder: this.binder,
      evaluator: this.evaluator,
      delimiter: this.delimiter,
      context: this.context,
      customDirectives: this.customDirectives,
      node: node,
      data: data,
    });
  }

  form(node: Node, data: object) {
    return $form({
      evaluator: this.evaluator,
      context: this.context,
      compiler: this.compiler,
      node: node,
      data: data
    });
  }

  skeleton(node: Node) {
    return $skeleton({
      node: node,
      bouer: this.bouer
    });
  }
}