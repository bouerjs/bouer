import {
  Bouer,
} from '../../index';

describe('When "on" method is called', () => {
  it('Adds an event listener instance data and I can dispatch with emit method', () => {
    const context = Bouer.create();
    const callback = jest.fn();
    context.on('caller', callback);
    context.emit('caller');
    expect(callback).toHaveBeenCalled();
  });
});

describe('When "off" method is called', () => {
  it('Removes the listener from the instance', () => {
    const context = Bouer.create();
    const callback = jest.fn();
    const event = context.on('caller', callback);

    context.emit('caller');
    context.off('caller', event.callback);
    context.emit('caller');

    expect(callback).toHaveBeenCalledTimes(1);
  });
});