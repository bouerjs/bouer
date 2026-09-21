import path from 'node:path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __dirname = import.meta.dirname;

export default {
  entry: './app.js',
  mode: 'development',
  context: path.resolve(__dirname, 'src'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html'
    })
  ],
  module: {
    rules: [
      { // Processing `js` files
        test: /\.js$/,
        exclude: [/node_modules/],
        use: ['babel-loader']
      },

      { // Process the `index.html` file
        test: /\.html$/i,
        include: [/index\.html$/],
        exclude: [/node_modules/],
        loader: 'html-loader',
        options: {
          sources: true
        },
      },

      { // Processing `html` files except `index.html`
        test: /\.html$/i,
        exclude: [/node_modules/, /index\.html$/],
        type: 'asset/resource',
        generator: {
          filename: '[path][name].[ext]'
        }
      },

      { // Processing `css` files
        test: /\.css$/i,
        type: 'asset/resource',
        generator: {
          filename: '[path][name].[ext]'
        }
      },

      { // Processing `scss` files, and compiling them into `css`
        test: /\.s[ac]ss$/i,
        type: 'asset/resource',
        generator: {
          filename: '[path][name].css'
        },
        use: ['sass-loader']
      }
    ]
  }
};