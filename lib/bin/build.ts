import * as path from 'path'
import cleanBin from './clean'
import lint from './lint'
import test from './test'
import { ENVIRONMENTS, getWebpackConfig, TARGETS } from '../build/build'
import clean from '../clean'
import { failPromisesLate } from '../util/async'
import { webpackPromise } from '../util/webpack'
import { BuildEnvironment, BuildParam, BuildTarget } from '../types'
import { BuildConfig, RuntimeConfig } from '../../lib'
import { Logger } from '../runtime/universal'
import { writeFile } from '../runtime/util/fs'
import { watchtowerConfigFilename } from '../runtime/config/config'

const buildTarget = (
    log: Logger,
    buildConfig: BuildConfig,
    target: BuildTarget,
    environment: BuildEnvironment = 'prod',
) => {
    const config = getWebpackConfig(log, buildConfig, target, environment)

    if (!config) {
        return Promise.reject(`Could not load webpack configuration for ${target}/${environment}!`)
    }

    return webpackPromise(log, config).then(() => {
        const runtimeConfig: RuntimeConfig = {
            BASE: '.',
            ASSETS_PATH: buildConfig.ASSETS_PATH_PREFIX,
            ASSETS_PATH_PREFIX: buildConfig.ASSETS_PATH_PREFIX,
            SERVER_PUBLIC_DIR: buildConfig.SERVER_PUBLIC_DIR === false ? false : 'public/',
            PUBLIC_PATH: buildConfig.PUBLIC_PATH,
        }
        // On success write out watchtower config
        return writeFile(
            log,
            path.join(buildConfig.OUTPUT, watchtowerConfigFilename),
            JSON.stringify(runtimeConfig, undefined, 2),
        )
    })
}

const cleanAndBuild = (
    log: Logger,
    buildConfig: BuildConfig,
    target: BuildTarget,
    environment: BuildEnvironment = 'prod',
) => {
    const cleanTarget = buildConfig.OUTPUT

    return clean(log, cleanTarget).then(() => buildTarget(log, buildConfig, target, environment))
}

const getBuildEnvironment = (args: BuildParam[]) => {
    for (const arg of args) {
        if (typeof arg !== 'string') {
            continue
        }
        if ((ENVIRONMENTS as string[]).indexOf(arg) !== -1) {
            return arg as BuildEnvironment
        }
    }
    return 'prod'
}

const getBuildTargets = (buildConfig: BuildConfig, args: BuildParam[]) => {
    for (const arg of args) {
        if (!buildConfig.HAS_SERVER && arg === 'server') {
            continue
        }
        if (typeof arg !== 'string') {
            continue
        }
        if ((TARGETS as string[]).indexOf(arg) !== -1) {
            return [arg] as BuildTarget[]
        }
    }

    const defaultTargets = buildConfig.HAS_SERVER ? ['server', 'client'] : ['client']

    return defaultTargets as BuildTarget[]
}

/**
 * Builds one or all targets in a specified environment
 * @param args
 *  [complete] [<target>] [<environment>] [-p <project root>]
 *  - target defaults to both server and client
 *  - environment defaults to prod
 *  - complete: runs clean, lint and test before building
 *  - p: the root of the build, used for config discovery
 */
const build = async (log: Logger, buildConfig: BuildConfig, ...args: BuildParam[]) => {
    const targets = getBuildTargets(buildConfig, args)
    const environment = getBuildEnvironment(args)

    if (args.indexOf('complete') !== -1) {
        await cleanBin(log, buildConfig)
        await lint(log, buildConfig)
        await test(log, buildConfig, '--silent', '--coverage')
        // we have to fail promises late because otherwise the build servers would hang
        // if we exit the process before all webpack builds are completed
        return failPromisesLate(
            log,
            targets.map(target => buildTarget(log, buildConfig, target, environment)),
        )
    } else {
        return failPromisesLate(
            log,
            targets.map(target => cleanAndBuild(log, buildConfig, target, environment)),
        )
    }
}

export default build
