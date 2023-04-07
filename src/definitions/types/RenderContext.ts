import Component from '../../core/component/Component';
import Bouer from '../../instance/Bouer';
import dynamic from './Dynamic';

type RenderContext<Data extends dynamic = {}> = Bouer<Data, {}, {}> | Component<Data>;

export default RenderContext;