const core = require('@actions/core');
const { GitHub } = require('@actions/github');
const fs = require('fs');

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const uploadUrl = core.getInput('upload_url', { required: true });
    const assetsFromFile = core.getInput('assets_from_file', { required: false });

    const assets = [];

    if (assetsFromFile.length > 0) {
      const assetsTsv = fs.readFileSync(assetsFromFile, { encoding: 'utf8', flag: 'r' });
      const assetsRaw = assetsTsv
        .trim()
        .split(/\n/)
        .map(line => line.split(/\t/));

      if (!assetsRaw.every(asset => asset.length === 3)) {
        throw new Error(`Assets from file seem broken, it must contain 3 columns for every line`);
      }

      assetsRaw.forEach(asset => {
        assets.push({ path: asset[0], name: asset[1], 'content-type': asset[2] });
      });
    }
    // No `assets_from_file` input.
    else {
      const assetPath = core.getInput('asset_path', { required: true });
      const assetName = core.getInput('asset_name', { required: true });
      const assetContentType = core.getInput('asset_content_type', { required: true });

      assets.push({ path: assetPath, name: assetName, 'content-type': assetContentType });
    }

    // Determine content-length for header to upload asset
    const contentLengthOf = filePath => fs.statSync(filePath).size;

    await Promise.all(
      assets.map(async ({ path: assetPath, name: assetName, 'content-type': assetContentType }) => {
        // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information
        const headers = { 'content-type': assetContentType, 'content-length': contentLengthOf(assetPath) };

        // Upload a release asset
        // API Documentation: https://developer.github.com/v3/repos/releases/#upload-a-release-asset
        // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
        await github.repos.uploadReleaseAsset({
          url: uploadUrl,
          headers,
          name: assetName,
          file: fs.readFileSync(assetPath)
        });
      })
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
