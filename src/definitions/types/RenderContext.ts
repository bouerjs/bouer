import ComponentPrototype, { Component } from '../../core/component/Component';
import Bouer from '../../instance/Bouer';

type RenderContext = Component | ComponentPrototype | Bouer;

export default RenderContext;