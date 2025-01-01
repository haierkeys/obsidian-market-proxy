const { Plugin, PluginSettingTab, Setting } = require("obsidian")

let server = "github_diybeta_proxy"

const proMap = {
  github_diybeta_proxy: {
    down: "https://github.diybeta.com/https://github.com/",
    raw: "https://github.diybeta.com/https://raw.githubusercontent.com/",
    home: "https://github.diybeta.com/https://github.com/",
  },
}

const include = [
  {
    match: (url) => url.startsWith("https://github.com/") && url.indexOf("/releases/download/") >= 0,
    to: (url) => url.replace("https://github.com/", proMap[server].down),
  },
  {
    match: (url) => url.startsWith("https://raw.githubusercontent.com/"),
    to: (url) => url.replace("https://raw.githubusercontent.com/", proMap[server].raw),
  },
  {
    match: (url) => url.startsWith("https://github.com/"),
    to: (url) => url.replace("https://github.com/", proMap[server].home),
  },
]

// 匹配URL
function matchUrl(e) {
  console.log("原始访问：" + JSON.stringify(e))
  for (const item of include) {
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

// 代理访问
function proxy(e) {
  return new Promise((resolve, reject) => {
    e.success = resolve
    e.error = (error, t) => reject(t)
    if (app.isMobile) {
      forMobile(e)
    } else {
      forPC(e)
    }
  })
}

async function forMobile(e) {
  try {
    const http = require("@capacitor-community/http")
    const options = { url: e.url }
    new window.Notice("发送请求：" + e.url, 10000)
    const resp = await http.get(options)
    new window.Notice("请求成功：" + resp.status, 10000)
    e.success(resp.data)
  } catch (error) {
    e.error(error)
    new window.Notice("加载@capacitor-community/http出错", 10000)
  }
}

function forPC(e) {
  try {
    const https = require("https")
    https.get(e.url, (res) => {
      new window.Notice("https.get成功", 10000)
      res.setEncoding("utf8")
      let rawData = ""
      res.on("data", (chunk) => {
        rawData += chunk
      })
      res.on("end", () => {
        try {
          new window.Notice("https.get处理数据成功", 10000)
          e.success(rawData)
        } catch (error) {
          new window.Notice("https.get处理数据失败", 10000)
          e.error(error)
        }
      })
    }).on("error", (error) => {
      new window.Notice("https.get失败", 10000)
      e.error(error)
    })
  } catch (error) {
    new window.Notice("导入http出错", 10000)
    new window.Notice(JSON.stringify(error), 10000)
  }
}

function apProxy() {
  let ap
  this.regedit = function () {
    ap = window.ajaxPromise
    window.ajaxPromise = function (e) {
      if (eisURL(e)) {
        if (!matchUrl(e)) {
          return ap(e)
        }
      }
      return proxy(e)
    }
  }
  this.unRegedit = function () {
    window.ajaxPromise = ap
  }
}

function apCapacitor() {
  let ap
  this.regedit = function () {
    ap = window.Capacitor.registerPlugin("App").request
    window.Capacitor.registerPlugin("App").request = function (e) {
      if (eisURL(e)) {
        matchUrl(e)
      }
      ap(e)
    }
    console.log("apc注册成功")
  }
  this.unRegedit = function () {
    window.Capacitor.registerPlugin("App").request = ap
  }
}

function eisURL(e) {
  if (!e || !e.url) {
    return false
  }
  return include.some(item => item.match(e.url))
}

function apElectron() {
  let ap
  this.regedit = function () {
    ap = window.require("electron").ipcRenderer.send
    window.require("electron").ipcRenderer.send = function (a, b, e, ...rest) {
      if (eisURL(e)) {
        matchUrl(e)
      }
      ap(a, b, e, ...rest)
    }
    console.log("apc注册成功")
  }
  this.unRegedit = function () {
    window.require("electron").ipcRenderer.send = ap
  }
}

class ProxyGithubSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin)
    this.plugin = plugin
  }
  async display() {
    this.containerEl.empty()
    new Setting(this.containerEl)
      .setName("代理服务器")
      .setDesc(`通过选择不同的服务器来切换代理，可以解决某些情况下，某个服务器无法访问的情况。当前代理服务器：${this.plugin.settings.server}`)
      .addDropdown((dropDown) => {
        dropDown.addOption(server, "请选择")
        for (const one in proMap) {
          dropDown.addOption(one, one)
        }
        dropDown.onChange(async (value) => {
          this.plugin.settings.server = value
          await this.plugin.saveSettings()
        })
      })
  }
}

const app = new apProxy()
const apc = new apCapacitor()
const ape = new apElectron()
module.exports = class ProxyGithub extends Plugin {
  async onload() {
    this.addSettingTab(new ProxyGithubSettingTab(this.app, this))
    ape.regedit()
    apc.regedit()
    app.regedit()
    this.settings = { server: server }
    await this.loadSettings()
  }
  async loadSettings() {
    this.settings = Object.assign({}, { server: server }, await this.loadData())
  }
  async saveSettings() {
    await this.saveData(this.settings)
    server = this.settings.server
  }

  onunload() {
    ape.unRegedit()
    apc.unRegedit()
    app.unRegedit()
  }
}
