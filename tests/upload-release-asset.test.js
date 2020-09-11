jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('fs');

const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');
const fs = require('fs');
const run = require('../src/upload-release-asset');

/* eslint-disable no-undef */
describe('Upload Release Asset', () => {
  let uploadReleaseAsset;

  const inputsForSingleAsset = input => {
    if (input === 'upload_url') {
      return 'upload_url_value';
    }
    if (input !== 'assets_from_file') {
      return `${input}_value`;
    }
    return '';
  };
  const inputsForMultipleAssets = input => {
    if (input === 'upload_url') {
      return 'upload_url_value';
    }
    if (input === 'assets_from_file') {
      return 'foo';
    }
    return '';
  };

  beforeEach(() => {
    uploadReleaseAsset = jest.fn().mockReturnValue({});

    context.repo = {
      owner: 'owner',
      repo: 'repo'
    };

    const github = {
      repos: {
        uploadReleaseAsset
      }
    };

    GitHub.mockImplementation(() => github);
  });

  /*
  test('Upload release asset endpoint is called', async () => {
    // Mock `contentLengthOf`.
    fs.statSync = jest.fn().mockReturnValueOnce({ size: 527 });

    // Mock the asset content.
    const asset_content = Buffer.from('asset content');
    fs.readFileSync = jest.fn().mockReturnValueOnce(asset_content);

    // Mock the inputs.
    core.getInput = jest.fn(inputsForSingleAsset);

    // Run.
    await run();

    // Assert.
    expect(uploadReleaseAsset).toHaveBeenCalledWith({
      url: 'upload_url_value',
      headers: { 'content-type': 'asset_content_type_value', 'content-length': 527 },
      name: 'asset_name_value',
      file: asset_content
    });
  });
  */

  test('Upload multiple release assets endpoint is called', async () => {
    const asset_content = Buffer.from('test content');
    fs.readFileSync = jest
      .fn()
      // Mock the first `readFileSync` to read the `asserts_from_file` file.
      .mockReturnValueOnce(
        'asset_path_1\tasset_name_1\tasset_content_type_1\n' +
          'asset_path_2\tasset_name_2\tasset_content_type_2\n' +
          'asset_path_3\tasset_name_3\tasset_content_type_3'
      )
      // Mock all the assert contents.
      .mockReturnValue(asset_content);

    // Mock `contentLengthOf`.
    fs.statSync = jest.fn().mockReturnValue({ size: 527 });

    // Mock the inputs.
    core.getInput = jest.fn(inputsForMultipleAssets);

    // Run.
    await run();

    // Assert.
    expect(uploadReleaseAsset).toHaveBeenNthCalledWith(1, {
      url: 'upload_url_value',
      headers: { 'content-type': 'asset_content_type_1', 'content-length': 527 },
      name: 'asset_name_1',
      file: asset_content
    });
    expect(uploadReleaseAsset).toHaveBeenNthCalledWith(2, {
      url: 'upload_url_value',
      headers: { 'content-type': 'asset_content_type_2', 'content-length': 527 },
      name: 'asset_name_2',
      file: asset_content
    });
    expect(uploadReleaseAsset).toHaveBeenNthCalledWith(3, {
      url: 'upload_url_value',
      headers: { 'content-type': 'asset_content_type_3', 'content-length': 527 },
      name: 'asset_name_3',
      file: asset_content
    });
  });

  /*
  test('Output is empty', async () => {
    core.getInput = jest.fn(inputsForSingleAsset);
    core.setOutput = jest.fn();

    await run();

    expect(core.setOutput).toHaveBeenCalledTimes(0);
  });

  /*
  test('Action fails elegantly', async () => {
    core.getInput = jest.fn(inputsForSingleAsset);

    uploadReleaseAsset.mockRestore();
    uploadReleaseAsset.mockImplementation(() => {
      throw new Error('Error uploading release asset');
    });

    core.setOutput = jest.fn();
    core.setFailed = jest.fn();

    await run();

    expect(uploadReleaseAsset).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Error uploading release asset');
    expect(core.setOutput).toHaveBeenCalledTimes(0);
  });
  */
});
