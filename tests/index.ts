import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as _ from 'lodash';
import { questions } from '../src/';

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

// https://www.chaijs.com/api/bdd/
describe('#questions', () => {
  it('accepts minmally populated template vars and produces prompt options', () => {
    let options = questions([{ name: 'test' }]).map(variable =>
      _.omit(variable, 'validate')
    );
    chai.expect(options).to.deep.eq([
      {
        choices: undefined,
        initial: undefined,
        message: 'Enter a value for test',
        name: 'test',
        type: 'text'
      }
    ]);
  });
});
