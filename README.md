# Example Lerna Root Package Versioning

Experiment with the [Lerna's](https://lerna.js.org/) approach to package versioning.

## Set up the Environment

### Create Packages

Create empty root package:
```json
{
    "name": "@project/dummy-root",
    "version": "1.0.0",
    "description": "Dummy root package",
    "author": "Stepan Anokhin",
    "license": "ISC"
}
```

Save NPM version:
```shell
node -v > .nvmrc
```

Create child packages `a`, `b` and `c` in the `packages` folder:
```json
{
    "name": "@project/a",
    "version": "1.0.0",
    "main": "index.js",
    "description": "Library A",
    "author": "Stepan Anokhin",
    "license": "ISC"
}
```

Add a simple function and tests for demonstrational purpose:
```shell
npm install --save-dev jest
```
`index.js`:
```js
exports.a = function a() {
  return "a"
}
```
`index.test.js`:
```js
const lib = require("./index")

test("a", () => {
  expect(lib.a()).toEqual("a")
})
```
`package.json`:
```json
{
    "scripts": {
        "test": "jest"
    }
}
```
Finally, create an empty parent package, which depends on the libs in `packages/parent`:
```json
{
    "name": "@project/parent",
    "version": "1.0.0",
    "description": "Parent package, required to group the other packages into a single dependency.",
    "author": "Stepan Anokhin",
    "license": "ISC",
    "dependencies": {
        "@project/a": "*",
        "@project/b": "*",
        "@project/c": "*"
    }
}
```

## Set up Lerna

Install Lerna:
```shell
npm install --save-dev lerna
```

Create Lerna config `lerna.json`:
```json
{
  "packages": [
    "packages/*"
  ],
  "command": {
    "bootstrap": {
      "registry": "http://localhost:4873"
    },
    "version": {
      "registry": "http://localhost:4873"
    },
    "publish": {
      "registry": "http://localhost:4873"
    }
  },
  "version": "independent",
  "granularPathspec": false
}
```
Prepare [verdaccio](https://verdaccio.org/docs/docker#running-verdaccio-using-docker) config:
```shell
mkdir -p ./registry/conf && curl https://raw.githubusercontent.com/verdaccio/verdaccio/5.x/conf/docker.yaml -o ./registry/conf/config.yaml
```

Run the local [verdaccio](https://verdaccio.org/docs/docker#running-verdaccio-using-docker) registry:
```shell
V_PATH="$(pwd)/registry"; sudo docker run -it --rm --name verdaccio \
  -p 4873:4873 \
  -v $V_PATH/conf:/verdaccio/conf \
  -v $V_PATH/storage:/verdaccio/storage \
  -v $V_PATH/plugins:/verdaccio/plugins \
  verdaccio/verdaccio
```

Fix the [permission problem](https://github.com/verdaccio/verdaccio/issues/1379) (host machine, after registry start):
```shell
sudo chown 10001:65533 ./registry/*
```

Sign-in `npm` to a local registry:
```shell
npm adduser --registry http://localhost:4873
```

Initialize Lerna:
```shell
npx lerna init
```

Visualize Project:
```shell
npx nx graph
```

[Bootstrap](https://lerna.js.org/docs/getting-started#bootstrapping-projects) projects:
```shell
npx lerna bootstrap
```

This added sym-links to `a`, `b` and `c` libraries to the `packages/parent/node_modules/` directory.

Test all projects:
```shell
npx lerna run test
```

Publish packages:
```shell
npx lerna publish from-package --yes
```
```
...
Successfully published:
 - @project/a@1.0.0
 - @project/b@1.0.0
 - @project/c@1.0.0
 - @project/parent@1.0.0
lerna success published 4 packages
```

Bump version:
```shell
npx lerna version
```
```
lerna notice cli v6.0.1
lerna info versioning independent
lerna info Assuming all packages changed
? Select a new version for @project/a (currently 1.0.0) Patch (1.0.1)
? Select a new version for @project/b (currently 1.0.0) Patch (1.0.1)
? Select a new version for @project/c (currently 1.0.0) Patch (1.0.1)
? Select a new version for @project/parent (currently 1.0.0) Patch (1.0.1)

Changes:
 - @project/a: 1.0.0 => 1.0.1
 - @project/b: 1.0.0 => 1.0.1
 - @project/c: 1.0.0 => 1.0.1
 - @project/parent: 1.0.0 => 1.0.1

? Are you sure you want to create these versions? Yes
lerna info execute Skipping releases
lerna info git Pushing tags...
lerna success version finished
```

This command created a new commit:
```
2022-10-18 11:38 +0700 Stepan Anokhin o [master] {origin/master} <@project/a@1.0.1> <@project/b@1.0.1> <@project/c@1.0.1> <@project/parent@1.0.1> Publish
```

In which it changed the `@project/parent` dependencies versions to the new ones:
```json
{
    "name": "@project/parent",
    "...": "...",
    "dependencies": {
        "@project/a": "^1.0.1",
        "@project/b": "^1.0.1",
        "@project/c": "^1.0.1"
    }
}
```

Now let's publish updated versions again (all changes must be committed):
```shell
npx lerna publish from-package --yes
```

## Update a Child Package

Change the `@project/a` library. 

`./index.js`:
```diff
exports.a = function a() {
-  return "a"
+  return "a-updated"
}
```

`./index.test.js`:
```diff
const lib = require("./index")

test("a", () => {
-  expect(lib.a()).toEqual("a")
+  expect(lib.a()).toEqual("a-updated")
})
```

Use [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/#commit-message-with-scope-and--to-draw-attention-to-breaking-change)
message for a breaking change in the `@project/a` library:
```shell
git commit -m 'feat(a)!: Add breaking change to the @project/a package'
```

