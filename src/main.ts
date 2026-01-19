import { Plugin, Platform, Setting, App, PluginSettingTab } from "obsidian"

class AppProxy {
  public sendHandle: any
  private proxyManager: ProxyManager

  constructor(proxyManager: ProxyManager) {
    this.proxyManager = proxyManager;
    ;(window as any).sendHandle = (window as any).electron.ipcRenderer.send
  }

  register() {
    ;(window as any).electron.ipcRenderer.send = (a: any, b: any, e: any, ...rest: any) => {
      UrlRewrite(e, this.proxyManager)
      ;(window as any).sendHandle(a, b, e, ...rest)
    }
  }

  unRegister() {
    ;(window as any).electron.ipcRenderer.send = (window as any).sendHandle
  }
}

class NativeProxy {
  private proxyManager: ProxyManager

  constructor(proxyManager: ProxyManager) {
    this.proxyManager = proxyManager;
    ;(window as any).sendHandle = (window as any).Capacitor.toNative
  }
  
  register() {
    ;(window as any).toNativeContainer = () => {
      ;(window as any).Capacitor.toNative = (a: any, b: any, c: any, d: any) => {
        if (a == "App" && b == "requestUrl") {
          UrlRewrite(c, this.proxyManager)
        }
        return (window as any).sendHandle(a, b, c, d)
      }
    }
    ;(window as any).toNativeContainer()
  }

  unRegister() {
    ;(window as any).Capacitor.toNative = (window as any).sendHandle
  }
}

interface ProxyConfig {
  enabled: boolean;
  proxyUrl: string;
  backupProxies: string[];
  enableHealthCheck: boolean;
  healthCheckInterval: number;
  lastHealthCheck: number;
  proxyStatus: "healthy" | "unhealthy" | "unknown";
}

const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  enabled: true,
  proxyUrl: "https://gh.llkk.cc/",
  backupProxies: [
    "https://ghproxy.com/",
    "https://mirror.ghproxy.com/",
    "https://gitclone.com/",
    "https://hub.fastgit.org/"
  ],
  enableHealthCheck: true,
  healthCheckInterval: 3600000, // 1 hour in milliseconds
  lastHealthCheck: 0,
  proxyStatus: "unknown"
};

function isNeedUrlRewrite(e: any): boolean {
  if (!e || !e.url) {
    return false
  }
  if (e.url.startsWith("https://github.com/") || e.url.startsWith("https://raw.githubusercontent.com/")) {
    return true
  }
  return false
}

class ProxyManager {
  private config: ProxyConfig;
  private currentProxyIndex: number = 0;
  private healthCheckTimeout: NodeJS.Timeout | null = null;

  constructor(config: ProxyConfig) {
    this.config = config;
  }

  getCurrentProxy(): string {
    if (this.currentProxyIndex === 0) {
      return this.config.proxyUrl;
    }
    return this.config.backupProxies[this.currentProxyIndex - 1];
  }

  rotateProxy(): void {
    const totalProxies = 1 + this.config.backupProxies.length;
    this.currentProxyIndex = (this.currentProxyIndex + 1) % totalProxies;
    
    console.log(`市场代理: 切换到代理 ${this.currentProxyIndex}: ${this.getCurrentProxy()}`);
  }

  async checkProxyHealth(): Promise<boolean> {
    if (!this.config.enableHealthCheck) {
      return true;
    }

    const testUrl = "https://raw.githubusercontent.com/521xueweihan/GitHub520/refs/heads/main/README.md";
    const proxyUrl = this.getCurrentProxy() + testUrl;
    
    try {
      const response = await fetch(proxyUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      this.config.proxyStatus = "healthy";
      this.config.lastHealthCheck = Date.now();
      return true;
    } catch (error) {
      console.warn(`市场代理: 健康检查失败 ${this.getCurrentProxy()}`, error);
      this.config.proxyStatus = "unhealthy";
      this.config.lastHealthCheck = Date.now();
      return false;
    }
  }

  startHealthCheck(): void {
    if (!this.config.enableHealthCheck || this.healthCheckTimeout) {
      return;
    }

    const checkAndRotate = async () => {
      const isHealthy = await this.checkProxyHealth();
      if (!isHealthy) {
        this.rotateProxy();
        console.log(`市场代理: 代理不健康，已切换到: ${this.getCurrentProxy()}`);
      }
      
      this.healthCheckTimeout = setTimeout(() => {
        checkAndRotate();
      }, this.config.healthCheckInterval);
    };

    checkAndRotate();
  }

  stopHealthCheck(): void {
    if (this.healthCheckTimeout) {
      clearTimeout(this.healthCheckTimeout);
      this.healthCheckTimeout = null;
    }
  }

  updateConfig(newConfig: Partial<ProxyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableHealthCheck !== undefined) {
      if (newConfig.enableHealthCheck) {
        this.startHealthCheck();
      } else {
        this.stopHealthCheck();
      }
    }
  }

  getConfig(): ProxyConfig {
    return { ...this.config };
  }

  getStatus(): { currentProxy: string; status: string; lastCheck: number } {
    return {
      currentProxy: this.getCurrentProxy(),
      status: this.config.proxyStatus,
      lastCheck: this.config.lastHealthCheck
    };
  }
}

function UrlRewrite(e: any, proxyManager: ProxyManager): void {
  if (e && e.url && isNeedUrlRewrite(e)) {
    const src = e.url
    e.url = proxyManager.getCurrentProxy() + e.url

    if ((window as any).Capacitor.isLoggingEnabled) {
      window.console.info(JSON.stringify({ 源地址: src, 代理地址: e.url }))
    }
    if (!e.headers) {
      e.headers = {}
    }
    e.headers["content-type"] = "application/x-www-form-urlencoded"
    e.headers["Access-Control-Allow-Origin"] = "*"
  }
}

export default class MarketProxy extends Plugin {
  proxy: AppProxy | NativeProxy
  proxyManager: ProxyManager
  settings: ProxyConfig

  async onload() {
    await this.loadSettings();
    
    this.proxyManager = new ProxyManager(this.settings);
    
    if (Platform.isDesktop) {
      this.proxy = new AppProxy(this.proxyManager)
    } else {
      this.proxy = new NativeProxy(this.proxyManager)
    }
    
    this.proxy.register();
    
    if (this.settings.enableHealthCheck) {
      this.proxyManager.startHealthCheck();
    }

    this.addSettingTab(new MarketProxySettingTab(this.app, this));
  }

  onunload() {
    this.proxyManager.stopHealthCheck();
    this.proxy.unRegister();
  }

  async loadSettings() {
    const defaultConfig = DEFAULT_PROXY_CONFIG;
    const savedData = await this.loadData();
    
    if (savedData) {
      // Merge saved settings with defaults
      this.settings = {
        ...defaultConfig,
        ...savedData,
        backupProxies: savedData.backupProxies || defaultConfig.backupProxies
      };
    } else {
      this.settings = defaultConfig;
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
    if (this.proxyManager) {
      this.proxyManager.updateConfig(this.settings);
    }
  }

  getStatus() {
    return this.proxyManager ? this.proxyManager.getStatus() : null;
  }
}

class MarketProxySettingTab extends PluginSettingTab {
  plugin: MarketProxy;

  constructor(app: App, plugin: MarketProxy) {
    super(app, plugin);
    this.plugin = plugin;
    this.icon = 'globe'; // 使用地球图标表示代理功能
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '市场代理设置' });

    // Enable/Disable toggle
    new Setting(containerEl)
      .setName('启用代理')
      .setDesc('启用或禁用代理功能')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enabled)
        .onChange(async (value) => {
          this.plugin.settings.enabled = value;
          await this.plugin.saveSettings();
        }));

    // Main proxy URL
    new Setting(containerEl)
      .setName('主代理地址')
      .setDesc('主要代理服务器地址 (例如: https://gh.llkk.cc/)')
      .addText(text => text
        .setPlaceholder('https://gh.llkk.cc/')
        .setValue(this.plugin.settings.proxyUrl)
        .onChange(async (value) => {
          this.plugin.settings.proxyUrl = value.endsWith('/') ? value : value + '/';
          await this.plugin.saveSettings();
        }));

    // Backup proxies
    new Setting(containerEl)
      .setName('备用代理列表')
      .setDesc('备用代理服务器列表 (每行一个)')
      .addTextArea(text => text
        .setPlaceholder('https://ghproxy.com/\nhttps://mirror.ghproxy.com/')
        .setValue(this.plugin.settings.backupProxies.join('\n'))
        .onChange(async (value) => {
          this.plugin.settings.backupProxies = value
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.endsWith('/') ? line : line + '/');
          await this.plugin.saveSettings();
        }));

    // Health check toggle
    new Setting(containerEl)
      .setName('启用健康检查')
      .setDesc('自动检查代理健康状况并在需要时切换代理')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableHealthCheck)
        .onChange(async (value) => {
          this.plugin.settings.enableHealthCheck = value;
          await this.plugin.saveSettings();
        }));

    // Health check interval
    new Setting(containerEl)
      .setName('健康检查间隔')
      .setDesc('检查代理健康状况的频率 (单位: 小时)')
      .addSlider(slider => slider
        .setLimits(1, 24, 1)
        .setValue(this.plugin.settings.healthCheckInterval / 3600000)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.healthCheckInterval = value * 3600000;
          await this.plugin.saveSettings();
        }));

    // Status display
    const status = this.plugin.getStatus();
    if (status) {
      containerEl.createEl('hr');
      containerEl.createEl('h3', { text: '当前状态' });
      
      const statusDiv = containerEl.createEl('div', { cls: 'market-proxy-status' });
      
      const statusText = statusDiv.createEl('p');
      statusText.innerHTML = `
        <strong>当前代理:</strong> ${status.currentProxy}<br>
        <strong>状态:</strong> <span class="status-${status.status}">${this.getStatusText(status.status)}</span><br>
        <strong>最后检查:</strong> ${new Date(status.lastCheck).toLocaleString('zh-CN')}
      `;

      // Manual health check button
      new Setting(containerEl)
        .setName('手动健康检查')
        .setDesc('立即检查当前代理的健康状况')
        .addButton(button => button
          .setButtonText('立即检查')
          .setCta()
          .onClick(async () => {
            if (this.plugin.proxyManager) {
              const isHealthy = await this.plugin.proxyManager.checkProxyHealth();
              this.display(); // Refresh the settings tab
            }
          }));

      // Rotate proxy button
      new Setting(containerEl)
        .setName('切换代理')
        .setDesc('切换到列表中的下一个代理')
        .addButton(button => button
          .setButtonText('切换')
          .onClick(async () => {
            if (this.plugin.proxyManager) {
              this.plugin.proxyManager.rotateProxy();
              this.display(); // Refresh the settings tab
            }
          }));
    }

    // Reset to defaults button
    new Setting(containerEl)
      .setName('恢复默认设置')
      .setDesc('将所有设置恢复为默认值')
      .addButton(button => button
        .setButtonText('重置')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings = { ...DEFAULT_PROXY_CONFIG };
          await this.plugin.saveSettings();
          this.display(); // Refresh the settings tab
        }));
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'healthy': return '健康';
      case 'unhealthy': return '不健康';
      case 'unknown': return '未知';
      default: return status;
    }
  }
}
