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
