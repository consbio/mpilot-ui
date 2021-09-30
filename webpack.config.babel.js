import path from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import sveltePreprocess from 'svelte-preprocess'

const mode = process.env.NODE_ENV || 'development'
const production = mode === 'production'

export default {
  mode,
  watch: !production,
  devtool: 'source-map',
  entry: { 'mpilot-ui': path.resolve('./src/index') },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve('./src/**/*'),
        loader: 'ts-loader',
      },
      {
        test: /\.svelte$/,
        exclude: { and: [/node_modules/], not: [/svelte/] },
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/env', { targets: { ie: '11' } }]],
            },
          },
          {
            loader: 'svelte-loader',
            options: {
              preprocess: sveltePreprocess(),
              compilerOptions: {
                dev: !production,
              },
              emitCss: true,
            },
          },
        ],
      },
      {
        test: /\.m?js$/,
        exclude: { and: [/node_modules/], not: [/svelte/] },
        resolve: {
          fullySpecified: false,
        },
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/env', { targets: { ie: '11' } }]],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../../',
            },
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.ts$/,
        exclude: [/node_modules\/.*\/dist\/.*/],
        use: 'ts-loader',
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].bundle.css',
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    libraryTarget: 'umd',
    library: 'mpilotUI',
    umdNamedDefine: true,
  },
  resolve: {
    modules: ['node_modules', './src'],
    extensions: ['.ts', '.js'],
    fallback: {
      path: require.resolve('path-browserify'),
      fs: false,
    },
  },
}
