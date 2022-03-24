module.exports = {
    packagerConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'electron_forge_sample2'
            }
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: [
                'darwin'
            ]
        },
        {
            name: '@electron-forge/maker-deb',
            config: {}
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {}
        }
    ],
    plugins: [
        [
            '@electron-forge/plugin-webpack',
            {
                mainConfig: './webpackConfigs/webpack.main.config.js',
                devContentSecurityPolicy: `connect-src 'self' *.cloudflare.com azureiotcentral.com *.azureiotcentral.com 'unsafe-eval'; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:`,
                renderer: {
                    // nodeIntegration: true,
                    config: './webpackConfigs/webpack.renderer.config.js',
                    entryPoints: [
                        {
                            html: './src/renderer/index.html',
                            js: './src/renderer/index.tsx',
                            name: 'main_window',
                            preload: {
                                js: './src/main/contextBridge.js'
                            }
                        }
                    ]
                }
            }
        ]
    ]
}
