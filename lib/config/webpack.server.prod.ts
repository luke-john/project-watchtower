import { CreateWebpackConfig } from 'lib/runtime/server'
import merge from 'webpack-merge'
import getWebpackHooks, { getHook } from './webpack-hooks'
import baseConfig from './webpack.base'
import prodConfig from './webpack.prod'
import serverBaseConfig from './webpack.server'

/** Webpack config for the server in production */
const config: CreateWebpackConfig = options => {
    const webpackHooks = getWebpackHooks(options.log, options.buildConfig.BASE)

    return merge(
        baseConfig(options),
        getHook(webpackHooks.base, options),
        serverBaseConfig(options),
        getHook(webpackHooks.server, options),
        prodConfig(options),
        getHook(webpackHooks.prod, options),
        getHook(webpackHooks.serverProd, options),
    )
}

export default config
