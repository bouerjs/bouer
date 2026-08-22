import { IFieldSchema } from "../../definitions/interfaces/IFieldSchema";
import dynamic from "../../definitions/types/Dynamic";
import Constants from "../../shared/helpers/Constants";
import Extend from "../../shared/helpers/Extend";
import { $default, findAttribute, toArray, where } from "../../shared/helpers/Utils";
import FieldSchema from "./FieldSchema";

export default class FormSchema {
  schema: IFieldSchema;
  parent?: FormSchema;
  path: string = '';

  constructor(options: {
    currentNode: Element,
    scopeData: dynamic
  }) {
    this.init(options);
    this.schema = $default();
    this.parent = options.scopeData.$form;
  }

  static isBuild(currentNode: any) {
    const cform = Constants.form;
    const attributes = currentNode.attributes;
    return (cform.build in attributes || cform.abuild in attributes)
      && !currentNode.$$buildAddedInScope;
  }

  private init(options: {
    currentNode: Element,
    scopeData: any
  }) {
    const { currentNode, scopeData } = options;
    const cform = Constants.form;
    const attributes = currentNode.attributes;

    const node = currentNode as any;

    // Mark the element as already build
    node.$$buildAddedInScope = true;

    // Get the build value
    const attrBuild = findAttribute(node, [cform.build, cform.abuild]);
    if (attrBuild == null) return;

    let buildValue = attrBuild.nodeValue as string;

    // Check if the element is an array type
    if ((cform.array in attributes || cform.abuild in attributes)) {
      //Retrieve the actual index of the current element
      const parentElement = node.parentElement!;

      const elements =  Extend.array(
        toArray(parentElement.querySelectorAll(`*>[e-build\\:array="${attrBuild.value}"]`)),
        toArray(parentElement.querySelectorAll(`*>[e-build="${attrBuild.value}"][e-array]`))
      );
      buildValue += '['+ elements.indexOf(node as never) +']';
    }

    const parent = this.parent = scopeData.$build;
    const parentPath = parent ? parent.path : '';

    // Build the path the path
    this.path = [parentPath, buildValue].filter(_ => _).join('.');
  }

  toPath(child: string) {
    // Build the path the path
    return [this.path, child].filter(_ => _).join('.');
  }

  get(child: string) {
    if (child == null || child == '')
      return undefined;

    return this.schema[child] as FieldSchema | undefined;
  }
};