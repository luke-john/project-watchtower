declare module 'webpack-merge' {
    import { Configuration } from 'webpack'

    export = webpackMerge

    declare const webpackMerge: webpackMerge.WebpackMerge

    declare namespace webpackMerge {
        type CustomizeArrayFunction = (a: any[], b: any[], key: string) => any[] | null | undefined
        type CustomizeObjectFunction = (a: {}, b: {}, key: string) => {} | null | undefined
        type UniqueFunction = (
            field: string,
            fields: string[],
            keyFn: (field: any) => string,
        ) => CustomizeArrayFunction
        interface CustomizeOptions {
            customizeArray?: CustomizeArrayFunction | UniqueFunction
            customizeObject?: CustomizeObjectFunction
        }
        type ConfigurationMergeFunction = (...configs: Configuration[]) => Configuration
        type ConfigurationMergeConfigFunction = (
            customizeOptions: CustomizeOptions,
        ) => ConfigurationMergeFunction
        type MergeFunction = ConfigurationMergeFunction | ConfigurationMergeConfigFunction
        type MergeStrategy = 'prepend' | 'append' | 'replace'

        interface WebpackMerge {
            (...configs: Configuration[]): Configuration
            (customizeOptions: CustomizeOptions): ConfigurationMergeFunction
            unique: UniqueFunction
            smart: ConfigurationMergeFunction
            multiple: ConfigurationMergeFunction
            strategy(options: { [field: string]: MergeStrategy }): ConfigurationMergeFunction
            smartStrategy(options: { [key: string]: MergeStrategy }): ConfigurationMergeFunction
        }
    }
}
