interface IEventModifiers {
  autodestroy?: boolean;
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

export default IEventModifiers;