import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: {
      // React app entry
      'bundle': './src-react/index.tsx',
      // Static page entries
      'static/control': './static-src/js/control.ts',
      'static/cuestation': './static-src/js/cuestation.ts',
      'static/mapping': './static-src/js/mapping.ts',
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
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.json',
                transpileOnly: isDevelopment,
              },
            },
          ],
          exclude: /node_modules/,
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
      static: [
        {
          directory: path.join(__dirname, 'static'),
          publicPath: '/static',
        },
        {
          directory: path.join(__dirname, 'dist/renderer'),
          publicPath: '/',
        },
      ],
    },
    devtool: isDevelopment ? 'inline-source-map' : false,
  };
};