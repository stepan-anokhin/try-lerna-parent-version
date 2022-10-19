const lib = require("./index")

test("b", () => {
  expect(lib.b()).toEqual("b-updated-4")
})
