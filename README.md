Propr
-----

A tool for normalizing code style in git repos. aka Peter Dean’s code style fix for git

# Usage Philosophy
If you don’t have the tool, you can edit your files no problem, like git
Conform to UNIX when possible

# Purpose
Everyone sees their code the way they want to
No formatting changes should appear in a repo’s commit logs

patch -u --dry-run /Users/roger/Dropbox/dev/propr/test/test_basic.js</Users/roger/Dropbox/dev/propr/.propr/local/test/test_basic.js.patch -o /tmp/patch;cat /tmp/patch;rm -f /tmp/patch

# Functions:
Format file for project repo
`propr fmt [file]`
formatted file to stdout

Save personal style locally in repo clone
`propr fmt -d [file]`
print diff (formatted -> personal) to stdout

Generate personally styled files
`propr cat <file>`

## Git Hooks
	post-checkout
		setup
	pre-commit
		format file and cache diffs 
on every commit, format



how do you store custom info?
default language mandated style
repo/project global style
user style
filewise diff


# FS

project/
  .propr folder
  project.config - json
projet.config

  style configs
  -> local git ignore
  custom diffs

—
~/
  .propr/
    user.config
    —custom


# Roadmap

diff for file levels
IDE plugins
UI to create configs
plugins for different formatting programs


# FAQ

If we store user style diffs, will we have race condition issue as we get multiple commits?
IDK

What if the file you want to commit gets messed up during formatting?
Change your style guide


# TODO
  - undo all changes if there is an error
  - implement git init flag
  - propr delete
  
