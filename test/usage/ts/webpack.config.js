const path = require('path');
const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'app.ts'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js'
  },
  module: {
    rules: [{
      test: /\.ts$/,
      use: ['ts-loader'],
      exclude: /node_modules/,
    },
    { // Processing `js` files
      test: /\.js$/,
      exclude: /node_modules/,
      use: ['babel-loader']
    },
    { // Processing `html` files
      test: /\.html$/i,
      use: {
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
          context: './src',
        }
      },
      exclude: [/node_modules/]
    },
    { // Processing `css` files
      test: /\.css$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
          context: './src',
        }
      },
      exclude: [/node_modules/]
    },
    { // Processing `sass` files
      test: /\.s[ac]ss$/i,
      use: [{ // Output the files
        loader: 'file-loader',
        options: {
          name: '[path][name].css',
          context: './src',
        }
      },
      // Extracts the content from css-loader
      'extract-loader',
      // Translates CSS into CommonJS
      'css-loader',
      // Compiles Sass to CSS
      'sass-loader',
      ],
      exclude: [/node_modules/]
    },
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        test: /\.css$/i,
      }),
      new HtmlMinimizerPlugin({
        test: /\.html$/i,
      }),
      new TerserPlugin({
        test: /\.js(\?.*)?$/i,
      }),
    ],
  },
};