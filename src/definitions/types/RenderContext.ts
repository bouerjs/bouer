import Component from '../../core/component/Component';
import Bouer from '../../instance/Bouer';

type RenderContext<Data = {}> = Bouer<Data> | Component<Data>;

export default RenderContext;