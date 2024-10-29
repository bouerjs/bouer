import Bouer from '../../../instance/Bouer';
import { forEach, ifNullReturn, toOwnerNode, trim } from '../../../shared/helpers/Utils';

export function $skeleton(opitons: {
  node: Node,
  bouer: Bouer
}) {
  const { node, bouer } = opitons;

  const nodeValue = trim(ifNullReturn(node.nodeValue, ''));

  if (nodeValue !== '') return;

  const ownerNode = toOwnerNode(node);
  ownerNode.removeAttribute(node.nodeName);

  const uid = ownerNode.getAttribute('skeleton-clone-code');
  if (!uid) return;

  ownerNode.removeAttribute('skeleton-clone-code');
  forEach([].slice.call(bouer.el?.querySelectorAll('[="' + uid + '"]')), (el: Node) => {
    (el.parentElement || el.parentNode)!.removeChild(el);
  });
}