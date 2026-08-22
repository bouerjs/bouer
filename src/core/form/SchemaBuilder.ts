import { Compiler, Extend, IFieldInfoSnapshot, IFieldSchema, Prop, Reactive, RenderContext } from "../..";
import dynamic from "../../definitions/types/Dynamic";
import Constants from "../../shared/helpers/Constants";
import { code, findAttribute, forEach, isEmptyObject, isNull, toArray, toLower } from "../../shared/helpers/Utils";
import Logger from "../../shared/logger/Logger";
import Evaluator from "../Evaluator";
import FieldSchema from "./FieldSchema";
import { BuildOptions } from "./FormHandler";
import FormSchema from "./FormSchema";

export default class SchemaBuilder {
  readonly _IRT_ = true;

  private context: RenderContext;
  private compiler: Compiler;
  private evaluator: Evaluator;

  schema: IFieldSchema;
  schemas: FieldSchema[] = [];

  constructor(
    context: RenderContext,
    compiler: Compiler,
    evaluator: Evaluator
  ) {
    this.context = context;
    this.compiler = compiler;
    this.evaluator = evaluator;
    this.schema = {};
  }

  build(entry: {
    element: Element,
    data: dynamic,
    schema: IFieldSchema,
    options?: BuildOptions
  }) {
    const data = entry.data;
    const $schema = this.schema = entry.schema;
    const compiler = this.compiler;
    const evaluator = this.evaluator;

    const rootElement = entry.element;

    const options = entry.options || {};
    const buildType = options.type || 'REACTIVE';
    const isReactive = buildType === 'REACTIVE';

    // Remove `[ ]` and `,` and return an array of the names provided
    const mNames = (options.names || '[name]').replace(/\[|\]/g, '').split(',');
    const mValues = (options.values || '[value]').replace(/\[|\]/g, '').split(',');

    // Elements that skipped on serialization process
    const escapes: dynamic = { BUTTON: true };
    const checkables: dynamic = { checkbox: true, radio: true };
    const formLayerSchema: WeakMap<Element, IFieldSchema> = new WeakMap();

    const trySetBuilderInFormSchema = (currentScope: dynamic, $schema: IFieldSchema) => {
      const formSchema = currentScope.$form as FormSchema;

      if (!formSchema || formSchema.schema)
        return;

      formSchema.schema = $schema;
    };

    const getValue = (el: Element, fieldName: string) => {
      if (fieldName in el) return (el as any)[fieldName];
      return el.getAttribute(fieldName) || (el as any).innerText;
    };

    const getFieldValue = (el: Element) => {
      let val: string | number | boolean | undefined | null = undefined;
      mValues.find((field: string) => (val = getValue(el, field)) ? true : false);
      return val;
    };

    const getFieldStructure = (
      schema: IFieldSchema,
      fieldName: string,
      el: Element,
      scopeData: dynamic
    ) => {
      const field = findAttribute(el, [Constants.form.schema], true);
      const codeFieldInfo = schema[fieldName] || {};

      if (field == null) return codeFieldInfo;

      const htmlFieldInfo = evaluator.exec({
        data: scopeData,
        context: this.context!,
        code: field.value,
        returnable: true
      }) || {};

      if (!isEmptyObject(htmlFieldInfo) && !isEmptyObject(codeFieldInfo)) {
        Logger.warn(
          `WARNING in <${toLower(el.tagName)} name="${fieldName}" />: You cannot `+
          `use both \`schema\` attribute “e-schema” and \`schema\` code at the same time.`
        );
      }

      return Extend.obj(htmlFieldInfo, codeFieldInfo) as dynamic;
    };

    // Use the up array to map the layers and check what layer the compiler is
    const findParentBuildElement = function (el: Element): Element | null | undefined {
      const parentElement = el.parentElement;

      if (parentElement == rootElement || parentElement == null)
        return rootElement;

      const isBuild = parentElement.hasAttribute(Constants.form.build) ||
        parentElement.hasAttribute(Constants.form.abuild);

      if (isBuild)
        return parentElement;

      return findParentBuildElement(parentElement);
    }

    const processInput = (options: {
      el: Element,
      schema: IFieldSchema,
      scopeData: dynamic
    }) => {

      const { el: input, schema, scopeData } = options;
      const attr = findAttribute(input, mNames);

      // Checking if the element has the names on it
      if (!attr)
        return;

      const attrName = attr.value;
      const type = findAttribute(input, ['type']);
      const typeName = (!type || toLower(type.value) == 'text') ? 'string' : toLower(type.value);

      // If is escapable, stop
      if (escapes[input.tagName] === true) return;

      // If it's is checkable and it's not selected, stop
      if ((input instanceof HTMLInputElement) && (checkables[input.type] === true && input.checked === false))
        return;

      // Retrieving the value if it needs to be build as arry property
      const isArray = findAttribute(input, ['e-array']) != null;
      // if it is not an array built type, just set the value

      // Form Field
      const $fieldSchema = new FieldSchema(
        getFieldStructure(schema, attrName, input, scopeData)
      ).init({
        field: input, name: attrName, type: isArray ? 'array' : typeName
      });

      $fieldSchema.form = scopeData.$form;

      // Assigning the value of element if there is not a
      if (isNull($fieldSchema.value))
        $fieldSchema.value = getFieldValue(input);

      // Transforming the value and errors to reactive
      Reactive.transform({
        context: this.context!,
        data: $fieldSchema,
        keys: ['value', 'errors']
      });

      if (!Constants.check(input, 'e-bind'))
        input.setAttribute('e-bind', 'value');

      compiler!.compile({
        context: this.context,
        data: $fieldSchema,
        el: input
      });

      // Adding the element a list to be easier to validate
      this.schemas.push($fieldSchema);

      // Setting the element prop in the schema
       // if it is not an array built type, just set the value
      if (!isArray) {
        // Field Info Set

        if (attrName in schema)
          delete schema[attrName];

        schema[attrName] = $fieldSchema;
      } else {
        // Getting the value from if exists, otherwise set default value as empty array
        const $oldValue = (schema[attrName] || []) as IFieldInfoSnapshot[];
        schema[attrName] = $oldValue.concat($schema);
      }

      if (isReactive) {
        Reactive.transform({
          context: this.context!,
          data: schema,
          keys: [attrName]
        }) // Setting the property to reactive
      }
    }

    const getSchema = (options: {
      el: Element,
      scopeData: dynamic
    }) => {
      const currentElement = options.el;
      const currentScopeData = options.scopeData;
      const parentBuild = findParentBuildElement(currentElement);
      const currentSchema = formLayerSchema.get(parentBuild!)!;

      trySetBuilderInFormSchema(currentScopeData, currentSchema);
      return currentSchema;
    }

    const setSchema = (options: {
      el: Element,
      scopeData: dynamic
    }) => {
      const currentElement = options.el;
      const currentScopeData = options.scopeData;
      const currentParentBuild = findParentBuildElement(currentElement);
      const currentSchema = formLayerSchema.get(currentParentBuild!)!;

      // Finding e-build property
      const attrBuild = findAttribute(currentElement, [
        Constants.form.build,
        Constants.form.abuild,
      ]);

      if (!attrBuild)
        return currentSchema;

      const attrValue = attrBuild.value;
      const attrName = attrBuild.name;

      // Retrieving the value if it needs to be build as arry property
      const isArray = attrName === 'e-build:array' || findAttribute(currentElement, ['e-array']) != null;
      let $$schema: dynamic = {};

      let currentSchemaValue = currentSchema[attrValue];

      // Setting the element prop in the schema
      // if it is not an array built type, just set the value
      if (!isArray) {
        // if there is already a value, do nothing
        if (currentSchemaValue) {
          $$schema = currentSchemaValue;
        }

        // Field Info Set
        currentSchema[attrValue] = $$schema;
      } else {

        const values = currentSchemaValue as any[];
        // Check if there is already a value and the first element is a FieldSchema

        if (values && values.length > 0) {
          $$schema = values[values.length - 1];
        } else {
          // Getting the value from if exists, otherwise set default value as empty array
          const $oldValue = (currentSchema[attrValue] || []) as IFieldInfoSnapshot[];
          currentSchema[attrValue] = $oldValue.concat($$schema);
        }
      }

      if (isReactive) {
        Reactive.transform({
          context: this.context!,
          data: currentSchema,
          keys: [attrValue]
        }) // Setting the property to reactive
      }

      formLayerSchema.set(currentElement!, $$schema);
      trySetBuilderInFormSchema(currentScopeData, currentSchema);
    }

    // Clearing the Schemas, in case of FormBuilder re-use
    this.schemas = [];

    // Initializing the Schema Layer
    formLayerSchema.set(rootElement!, $schema);


    if (isReactive) {
      const arrayElements = Extend.array(
        toArray(rootElement!.querySelectorAll('[e-build\\:array]')),
        toArray(rootElement!.querySelectorAll('[e-array]'))
      );
      forEach(arrayElements, (el: Element) => {
        const attr = findAttribute(el, ['e-build:array', 'e-build']);
        if (!attr) return;

        const varName = code(3, '_');
        el.setAttribute('e-for', `${varName} of $form.parent.get('${attr.value}')`);
      });
    }

    compiler.compile({
      context: this.context,
      data: data,
      el: rootElement!,
      beforeCompile: (element, scopeData) => {
        if (!(element instanceof Element)) return;

        setSchema({ el: element, scopeData: scopeData! });
      },
      afterCompile: (element, scopeData) => {
        if (!(element instanceof Element))  return;

        processInput({
          el: element,
          schema: getSchema({ el: element, scopeData: scopeData! }),
          scopeData: scopeData!
        });
      }
    });

    return this;
  }

  toObject() {
    return (function walker(
      schema: IFieldSchema,
      $obj: dynamic
    ) {
      for (const key in schema) {
        const property = schema[key];

        if (property instanceof FieldSchema) {
          Prop.set($obj, key, {
            enumerable: true,
            get(){ return property.value; },
            set(v: any) { property.value = v; }
          });
          $obj[key] = property.value;
        } else if (property instanceof Array) {
          $obj[key] = property.map((item: any) => walker(item, {}));
        } else if (typeof property == 'object') {
          $obj[key] = walker(property as IFieldSchema, {});
        }
      }
      return $obj;
    })(this.schema, {});
  }
};