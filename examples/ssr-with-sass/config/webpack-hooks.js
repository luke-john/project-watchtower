var path = require('path')
var autoprefixer = require('autoprefixer')
var MiniCssExtractPlugin = require('mini-css-extract-plugin')
var OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

exports.default = {
    base: {
        resolveLoader: {
            // This is needed so this example can resolve webpack loaders
            modules: [
                path.resolve(process.cwd(), 'examples/ssr-with-sass/node_modules'),
                'node_modules',
            ],
        },
    },
    client: {
        module: {
            rules: [
                {
                    test: /\.s?css$/,
                    use: [
                        'css-hot-loader',
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: true,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: true,
                                plugins: () => [autoprefixer({ browsers: ['last 2 versions'] })],
                            },
                        },
                        {
                            loader: 'resolve-url-loader',
                            options: {
                                sourceMap: true,
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                            },
                        },
                    ],
                },
            ],
        },
    },
    clientDev: function(options) {
        return {
            plugins: [
                new MiniCssExtractPlugin({
                    filename: options.buildConfig.ASSETS_PATH_PREFIX + 'css/[name].css',
                }),
            ],
        }
    },
    clientProd: function(options) {
        const cssFilename = options.buildConfig.STATIC_RESOURCE_NAMES
            ? options.buildConfig.ASSETS_PATH_PREFIX + 'css/[name].css'
            : options.buildConfig.ASSETS_PATH_PREFIX + 'css/[name].[contenthash:8].css'

        const cssChunkFilename = options.buildConfig.STATIC_RESOURCE_NAMES
            ? options.buildConfig.ASSETS_PATH_PREFIX + 'css/[name].css'
            : options.buildConfig.ASSETS_PATH_PREFIX + 'css/[name].[contenthash:8].css'

        return {
            plugins: [
                new MiniCssExtractPlugin({
                    filename: cssFilename,
                    chunkFilename: cssChunkFilename,
                }),
            ],
            optimization: {
                minimizer: [new OptimizeCSSAssetsPlugin({})],
            },
        }
    },
    server: {
        module: {
            rules: [
                {
                    test: /\.s?css$/,
                    use: 'null-loader',
                },
            ],
        },
    },
}
