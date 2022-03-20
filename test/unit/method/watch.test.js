import {
  Bouer,
} from '../../index';

describe('When using "watch" method', () => {
  it('Listen to property change', () => {
    const callback = jest.fn();

    const context = Bouer.create({
      data: {
        value: ''
      }
    });

    context.watch('value', callback);
    context.data.value = 'new';

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('Provides the new value on the 1 argument and old value on 2 argument', () => {
    const callback = jest.fn();
    const context = Bouer.create({
      data: {
        value: ''
      }
    });

    context.watch('value', callback);
    context.data.value = 'new';

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBe('new');
    expect(callback.mock.calls[0][1]).toBe('');
  });

  it('Destroy the watcher when called watch.destroy() method', () => {
    const callback = jest.fn();
    const context = Bouer.create({
      data: {
        value: ''
      }
    });

    const watch = context.watch('value', callback);
    watch.destroy();
    context.data.value = 'new';

    expect(callback).not.toHaveBeenCalled();
  });
});