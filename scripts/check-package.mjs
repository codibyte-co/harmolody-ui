import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const built = JSON.parse(readFileSync(join(root, 'dist/ui/package.json'), 'utf8'));
const tarball = join(
  root,
  'artifacts',
  `${built.name.replace('@', '').replace('/', '-')}-${built.version}.tgz`,
);
const workspace = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const consumer = mkdtempSync(join(tmpdir(), 'harmolody-ui-consumer-'));
const npmScript = process.env.npm_execpath;
const npm = (args, cwd) =>
  npmScript
    ? execFileSync(process.execPath, [npmScript, ...args], { cwd, stdio: 'inherit' })
    : execFileSync('npm', args, { cwd, stdio: 'inherit' });

const write = (name, content) => {
  mkdirSync(resolve(consumer, name, '..'), { recursive: true });
  writeFileSync(
    join(consumer, name),
    typeof content === 'string' ? content : JSON.stringify(content, null, 2),
  );
};

write('package.json', {
  name: 'harmolody-ui-packed-consumer',
  private: true,
  dependencies: { ...workspace.dependencies, [built.name]: `file:${tarball}` },
  devDependencies: Object.fromEntries(
    [
      '@angular/build',
      '@angular/cli',
      '@angular/compiler-cli',
      'typescript',
      'tailwindcss',
      '@tailwindcss/postcss',
      'postcss',
    ].map((name) => [name, workspace.devDependencies[name]]),
  ),
});
write('angular.json', {
  version: 1,
  projects: {
    consumer: {
      projectType: 'application',
      root: '',
      sourceRoot: 'src',
      architect: {
        build: {
          builder: '@angular/build:application',
          options: {
            browser: 'src/main.ts',
            index: 'src/index.html',
            tsConfig: 'tsconfig.json',
            styles: ['src/styles.css'],
            outputPath: 'dist/consumer',
          },
        },
      },
    },
  },
});
write('tsconfig.json', {
  compilerOptions: {
    strict: true,
    target: 'ES2022',
    module: 'preserve',
    experimentalDecorators: true,
    skipLibCheck: true,
  },
  angularCompilerOptions: { strictTemplates: true },
  files: ['src/main.ts'],
});
write('.postcssrc.json', { plugins: { '@tailwindcss/postcss': {} } });
write(
  'src/index.html',
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Package consumer</title><base href="/"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><app-root></app-root></body></html>',
);
write(
  'src/styles.css',
  `@import 'tailwindcss';\n@import '@harmolody/ui/theme.css';\n@source '../node_modules/@harmolody/ui';\n`,
);
write(
  'src/main.ts',
  `
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { DynamicFormComponent, TableComponent, TableCellDirective, provideHarmolodyUi, type FormConfig, type TableConfig } from '@harmolody/ui';
@Component({selector:'app-root',imports:[DynamicFormComponent,TableComponent,TableCellDirective],template:\`
  <hui-dynamic-form #form [config]="formConfig" (formSubmit)="form.finishSubmit()" />
  <hui-table [config]="tableConfig"><ng-template huiTableCell="name" let-row="row">{{row.name}}</ng-template></hui-table>
\`})
class Consumer {
  readonly formConfig: FormConfig = { layout:'grid', columns:2, fields:[{key:'name',label:'Name',type:'text',required:true}] };
  readonly tableConfig: TableConfig<{id:number;name:string}> = {rowKey:'id',columns:[{key:'name',label:'Name',type:'template'}],data:[{id:1,name:'May'}]};
}
bootstrapApplication(Consumer,{providers:[provideRouter([]),provideHarmolodyUi()]}).catch(console.error);
`,
);
console.log(`Checking tarball: ${tarball}\nIndependent consumer: ${consumer}`);
npm(
  [
    'install',
    '--cache',
    process.env.npm_config_cache ?? join(tmpdir(), 'harmolody-ui-npm-cache'),
    '--no-audit',
    '--no-fund',
  ],
  consumer,
);
execFileSync(
  process.execPath,
  [join(consumer, 'node_modules/@angular/cli/bin/ng.js'), 'build', 'consumer'],
  { cwd: consumer, stdio: 'inherit' },
);
console.log(
  `Packed package installation and production build passed. Consumer retained at ${consumer}`,
);
