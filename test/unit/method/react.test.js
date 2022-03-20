import {
  Bouer,
} from '../../index';

describe('When using "react" method', () => {
  it('Listen to all the properties change', () => {
    const callback = jest.fn();

    const context = Bouer.create({
      data: {
        value1: 1,
        value2: 2,
        value3: 3
      }
    });

    context.react(app => {
      callback(app.data.value1, app.data.value2, app.data.value3);
    });

    context.data.value1++;
    context.data.value2++;
    context.data.value3++;
    expect(callback).toHaveBeenCalledTimes(
      1 // The first time that the function is called
      +
      3 // The number of times that each property changed
    );
  });


  it('Destroy the watcher when called watch.destroy() method', () => {
    const callback = jest.fn();

    const context = Bouer.create({
      data: {
        value1: 1,
        value2: 2,
        value3: 3
      }
    });

    const watch = context.react(app => {
      callback(app.data.value1, app.data.value2, app.data.value3);
    });

    watch.destroy();
    context.data.value1++;
    context.data.value2++;
    context.data.value3++;

    // The first time
    expect(callback).toHaveBeenCalledTimes(1);
  });
});