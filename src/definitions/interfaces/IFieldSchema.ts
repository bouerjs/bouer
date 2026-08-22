
export type FieldFnValidation = (fieldInfo: IFieldInfo) => boolean | {
  valid: boolean,
  message: string,
  override: boolean
};

export type FieldErrorMessage = {
  rule: string,
  message: string,
  field: Element,
  value: any
};

export interface IFieldInfoSnapshot {
  readonly required?: boolean;
  readonly length?: number | { min?: number, max?: number };
  readonly pattern?: string
  readonly check?: any[],
  readonly fn?: FieldFnValidation
}

export interface IFieldInit {
  field: Element;
  name: string;
  type: string;
  value?: any;
}

export interface IFieldInfo extends IFieldInit, IFieldInfoSnapshot {
}

export interface IFieldSchema {
  [key: string]: IFieldSchema | IFieldInfoSnapshot | IFieldInfoSnapshot[]
}