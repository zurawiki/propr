#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
// var cjson = require('cjson');
// var Config = require('../lib/config');
// var ActionsRegistry = require('../lib/actions');
// var helpers = require('../lib/helpers');
require('colors');
require('shelljs/global');

if (!which('git')) {
  echo('Sorry, this script requires git');
  exit(1);
}

console.log('\nPropr: Clean commits and styled code'.bold.blue);
console.log('------------------------------------\n'.bold.blue);

// TODO is there a better way to get the args?
var action = process.argv[2];
var currentDir = process.cwd();
var moduleDir = path.dirname(module.filename)

if (action == 'init') {
  // special setup for init
  console.info('Initializing Propr in: %s', currentDir);
  initPropr(currentDir);
  console.info("\nPropr successfully intialized!")
} else {
  if (isInitialized(currentDir)) {
    console.info('Propr detected!'.bold.green);
    input = process.argv[3];
    if (typeof input == 'undefined') {
      console.error("You need to specify a file for Propr to print")
    }
    if (action == 'fmt') {
      isDiff = process.argv[3] == '-d';
      isQuiet = process.argv[3] == '-q';

      if (isDiff || isQuiet) {
        input = process.argv[4];
      }
      outputStream = proprFormat(currentDir, input, isDiff);
      if (!isQuiet) {
        outputStream.pipe(process.stdout);
      }
    } else if (action == 'cat') {
      outputStream = proprPrint(currentDir, input);
      outputStream.pipe(process.stdout);
    } else {
      console.error("command not found".bold.red)
    }
  } else {
    console.error('Propr not yet initialized'.bold.yellow)
  }
}

function isInitialized(dir) {
  // keep going up in the FS until propr is found
  while (path.resolve(dir) != '/') {
    if (fs.existsSync(path.join(dir, '.propr'))) {
      console.info('Found propr project at %s', dir);
      return true;
    }
    dir = path.join(dir, '..');
  }
  return false;
}

function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

function initPropr(dir) {
  // TODO stash, commit, and unstash
  if (!isGitRepo(dir)) {
    console.error("Error: %s is not a git repository!\n" +
      "Propr requires a git repository to be initialized here.", dir);
    return;
  }
  exec('git stash');

  var proprDir = path.join(dir, '.propr');
  fs.mkdirSync(proprDir);

  cp('-f', path.join(moduleDir, '../res/config.json'), path.join(proprDir, 'config.json'));
  cp('-f', path.join(moduleDir, '../res/propr.gitignore'), path.join(proprDir, '.gitignore'));

  fs.mkdirSync(path.join(proprDir, 'local'));

  // TODO add git hooks
  var gitHookDir = path.join(dir, '.git', 'hooks');
  var proprHookDir = path.join(moduleDir, 'hooks');
  cp('-rf', path.join(moduleDir, '../res/hooks'), path.join(proprDir));
  chmod('-R u+x', proprHookDir);

  pushd(gitHookDir);
  ln('-s',
    path.relative(
      gitHookDir,
      path.join(proprHookDir, 'format-changes.bash')
    ),
    path.join(gitHookDir, 'pre-commit'));
  popd();

  exec('git add .propr .git/hooks');
  exec('git commit -am "Initialized Propr"');
  exec('git stash pop');
}

function getExtension(filename) {
  var ext = path.extname(filename || '').split('.');
  return ext[ext.length - 1];
}

function proprFormat(currentDir, input, printDiff) {
  var relativePath = path.relative(currentDir, input);
  var originalPath = path.join(currentDir, relativePath);
  var patchPath = path.join(currentDir, '.propr/local', relativePath) + '.patch';

  // save input stream to tmp
  var tempPath = path.join('/tmp/propr.tmp', patchPath);
  var code = fs.readFileSync(tempPath, 'utf8');
  cp('-f', originalPath, tempPath);

  // format and save to repo
  // Check for js file
  if (getExtension(input) == 'js') {
    var beautify = require('js-beautify').js_beautify;
    code = beautify(code);
  }
  else {
    console.info("Skipping file", input);
  }

  fs.writeFileSync(originalPath, code);

  // save diff as patch
  mkdir('-p', path.dirname(patchPath));
  exec('diff -u ' + originalPath + ' ' + tempPath, {silent: true}).output.to(patchPath);

  if (printDiff) {
    return fs.createReadStream(patchPath);
  } else {
    return fs.createReadStream(originalPath);
  }

}

function proprPrint(currentDir, input) {
  var relativePath = path.relative(currentDir, input);
  var originalPath = path.join(currentDir, relativePath);
  var patchPath = path.join(currentDir, '.propr/local/', relativePath) + '.patch';
  // if patch exists, then patch it up
  if (fs.existsSync(patchPath)) {
    exec('patch -u --dry-run ' + originalPath + '<' + patchPath + ' -o /tmp/patch', {silent: true});

    return fs.createReadStream('/tmp/patch')
  }
  // if no patch then just print
  else {
    return fs.createReadStream(originalPath);
  }
}
