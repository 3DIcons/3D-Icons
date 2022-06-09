// Core Node
import {resolve, relative, join} from 'node:path';
import {rename, rm, mkdir, stat} from 'node:fs/promises'

// NPM
import runCommand from '@nrwl/workspace/src/executors/run-commands/run-commands.impl';
import {promisify} from 'util';
import * as glob from 'glob';

// NPM Types
import type {RunCommandsOptions} from '@nrwl/workspace/src/executors/run-commands/run-commands.impl';
import type {Executor, ExecutorContext} from '@nrwl/devkit';

// Local
import type {Fbx2GltfOptions} from './schema.interface';
import changeNpmScriptExecutor from '@nrwl/workspace/src/migrations/update-14-0-0/change-npm-script-executor';
import {writeToFile} from '@nrwl/workspace/src/utils/fileutils';


const $glob = promisify(glob)

const readFbxFiles =
  async (root: string, dir: string, format = '**/*.fbx'): Promise<Array<string>> =>
    (await $glob(`${dir}/${format}`))
      .map(path => relative(root, path))

const convertFile = async (
  context: ExecutorContext,
  cwd: string,
  input: string,
  options: Fbx2GltfOptions,
) => {

  const [output] = input.split('/').pop().split('.');
  const fromDir = join(cwd, 'dist', `${output}_out`);
  const toDir = join(cwd, 'dist', `${output}`);

  const args = [
    `--input ${input}`,
    `--output ./dist/${output}`,
    options.animFramerate && `--anim-framerate ${options.animFramerate}`,
    options.binary && '--embed',
    options.blendShapeNormals && '--blend-shape-normals',
    options.blendShapeTangents && '--blend-shape-tangents',
    options.computeNormals && `--compute-normals ${options.computeNormals}`,
    options.draco && '--draco',
    options.draco && options.dracoBitsForColors && `--draco-bits-for-colors ${options.dracoBitsForColors}`,
    options.draco && options.dracoBitsForNormals && `--draco-bits-for-normals ${options.dracoBitsForNormals}`,
    options.draco && options.dracoBitsForOther && `--draco-bits-for-other ${options.dracoBitsForOther}`,
    options.draco && options.dracoBitsForPosition && `--draco-bits-for-position ${options.dracoBitsForPosition}`,
    options.draco && options.dracoBitsForUv && `--draco-bits-for-uv ${options.dracoBitsForUv}`,
    options.draco && options.dracoCompressionLevel && `--draco-compression-level ${options.dracoCompressionLevel}`,
    options.embed && '--embed',
    options.flipU && '--flip-u',
    options.flipV && '--flip-v',
    options.keepAttribute && `--keep-attribute ${options.keepAttribute}`,
    options.longIndices && `--long-indices ${options.longIndices}`,
    options.noFlipU && '--no-flip-u',
    options.noFlipV && '--no-flip-v',
    options.noKhrLightsPunctual && '--no-khr-lights-punctual',
    options.pbrMetallicRoughness && '--pbr-metallic-roughness',
    options.userProperties && '--user-properties',
    options.verbose && '--verbose',
    options.tmpPath && `--fbx-temp-dir ${options.tmpPath}`,
  ]
    .filter(Boolean)
    .join(' ')

  const command: RunCommandsOptions = {
    command: `FBX2glTF ${args}`,
    cwd,
  };

  if (options.verbose) {
    console.log(command.command);
  }

  try {
    await runCommand(command, context)

    // Rename folder to retain structure
    await rm(toDir, {recursive: true, force: true});
    await rename(fromDir, toDir);

    return `${toDir}/${output}.gltf`;

  } catch (e) {

    await rm(fromDir, {recursive: true, force: true});
    throw new Error(e);

  }

}

interface ManifestEntry {
  path: string;
  size: number;
}

const generateManifest = async (
  files: Array<string>,
  projectRootPath: string,
) => {

  const toFile = join(projectRootPath, 'manifest.json');

  const manifest: Array<ManifestEntry> = await Promise.all(files
    .map(async (file) => {
      const {size} = await stat(file);
      return {
        path: relative(projectRootPath, file),
        size: size,
      }
    }));

  await writeToFile(toFile, JSON.stringify(manifest, null, 2));

}


const Fbx2GltfExecutor: Executor<Fbx2GltfOptions> = async (options, context) => {

  const {inPath} = options;
  const {projectName, root} = context;
  const {root: projectRoot} = context.workspace.projects[projectName];

  const projectRootPath = resolve(root, projectRoot);
  const absoluteSrcPath = resolve(root, projectRoot, inPath);
  const toDir = join(projectRootPath, 'dist');

  const files = await readFbxFiles(projectRootPath, absoluteSrcPath);

  await rm(toDir, {recursive: true, force: true});
  await mkdir(toDir);

  const conversion = files.map(async (inFile) => {

    try {
      const outFile = await convertFile(
        context,
        projectRootPath,
        inFile,
        options,
      );

      return [true, outFile];
    } catch (e) {
      console.log(`Error processing ${inFile}`);
      return [false, inFile];
    }
  });

  const results = await Promise.all(conversion);

  const successes = results
    .filter(([success]) => success)
    .map(([, file]) => file) as Array<string>;


  const errors = results
    .filter(([success]) => !success)
    .map(([, file]) => file) as Array<string>;

  await generateManifest(successes, projectRootPath);

  if (errors.length) {

    const message = [
      `Error: ${errors.length} file(s) could not be processed:`,
      ...errors.map(file => `  - ${file}`),
    ].join('\n');

    throw new Error(message)
  }

  return {success: true};
}


export default Fbx2GltfExecutor;
