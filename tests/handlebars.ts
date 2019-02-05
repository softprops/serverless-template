import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as handlebars from 'handlebars';
import * as _ from 'lodash';
import { registerHelpers } from '../src/handlebars';

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
  registerHelpers();
});

describe('#handlebars', () => {
  it('defines eq helper', () => {
    chai
      .expect(handlebars.compile('{{#eq foo 2}}pass{{/eq}}')({ foo: 2 }))
      .to.eq('pass');
    chai
      .expect(handlebars.compile('{{^eq foo 2}}pass{{/eq}}')({ foo: 1 }))
      .to.eq('pass');
  });
});
