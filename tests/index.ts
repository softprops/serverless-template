import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { readdirSync } from 'fs';
import * as _ from 'lodash';
import * as mockfs from 'mock-fs';
import { cli, generate, loadTemplateVars, questions } from '../src/';

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

afterEach(() => {
  mockfs.restore();
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

describe('#generate', () => {
  it('generates files, skipping .git dir and .template_vars.json', () => {
    mockfs({
      'path/to/fake/template': {
        a: 'a contents',
        'another-dir': {},
        '.template_vars.json': '[]',
        '.git': {}
      },
      'path/to/fake/output': {}
    });
    generate({ foo: 'bar' }, 'path/to/fake/template', 'path/to/fake/output');
    chai
      .expect(readdirSync('path/to/fake/output'))
      .to.deep.eq(['a', 'another-dir']);
  });
});

describe('#loadTemplateVars', async () => {
  it('loads and parses template vars', () => {
    mockfs({
      'path/to/fake/template': {
        '.template_vars.json': '[{"name":"foo"}]'
      }
    });
    return chai
      .expect(loadTemplateVars('path/to/fake/template'))
      .to.eventually.deep.eq([{ name: 'foo' }]);
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
