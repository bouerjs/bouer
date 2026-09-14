import { FieldErrorMessage, FieldFnValidation, IFieldInfo, IFieldInfoSnapshot, IFieldInit } from '../../definitions/interfaces/IFieldSchema';
import dynamic from '../../definitions/types/Dynamic';
import { isNull } from '../../shared/helpers/Utils';
import FormSchema from './FormSchema';
import Validator from './Validator';

export default class FieldSchema implements IFieldInfo {
  constructor(options: IFieldInfoSnapshot) {
    this.field = undefined as unknown as Element;
    this.name = undefined as unknown as string;
    this.type = undefined as unknown as string;
    this.value = undefined;

    Object.assign(this, options || {});
  }

  field: Element;
  name: string;
  type: string;
  value: any;

  required?: boolean;
  length?: number | { min?: number; max?: number; };
  pattern?: string;
  check?: any[];
  fn?: FieldFnValidation;

  errors: FieldErrorMessage[] = [];

  form?: FormSchema;

  init(options: IFieldInit) {
    Object.assign(this, options);
    return this;
  }

  merge(schema: dynamic) {
    const _this: any = this;
    Object.keys(schema).forEach((key: string) => {
      if (key in _this && isNull(_this[key]))
        _this[key] = schema[key];
    });
    return this;
  }

  isValid(): boolean {
    const errors = Validator.validate(this);
    return (this.errors = errors).length === 0;
  }

  validate() {
    return this.isValid();
  }
}

export function $field(schema: IFieldInfoSnapshot) {
  return new FieldSchema(schema);
}