import { spawnSync } from 'child_process';
import * as commander from 'commander';
import * as debug from 'debug';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';
import * as prompts from 'prompts';
import * as tmp from 'tmp';

/**
 * a subset of PromptObject fields from https://www.npmjs.com/package/prompts
 * used to represent serialized form of template variables
 */
type Var = {
  type?: 'text' | 'select' | 'number';
  name: string;
  default?: number | string;
  choices?: (number | string)[];
};

const TEMPLATE_VARS: string = '.template_vars.json';

const debugLog: debug.IDebugger = debug('serverless-template');

/**
 * parse cli
 * @param args user provided command line args
 */
export function cli(args: string[]): Promise<{ [key: string]: any }> {
  // https://www.npmjs.com/package/commander
  commander
    .version('0.1.0')
    .name('serverless-template')
    .description('Create serverless applications from templates')
    .option('-t, --template <uri>', 'template URI (git only for now)')
    .option(
      '-o, --output <dir>',
      'directory template contents will be written to'
    )
    .parse(args);

  if (!commander.template) {
    return Promise.reject('Option "--template <uri>" missing');
  }

  if (!commander.output) {
    return Promise.reject('Option "--output <dir>" missing');
  }

  return Promise.resolve(commander.opts());
}

/**
 *
 * @param template template URI
 * @param tmpDirName tmp directory name
 */
function download(template: string, tmpDirName: string): Promise<string> {
  // clone template
  debugLog(`cloning template ${commander.template}`);
  const res = spawnSync('git', ['clone', commander.template, tmpDirName], {
    stdio: ['ignore', process.stdout, process.stderr]
  });
  if (res.error || res.status > 0) {
    return Promise.reject(`failed to clone ${commander.template}`);
  }
  return Promise.resolve(tmpDirName);
}

/**
 * generate application from template
 * @param templatePath tmpDir location
 * @param newProjectPath outputPath location
 */
function generate(
  vars: object,
  templatePath: string,
  newProjectPath: string
): void {
  readdirSync(templatePath).forEach(file => {
    if ('.git' === file) {
      debugLog('skipping .git directory');
      return;
    }

    if (TEMPLATE_VARS === file) {
      debugLog(`skipping ${TEMPLATE_VARS} file`);
      return;
    }

    const origFilePath = path.join(templatePath, file);
    debugLog(`processing ${origFilePath}`);

    const expandedPath = path.join(
      newProjectPath,
      handlebars.compile(file)(vars)
    );

    const stats = statSync(origFilePath);

    if (stats.isFile()) {
      const contents = readFileSync(origFilePath, 'utf8');
      debugLog(`writing file ${expandedPath}`);
      writeFileSync(expandedPath, handlebars.compile(contents)(vars), {
        encoding: 'utf8',
        mode: stats.mode
      });
    } else if (stats.isDirectory()) {
      debugLog(`creating dir ${expandedPath}`);
      mkdirSync(expandedPath, { recursive: true });
      generate(vars, origFilePath, expandedPath);
    }
  });
}

/**
 *
 * @param vars array of template vars
 */
export function questions(vars: Var[]): prompts.PromptObject[] {
  return vars.map(variable => {
    return {
      type: variable.type || 'text',
      message: `Enter a value for ${variable.name}`,
      name: variable.name,
      initial: variable.default,
      validate: (value: any) => !!value,
      choices:
        variable.choices === undefined
          ? undefined
          : variable.choices.map(choice => {
              return {
                title: `${choice}`,
                value: `${choice}`
              };
            })
    };
  });
}

function loadTemplateVars(dir: string): Promise<Var[]> {
  return new Promise<Var[]>(resolve => {
    const templateVarsPath = path.join(dir, TEMPLATE_VARS);
    const templateVars: Var[] = JSON.parse(
      readFileSync(templateVarsPath, 'utf8')
    );
    resolve(templateVars);
  });
}

function createTmpDir(): Promise<string> {
  return new Promise<string>(resolve =>
    resolve(tmp.dirSync({ prefix: 'serverless-template-' }).name)
  );
}

export function run(args: string[]) {
  cli(args)
    .then(options =>
      createTmpDir().then(tmpDir => download(options.template, tmpDir))
    )
    .then(tmpDir =>
      loadTemplateVars(tmpDir).then(vars => {
        return { templateVars: vars, tmpDir: tmpDir };
      })
    )
    .then(result => {
      return prompts(questions(result.templateVars), {
        onCancel: prompt => {
          return process.exit(0);
        }
      }).then(vars => {
        return {
          templateVars: vars,
          tmpDir: result.tmpDir
        };
      });
    })
    .then(result => {
      mkdirSync(commander.output, { recursive: true });
      return generate(result.templateVars, result.tmpDir, commander.output);
    })
    .catch(err => {
      console.error(`Error: ${err}`);
      process.exit(1);
    });
}
