import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as _ from 'lodash';
import { cli, questions } from '../src/';

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

describe('#cli', () => {
  it('requires template option', async () => {
    return chai
      .expect(cli([]))
      .eventually.be.rejectedWith('Option "--template <uri>" missing');
  });

  it('requires output option', async () => {
    return chai
      .expect(cli(['..', '..', '--template', 'uri']))
      .eventually.be.rejectedWith('Option "--output <dir>" missing');
  });

  it('returns options provided', async () => {
    return chai
      .expect(cli(['..', '..', '--template', 'uri', '--output', 'dir']))
      .eventually.deep.eq({ version: '0.1.0', template: 'uri', output: 'dir' });
  });
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
