import { IFieldSchema } from '../../definitions/interfaces/IFieldSchema';
import dynamic from '../../definitions/types/Dynamic';
import RenderContext from '../../definitions/types/RenderContext';
import Bouer from '../../instance/Bouer';
import Extend from '../../shared/helpers/Extend';
import IoC from '../../shared/helpers/IoCContainer';
import { $default, $internal, buildError, DOM, isNull } from '../../shared/helpers/Utils';
import Logger from '../../shared/logger/Logger';
import Compiler from '../compiler/Compiler';
import Evaluator from '../Evaluator';
import DataStore from '../store/DataStore';
import FieldSchema from './FieldSchema';
import FormSchema from './FormSchema';
import SchemaBuilder from './SchemaBuilder';

export type BuildOptions = {
  /**
  * attributes that tells the compiler to lookup to the element, e.g: [name],[data-name].
  * * Note: The definition order matters.
  */
  names?: string,
  /**
  * attributes that tells the compiler where it going to get the value, e.g: [value],[data-value].
  * * Note: The definition order matters.
  */
  values?: string,

  /**
   * The build type, it can be `REACTIVE` or `STATIC`,
   *
   * `REACTIVE` will build the schema as a reactive properties and objects,
   * `STATIC` will build the schema as a static object,
   *
   * default is `REACTIVE`
   */
  type?: 'REACTIVE' | 'STATIC'
}

export default class FormHandler {
  constructor(
    schema: IFieldSchema,
    builderOptions?: BuildOptions
  ) {
    $internal(this);
    // Assigning an empty object if formObject is not provided
    this.schema = schema || {};
    this.builderOptions = builderOptions || {};
    this.evaluator = $default();
    this.formElement = $default();
  }

  public schema: IFieldSchema;
  public schemas: FieldSchema[] = [];
  public builderOptions: BuildOptions;

  public bouer?: Bouer;
  public evaluator: Evaluator;
  public context?: RenderContext;

  public formElement: Element;
  private $builder?: SchemaBuilder;

  private resolveElement(el: any): Element | undefined {
    // If it's not a HTML Element, just return
    if (el instanceof Element)
      return el;

    if (!(typeof el === 'string'))
      return undefined;

    try {
      // If it's a string try to get the element
      const element = DOM.querySelector(el);

      if (!element) {
        Logger.error('Element with "' + element + '" selector not found.');
        return undefined;
      }
      return element;
    } catch (error) {
      // Unknown error
      Logger.error(buildError(error));
      return undefined;
    }
  }

  public init(options: {
    element: Element | string,
    bouer: Bouer,
    context: RenderContext,
    data: dynamic,
  }) {
    const { element, context, data, bouer } = options;

    this.bouer = bouer;
    this.context = context;
    this.formElement = this.resolveElement(element)!;
    this.schemas = [];

    const compiler = IoC.app(bouer).resolve(Compiler)!
    const evaluator = this.evaluator = IoC.app(bouer).resolve(Evaluator)!
    const $builder = this.$builder = new SchemaBuilder(
      this.context,
      compiler,
      evaluator
    );

    const dataToUse = Extend.obj(data, {
      $form: new FormSchema({
        currentNode: this.formElement,
        scopeData: data
      })
    });

    IoC.app(bouer).resolve(DataStore)!
      .addNodeData(this.formElement, dataToUse);

    $builder.build({
      element: this.formElement,
      schema: this.schema,
      options: this.builderOptions,
      data: dataToUse
    });

    this.schemas = $builder.schemas;
    return this;
  }

  public get(path: string): FieldSchema | undefined {

    if (path == null || path == '')
      return undefined;

    if (this.evaluator == null) {
      Logger.error('FormHandler is not initialized') ?? undefined;
      return undefined;
    }

    return this.evaluator.exec({
      returnable: true,
      context: this.context!,
      data: this.schema,
      code: path,
    }) as FieldSchema | undefined;
  }

  public set(path: string, value: string) {
    const field = this.get(path);
    if (field == null) return;
    field.value = value;
  }

  public validate() {
    let isValid = true;
    this.schemas.forEach(f => f.isValid() ? 1 : isValid = false);
    return isValid;
  }

  public toObject() {
    if (this.$builder == null) {
      Logger.error('SchemaBuilder is not initialized.');
      return {};
    }
    return this.$builder.toObject();
  }

  public clear() {
    this.schemas.forEach(f => f.value = '');
  }
}

export function $form(
  schema: IFieldSchema,
  builderOptions?: BuildOptions
) {
  return new FormHandler(schema, builderOptions);
}