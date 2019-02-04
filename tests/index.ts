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
  it('accepts minimally populated template vars and produces prompt options', () => {
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

  it('accepts template vars with choices and produces prompt options', () => {
    let options = questions([
      { name: 'test', type: 'select', choices: [1, 2] }
    ]).map(variable => _.omit(variable, 'validate'));
    chai.expect(options).to.deep.eq([
      {
        choices: [{ title: '1', value: '1' }, { title: '2', value: '2' }],
        initial: undefined,
        message: 'Enter a value for test',
        name: 'test',
        type: 'select'
      }
    ]);
  });
});
