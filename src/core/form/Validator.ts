import { FieldErrorMessage } from '../../definitions/interfaces/IFieldSchema';
import dynamic from '../../definitions/types/Dynamic';
import FieldSchema from './FieldSchema';
import FormSchema from './FormSchema';

const Validator = (function () {
  const invalidInputClass = 'is-invalid';

  function innerValidateRequired(
    fieldInfo: FieldSchema
  ) {
    const errorList: FieldErrorMessage[] = [];
    const { field, name, value, type } = fieldInfo;
    const required = fieldInfo.required ?? false;

    const isValidValue = () => {
      return required == true ? (value != null && (value + '').trim() != '') : true;
    };

    const addError = (error: FieldErrorMessage, clear?: boolean) => {
      if (clear === true) errorList.splice(0, errorList.length);

      errorList.push(error);
      field.classList.add(invalidInputClass);
    };

    if (!isValidValue()) {
      addError({
        rule: 'required',
        message: `The field ${name} is required.`,
        field: field,
        value: value
      });
    }

    return {
      errors: errorList,
      isValidValue,
      addError
    };
  }

  function innerValidateCheck(
    fieldInfo: FieldSchema,
    isValidValue: () => boolean,
    addError: (error: FieldErrorMessage) => void
  ) {
    const { field, name, value, check } = fieldInfo;

    // Check validation
    if (check != null && check.indexOf(value) < 0) {
      addError({
        rule: 'check',
        message: `The field ${name} with value ${value} does not match the required options.`,
        field: field,
        value: value
      });
      field.classList.add(invalidInputClass);
    }
  }

  function innerValidateFunction(
    fieldInfo: FieldSchema,
    addError: (error: FieldErrorMessage, clear?: boolean) => void
  ) {
    if (!fieldInfo.fn) return;

    const { name, field, value, fn } = fieldInfo;
    const result = fn!(fieldInfo);

    const {
      valid,
      message,
      override
    } = typeof result == 'object' ? result : {
      valid: result,
      message: `The field ${name} does not have the expected value.`,
      override: false
    };

    const clearPreviousError = valid == false && override == true;

    if (!valid) {
      field.classList.add(invalidInputClass);
      addError({
        rule: 'function',
        message: message,
        field: field,
        value: value
      }, clearPreviousError);
      field.classList.add(invalidInputClass);
    }
  }

  function validateString(
    fieldInfo: FieldSchema
  ) {
    const { field, pattern, name, value, length } = fieldInfo;
    const { min, max } = typeof length == 'object' ? length : { min: 0, max: length };

    const { errors, isValidValue, addError } = innerValidateRequired(fieldInfo);

    // Minimum length validation
    if (min != null && isValidValue() && value.length < min) {
      addError({
        rule: 'length:min',
        message: `The field ${name} should have at least ${min} characters. Current length: ${value.length}.`,
        field: field,
        value: value
      });
    }

    // Maximum length validation
    if (max != null && isValidValue() && value.length > max) {
      addError({
        rule: 'length:max',
        message: `The field ${name} should have at most ${max} characters. Current length: ${value.length}.`,
        field: field,
        value: value
      });
    }

    // Regex validation
    if (pattern != null && isValidValue()) {
      const validator: dynamic = {
        'date': () => {
          return value.match(
            // eslint-disable-next-line max-len
            /^(?:\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])|(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/\d{4}|(?:0[1-9]|[12]\d|3[01])\/(?:0[1-9]|1[0-2])\/\d{4})$/
          );
        },
        'date-time': () => {
          return value.match(
            /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])[T ]([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d{1,3})?Z?$/
          );
        },
        'email': () => {
          return value.match(
            /^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]{3,}\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/
          );
        },
        'regex': () => {
          return value.match(new RegExp(pattern));
        }
      };

      // Validates the pattern as named pattern, otherwise, validate the the pattern as regex
      const isValidPattern = (validator[pattern] || validator['regex'])();
      if (!isValidPattern) {
        addError({
          rule: 'regex',
          message: `The field ${name} does not match the ${(pattern in validator) ? pattern : 'regex'} pattern.`,
          field: field,
          value: value
        });
      }
    }

    // Check validation
    innerValidateCheck(fieldInfo, isValidValue, addError);

    // Function validation
    innerValidateFunction(fieldInfo, addError);

    return errors;
  }

  function validateNumber(
    fieldInfo: FieldSchema
  ) {
    let {
      name,
      value,
      length,
      field
    } = fieldInfo;

    const { min, max } = typeof length == 'object' ? length : { min: 0, max: length };
    const { errors, isValidValue, addError } = innerValidateRequired(fieldInfo);

    // is value a valid number
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.exec(value)) {
      addError({
        rule: 'number',
        message: `The field ${name} should have a number value.`,
        field: field,
        value: value
      });
    } else {
      value = value * 1; // Convert to the presented number
    }

    // Minimum validation
    if (min != null && value < min) {
      addError({
        rule: 'length:min',
        message: `The field ${name} should be greater than or equal to ${min}.`,
        field: field,
        value: value
      });
    }

    // Maximum validation
    if (max != null && value > max) {
      addError({
        rule: 'length:max',
        message: `The field ${name} should be less than or equal to ${max}.`,
        field: field,
        value: value
      });
    }

    // Check validation
    innerValidateCheck(fieldInfo, isValidValue, addError);

    // Function validation
    innerValidateFunction(fieldInfo, addError);

    return errors;
  }

  function validateBoolean(
    fieldInfo: FieldSchema
  ) {
    let {
      name,
      value,
      field
    } = fieldInfo;
    const { errors, isValidValue, addError } = innerValidateRequired(fieldInfo);

    // is value a valid number
    if (!isValidValue() && !/^(TRUE|True|true|1|FALSE|False|false|0)?$/.exec(value)) {
      addError({
        rule: 'boolean',
        message: `The field ${name} should be a boolean. Current value: ${value}`,
        field: field,
        value: value
      });
    } else {
      value = ['true', '1'].indexOf(value.toLowerCase()) > -1 ? true : false; // Convert to the presented boolean value
    }

    // Function validation
    innerValidateFunction(fieldInfo, addError);

    return errors;
  }

  function validate(
    fieldInfo: FieldSchema
  ) {
    const type = fieldInfo.type = fieldInfo.type || 'string';

    switch (type) {
      case 'string':
        return validateString(fieldInfo);
      case 'number':
        return validateNumber(fieldInfo);
      case 'boolean':
        return validateBoolean(fieldInfo);
      default:
        return [] as FieldErrorMessage[];
    }
  }

  return class FormValidator {
    static validate(
      fieldInfo: FieldSchema
    ) {
      return validate(fieldInfo);
    }
  };
})();

export default Validator;