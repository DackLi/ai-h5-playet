// CSS 模块类型声明
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// 西瓜播放器样式类型声明
declare module 'xgplayer/dist/index.min.css';

// 西瓜播放器 HLS 插件类型声明
declare module 'xgplayer-hls' {
  /** HLS 插件，用于播放 m3u8 格式视频 */
  export class HlsPlugin {
    static pluginName: string;
    constructor(...args: any[]);
  }
  export default HlsPlugin;
  export function parseSwitchUrlArgs(args: any, plugin: any): any;
  export class Hls {
    constructor(...args: any[]);
  }
  export const logger: any;
  export const EVENT: Record<string, string>;
  export const ERR: Record<string, string>;
  export const ERR_CODE: Record<string, number>;
  export class StreamingError extends Error {}
}
