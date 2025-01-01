import { App, Plugin, PluginSettingTab, Setting, Platform } from "obsidian"




let sendHandle: any
class AppProxy {
  public sendHandle: any

  constructor() {
    sendHandle = (window as any).electron.ipcRenderer.send
  }

  reg(plugin: GithubProxy) {
    console.log("注册app代理")
    ;(window as any).electron.ipcRenderer.send = function (a: any, b: any, e: any, ...rest: any) {
      if (eisURL(e, plugin)) {
        matchUrl(e, plugin)
      }
      console.log("app代理", a, b, e, rest)
      sendHandle(a, b, e, ...rest)
    }
  }

  unReg(plugin: GithubProxy) {
    console.log("注销app代理")
    ;(window as any).electron.ipcRenderer.send = sendHandle
  }
}



export default class GithubProxy extends Plugin {
  settings: PluginSettings
  appProxy: AppProxy

  proxyServers: { [key: string]: { down: string; raw: string; home: string } } = {
    github_diybeta_proxy: {
      down: "https://github.diybeta.com/https://github.com/",
      raw: "https://github.diybeta.com/https://raw.githubusercontent.com/",
      home: "https://github.diybeta.com/https://github.com/",
    },
  }

  proxyReplace: { match: (url: string) => boolean; to: (url: string) => string }[] = [
    {
      match: (url: string) => url.startsWith("https://github.com/") && url.indexOf("/releases/download/") >= 0,
      to: (url: string) => url.replace("https://github.com/", this.proxyServers[this.settings.proxyServer].down),
    },
    {
      match: (url: string) => url.startsWith("https://raw.githubusercontent.com/"),
      to: (url: string) => url.replace("https://raw.githubusercontent.com/", this.proxyServers[this.settings.proxyServer].raw),
    },
    {
      match: (url: string) => url.startsWith("https://github.com/"),
      to: (url: string) => url.replace("https://github.com/", this.proxyServers[this.settings.proxyServer].home),
    },
  ]

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }
  async saveSettings(isStatusCheck: boolean = true) {
    await this.saveData(this.settings)
  }

  async onload() {
    await this.loadSettings()
    // 注册设置选项
    this.addSettingTab(new GithubProxySettingTab(this.app, this))

    this.appProxy = new AppProxy()
    this.appProxy.reg(this)
  }

  onunload() {
    this.appProxy.unReg(this)
  }
}

function eisURL(e: any, plugin: GithubProxy): boolean {
  if (!e || !e.url) {
    return false
  }
  return plugin.proxyReplace.some((item: any) => item.match(e.url))
}

function matchUrl(e: any, plugin: GithubProxy): boolean {
  console.log("原始访问：" + JSON.stringify(e))
  for (const item of plugin.proxyReplace) {
    if (e && e.url && item.match(e.url)) {
      e.url = item.to(e.url)
      console.log("实际访问：" + JSON.stringify(e))
      if (!e.headers) {
        e.headers = {}
      }
      e.headers["content-type"] = "application/x-www-form-urlencoded"
      e.headers["Access-Control-Allow-Origin"] = "*"
      return true
    }
  }
  return false
}

export interface PluginSettings {
  proxyServer: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
  // 是否自动上传
  proxyServer: "",
}

class GithubProxySettingTab extends PluginSettingTab {
  plugin: GithubProxy

  constructor(app: App, plugin: GithubProxy) {
    super(app, plugin)
    this.plugin = plugin
  }
  display(): void {
    const { containerEl: set } = this

    set.empty()

    new Setting(set)
      .setName("代理服务器")
      .setDesc(`通过选择不同的服务器来切换代理，可以解决某些情况下，某个服务器无法访问的情况。当前代理服务器：`)
      .addDropdown((dropDown: any) => {
        dropDown.addOption(this.plugin.settings.proxyServer, "请选择")
        for (const one in this.plugin.proxyServers) {
          dropDown.addOption(one, one)
        }
        dropDown.onChange(async (value: any) => {
          this.plugin.settings.proxyServer = value
          await this.plugin.saveSettings()
        })
      })
  }
}
