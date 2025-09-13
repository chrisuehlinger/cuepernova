import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    },
    entry: {
      // React app entry
      'bundle': './src-react/index.tsx',
      // Static page entries
      'static/control': './src/static/control.ts',
      'static/cuestation': './src/static/cuestation.ts',
      'static/mapping-editor': './src/static/mapping-editor.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: '[name].js',
      clean: {
        dry: false,
        keep: (asset) => {
          // Keep HTML files and other non-JS assets during rebuilds
          return !asset.endsWith('.js') && !asset.endsWith('.js.map');
        },
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: path.resolve(__dirname, 'src/static'),
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.browser.json',
                transpileOnly: isDevelopment,
                experimentalWatchApi: true,
                experimentalFileCaching: true,
              },
            },
          ],
        },
        {
          test: /\.tsx?$/,
          include: path.resolve(__dirname, 'src-react'),
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.json',
                transpileOnly: isDevelopment,
                experimentalWatchApi: true,
                experimentalFileCaching: true,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]',
          },
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@shared': path.resolve(__dirname, 'src/types'),
      },
    },
    plugins: [
      // Only generate HTML for the React app
      new HtmlWebpackPlugin({
        template: './src-react/index.html',
        title: 'Cuepernova',
        chunks: ['bundle'],
        filename: 'index.html',
      }),
      // Copy static HTML and CSS files to dist
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/static/*.html',
            to: '../static/[name][ext]',
          },
          {
            from: 'src/static/css',
            to: '../static/css',
          },
        ],
      }),
      isDevelopment && new ReactRefreshWebpackPlugin({
        include: /src-react/,
      }),
    ].filter(Boolean),
    optimization: {
      splitChunks: false,
    },
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'dist/renderer'),
        publicPath: '/',
      },
    },
    devtool: isDevelopment ? 'inline-source-map' : false,
  };
};