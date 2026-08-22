import { FieldErrorMessage, FieldFnValidation, IFieldInfo, IFieldInfoSnapshot, IFieldInit } from '../../definitions/interfaces/IFieldSchema';
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

  init(options: IFieldInit) {
    Object.assign(this, options);
    return this;
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

  isValid(): boolean {
    const errors = Validator.validate(this);
    return (this.errors = errors).length === 0;
  }

  validate() {
    return this.isValid();
  }
}