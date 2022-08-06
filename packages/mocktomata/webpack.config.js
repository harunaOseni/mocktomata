'use strict';
const paramCase = require('param-case').paramCase
const pascalCase = require('pascal-case').pascalCase
const path = require('path')
const webpack = require('webpack')

const pjson = require('./package.json')

const filename = paramCase(pjson.name)
const globalVariable = pascalCase(filename)

module.exports = {
  devtool: 'inline-source-map',
  entry: {
    'mocktomata': './src/browser'
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.browser.json',
          transpileOnly: true
        }
      }
    ]
  },
  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
    library: globalVariable,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      module: false
    },
    mainFields: ['browser', 'main']
  },
  plugins: [
    new webpack.IgnorePlugin(/fs/),
    new webpack.IgnorePlugin(/module/),
    new webpack.IgnorePlugin(/perf_hooks/)
  ]
}
