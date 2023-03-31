import Component from '../../core/component/Component';

type ComponentClass<Data = {}> = (new () => Component<Data>);

export default ComponentClass;