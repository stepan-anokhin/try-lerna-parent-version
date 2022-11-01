const lib = require("./index")

test("new_lib", () => {
  expect(lib.new_lib()).toEqual("new_lib-updated-0")
})
