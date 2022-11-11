const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;
const semver = require("semver");

/**
 * List packages changed since the last GA-release.
 * @returns [{name,version,location}]
 */
function listChanged() {
  let lernaOutput;
  try {
    lernaOutput = execSync("lerna changed --json --include-merged-tags", {
      encoding: "utf-8",
    });
  } catch (error) {
    console.warn("No changes detected.");
    return [];
  }
  return JSON.parse(lernaOutput);
}

/**
 * List all packages in topological order.
 * @returns [{name,version,location}]
 */
function listPackages() {
  // Note that we are sorting packages in topological order (namely,
  // dependencies before dependents, instead lexical sort by location)
  // by setting the --toposort flag. This is required because then we
  // use this list to repair dependencies versions. Otherwise, repaired
  // package-lock.json files might be incorrect.
  const lernaOutput = execSync("lerna list --json --toposort", {
    encoding: "utf-8",
  });
  return JSON.parse(lernaOutput);
}

/**
 * Get the latest pre-release version for the given package
 * that was published since the last GA-release.
 */
function getPreVersion(pkg, options = {}) {
  const { registry = "http://localhost:4873" } = options;
  const { distTag = "next" } = options;

  let npmOutput;
  try {
    npmOutput = execSync(`npm dist-tag ${pkg.name} --registry ${registry}`, {
      encoding: "utf-8",
    });
  } catch (error) {
    if (error.stderr?.includes("npm ERR! code E404")) {
      console.log("New package:", pkg.name);
    } else {
      throw error;
    }
  }
  const found = new RegExp(`(?<=${distTag}:\\s).*`).exec(npmOutput); // e.g. `next: v2.0.1-beta.0`
  if (!found) {
    return;
  }
  const foundVersion = found[0];
  if (semver.lt(pkg.version, foundVersion)) {
    return foundVersion;
  }
}

/**
 * Read `package.json` file of the given package.
 */
function readPackageJSON(pkg) {
  const manifestPath = path.join(pkg.location, "package.json");
  const manifestText = fs.readFileSync(manifestPath, { encoding: "utf-8" });
  return JSON.parse(manifestText);
}

/**
 * Write `package.json` file of the given package.
 */
function writePackageJSON(pkg, manifest) {
  const manifestPath = path.join(pkg.location, "package.json");
  const manifestText = JSON.stringify(manifest);
  fs.writeFileSync(manifestPath, manifestText, { encoding: "utf-8" });
}

/**
 * Set a new package version in its `package.json` manifest.
 */
function setVersion(pkg, newVersion) {
  execSync(`npm --no-git-tag-version version ${newVersion}`, {
    cwd: pkg.location,
    encoding: "utf-8",
  });
}

/**
 * Repair dependencies on packages with restored pre-release versions.
 */
function repairDependencies(parent, updatedPackages) {
  const manifest = readPackageJSON(parent);
  if (!manifest.dependencies) {
    return;
  }

  let repaired = false;
  for (const childPackage of updatedPackages) {
    if (!manifest.dependencies[childPackage.name]) {
      continue;
    }
    const dependencyVersion = manifest.dependencies[childPackage.name];
    if (semver.satisfies(childPackage.version, dependencyVersion)) {
      // Since we don't use `package-lock.json` files, we can simply
      // update dependency versions in `package.json`.
      // We can also ignore changes in `package.json` attributes ordering,
      // as these will not be pushed.
      manifest.dependencies[childPackage.name] = childPackage.preVersion;
      repaired = true;
    } else {
      console.error({
        parent,
        child: childPackage,
        message: "Dependency version mismatch!",
      });
    }
  }
  if (repaired) {
    writePackageJSON(parent, manifest);
    console.log(`Repaired dependencies for ${parent.name}:`);
    console.log(manifest.dependencies);
  }
}

/**
 * List packages that was pre-released with the given distTag since the last
 * GA-release.
 *
 * @returns [{name,version,preVersion,location}]
 */
function listPreReleased(distTag, registry) {
  const preReleased = [];
  for (const pkg of listChanged()) {
    const preVersion = getPreVersion(pkg, { registry, distTag });
    if (preVersion) {
      preReleased.push({ ...pkg, preVersion });
    }
  }
  return preReleased;
}

/**
 * Restore pre-release versions of all packages in the project
 * that were published since the last GA-release.
 */
function restorePreReleaseVersions(distTag, registry) {
  const restoreList = listPreReleased(distTag, registry);
  console.log("Previously pre-released packages list:");
  console.log(restoreList);

  // Restore pre-release version of published packages
  for (const pkg of restoreList) {
    setVersion(pkg, pkg.preVersion);
  }

  // Repair mutual dependencies
  for (const pkg of listPackages()) {
    repairDependencies(pkg, restoreList);
  }
}

const distTag = process.argv[2];
const registry = process.argv[3];
restorePreReleaseVersions(distTag, registry);
