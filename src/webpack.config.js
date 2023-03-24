const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin');
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const fs = require('fs');

function NullPlugin() { }
NullPlugin.prototype.apply = function () { };

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    var exports = {
        entry: path.resolve(__dirname, './main.js'),
        target: 'web',
        mode: argv.mode,
        output: {
            path: path.resolve(__dirname, '../dist'),
            publicPath: '/',
            filename: '[contenthash:20].js',
            crossOriginLoading: 'anonymous',
        },
        cache: {
            type: 'filesystem'
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    options: {
                        transformAssetUrls: {
                            video: ['src', 'poster'],
                            source: 'src',
                            img: 'src',
                            image: 'xlink:href',
                            object: 'data'
                        },
                        include: [
                            path.resolve(__dirname),
                            path.resolve(__dirname, '../node_modules/vuetify/src'),
                        ]
                    }
                },
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    include: [
                        path.resolve(__dirname),
                        path.resolve(__dirname, '../node_modules/vuetify/src')
                    ]
                },
                {
                    test: /\.(png|jpe?g|gif|svg|ttf|woff2?|eot|wasm)(\?.*)?$/,
                    type: 'asset/resource'
                },
                {
                    test: /\.css$/,
                    use: [isProduction ? MiniCssExtractPlugin.loader : 'vue-style-loader', 'css-loader']
                },
                {
                    test: /\.sass$/i,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'vue-style-loader',
                        { loader: 'css-loader', options: { esModule: false } },
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    includePaths: [path.resolve(__dirname, "assets")]
                                },
                                additionalData: `@import "_variables.scss"`
                            }
                        }
                    ]
                },
                {
                    test: /\.scss$/i,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'vue-style-loader',
                        { loader: 'css-loader', options: { esModule: false } },
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    includePaths: [path.resolve(__dirname, "assets")]
                                },
                                additionalData: `@import "_variables.scss";`
                            }
                        }
                    ]
                },
            ]
        },
        resolve: {
            extensions: ['.js', '.vue', '.json'],
            alias: {
                'vue$': 'vue/dist/vue.runtime.esm.js'
            }
        },
        experiments: {
            asyncWebAssembly: false
        },
        plugins: [
            new webpack.DefinePlugin({
                __CONFIG__: JSON.stringify(require('../package.json').configuration),
                'process.env': {
                    NODE_ENV: JSON.stringify(argv.mode)
                },
            }),
            new VueLoaderPlugin(),
            new VuetifyLoaderPlugin(),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, './index.html'),
            }),
            isProduction ?
                new MiniCssExtractPlugin({
                    filename: '[contenthash:20].css',
                }) : new NullPlugin(),
            new SubresourceIntegrityPlugin({
                enabled: isProduction,
                hashFuncNames: ['sha256', 'sha384']
            }),
            new CompressionPlugin({
                test: isProduction ? /\.(js|html|css|svg|woff2?|map|ico|wasm)(\?.*)?$/i : undefined,
                minRatio: 1
            }),
            false && isProduction ? new ImageMinimizerPlugin({
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminMinify,
                    options: {},
                },
            }) : new NullPlugin(),
        ],
        devtool: isProduction ? 'source-map' : 'eval-source-map'
    }

    if (!isProduction) {
        exports.devServer = {
            historyApiFallback: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:3000'
                }
            }
        };
    }

    return exports;
}
